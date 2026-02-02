'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Zap, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { SignInButton } from '@/components/auth/SignInButton'
import { UserProfile } from '@/components/auth/UserProfile'
import { useAuth } from '@/hooks/useAuth'

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/chat', label: 'GridAgent' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/blog', label: 'Blog' },
  { href: '/news', label: 'News' },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-display font-bold text-xl">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-electric-500 to-electric-600 text-white shadow-lg shadow-electric-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            GridAgent
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                pathname === link.href
                  ? 'text-electric-500'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {link.label}
              {pathname === link.href && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-electric-500 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden md:block">
            {isAuthenticated ? (
              <UserProfile user={user} />
            ) : (
              <SignInButton />
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

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t bg-background/95 backdrop-blur-xl"
          >
            <nav className="container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                    pathname === link.href
                      ? 'bg-electric-500/10 text-electric-500'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-4 px-4 border-t mt-2">
                {isAuthenticated ? (
                  <UserProfile user={user} />
                ) : (
                  <SignInButton className="w-full" />
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
