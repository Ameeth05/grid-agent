'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { SignInButton } from '@/components/auth/SignInButton'
import { UserProfile } from '@/components/auth/UserProfile'
import { DemoRequestForm } from '@/components/landing/DemoRequestForm'
import { useAuth } from '@/hooks/useAuth'

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const [demoFormOpen, setDemoFormOpen] = useState(false)

  // Scroll detection for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-lime-500/10'
          : 'bg-transparent'
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo with Kimi-style letter-spacing animation */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-lime overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(200,255,50,0.4)]">
            <Image
              src="/logo.png"
              alt="Gridsurf"
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="hidden sm:inline text-xl font-bold tracking-[0.1em] transition-all duration-300 group-hover:tracking-[0.15em] text-lime">
            GRIDSURF
          </span>
        </Link>

        {/* Spacer to push right side items */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Navigation and Auth buttons inline */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/about"
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors duration-300',
                pathname === '/about'
                  ? 'text-lime'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              About
            </Link>
            {isAuthenticated ? (
              <UserProfile user={user} />
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setDemoFormOpen(true)}
                  className="border-lime/30 text-foreground hover:bg-lime/10 hover:border-lime/50 font-medium px-5 transition-all duration-300"
                >
                  Request Demo
                </Button>
                <SignInButton
                  className="bg-lime text-[#080a00] font-semibold px-6 hover:scale-105 hover:shadow-[0_0_20px_rgba(200,255,50,0.4)] transition-all duration-300"
                />
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation - CSS transition */}
      <div
        className={cn(
          'md:hidden border-t border-lime-500/10 bg-background/95 backdrop-blur-xl overflow-hidden transition-all duration-200 ease-out',
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <nav className="container py-4 flex flex-col gap-1">
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              'px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300',
              pathname === '/about'
                ? 'bg-lime/10 text-lime'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            About
          </Link>

          <div className="pt-4 px-4 border-t border-lime-500/10 mt-2 space-y-3">
            {isAuthenticated ? (
              <UserProfile user={user} />
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDemoFormOpen(true)
                    setMobileMenuOpen(false)
                  }}
                  className="w-full border-lime/30 text-foreground hover:bg-lime/10 hover:border-lime/50 font-medium transition-all duration-300"
                >
                  Request Demo
                </Button>
                <SignInButton
                  className="w-full bg-lime text-[#080a00] font-semibold hover:shadow-[0_0_20px_rgba(200,255,50,0.4)] transition-all duration-300"
                />
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Demo Request Form Dialog */}
      <DemoRequestForm
        open={demoFormOpen}
        onOpenChange={setDemoFormOpen}
        source="header"
      />
    </header>
  )
}
