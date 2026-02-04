'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Send, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { submitDemoRequest } from '@/lib/services/demoRequests'

interface DemoRequestFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  source?: 'hero' | 'cta' | 'landing' | 'header'
}

export function DemoRequestForm({ open, onOpenChange, source = 'landing' }: DemoRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    position: '',
    email: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await submitDemoRequest({
        ...formData,
        source,
      })
      setIsSubmitted(true)

      // Reset after showing success
      setTimeout(() => {
        setIsSubmitted(false)
        setFormData({ name: '', company: '', position: '', email: '', message: '' })
        onOpenChange(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-electric-500/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500 to-electric-600 flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="GridAgent"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <DialogTitle className="text-2xl font-display">Request a Demo</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Get personalized walkthrough of GridAgent for your team.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-electric-500/10 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-electric-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Request Submitted!</h3>
            <p className="text-muted-foreground">We'll be in touch within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-electric-500">*</span>
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-background/50 border-border/50 focus:border-electric-500/50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium">
                  Company <span className="text-electric-500">*</span>
                </label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Acme Energy"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  className="bg-background/50 border-border/50 focus:border-electric-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="position" className="text-sm font-medium">
                  Position <span className="text-electric-500">*</span>
                </label>
                <Input
                  id="position"
                  name="position"
                  placeholder="Senior Analyst"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="bg-background/50 border-border/50 focus:border-electric-500/50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-electric-500">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@acme.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-background/50 border-border/50 focus:border-electric-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us about your use case..."
                value={formData.message}
                onChange={handleChange}
                rows={3}
                className="bg-background/50 border-border/50 focus:border-electric-500/50 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-600 hover:to-electric-700 text-white py-6 text-base rounded-xl shadow-lg shadow-electric-500/25"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
