import { createClient } from '@/lib/supabase/client'

export interface DemoRequestData {
  name: string
  email: string
  company: string
  position: string
  message?: string
  source?: 'hero' | 'cta' | 'landing' | 'header'
}

export async function submitDemoRequest(data: DemoRequestData): Promise<void> {
  const supabase = createClient()

  if (!supabase) {
    // Local dev mode - simulate success
    console.log('[LOCAL_DEV] Demo request submitted:', data)
    await new Promise(resolve => setTimeout(resolve, 500))
    return
  }

  const { error } = await supabase.from('demo_requests').insert({
    name: data.name,
    email: data.email,
    company: data.company,
    position: data.position,
    message: data.message || null,
    source: data.source || 'landing',
  })

  if (error) {
    console.error('Demo request submission error:', error)
    throw new Error('Failed to submit demo request. Please try again.')
  }
}
