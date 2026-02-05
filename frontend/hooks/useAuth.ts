'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// Local development mode - bypass Supabase auth
const LOCAL_DEV = process.env.NEXT_PUBLIC_LOCAL_DEV === 'true'

// Mock user for local development
const MOCK_USER: User = {
  id: 'local-dev-user',
  email: 'dev@localhost',
  app_metadata: {},
  user_metadata: { name: 'Local Developer' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

const MOCK_SESSION: Session = {
  access_token: 'local-dev-token',
  refresh_token: 'local-dev-refresh',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: MOCK_USER,
}

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: Error | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: LOCAL_DEV ? MOCK_USER : null,
    session: LOCAL_DEV ? MOCK_SESSION : null,
    loading: !LOCAL_DEV,
    error: null,
  })

  // Use singleton Supabase client (memoized to prevent re-creation)
  const supabase = useMemo(() => LOCAL_DEV ? null : createClient(), [])

  useEffect(() => {
    // LOCAL_DEV: Already have mock user, skip Supabase
    if (LOCAL_DEV) {
      return
    }

    // If Supabase client failed to initialize (missing env vars), stop loading
    if (!supabase) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: new Error('Supabase not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
      }))
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to get session'),
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        })
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (LOCAL_DEV || !supabase) {
      console.log('LOCAL_DEV: signInWithEmail is a no-op')
      return
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setState(prev => ({ ...prev, error }))
      throw error
    }
  }, [supabase])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (LOCAL_DEV || !supabase) {
      console.log('LOCAL_DEV: signUpWithEmail is a no-op')
      return
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setState(prev => ({ ...prev, error }))
      throw error
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    if (LOCAL_DEV || !supabase) {
      console.log('LOCAL_DEV: signOut is a no-op')
      return
    }
    const { error } = await supabase.auth.signOut()

    if (error) {
      setState(prev => ({ ...prev, error }))
    }
  }, [supabase])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (LOCAL_DEV) {
      return 'local-dev-token'
    }
    if (!supabase) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, [supabase])

  return {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    getAccessToken,
    isAuthenticated: !!state.user,
  }
}
