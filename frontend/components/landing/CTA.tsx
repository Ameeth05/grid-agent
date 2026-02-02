'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function CTA() {
  const router = useRouter()

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-electric-500/5 to-transparent pointer-events-none" />

      <div className="container max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-electric-500/20 bg-electric-500/5">
            <Sparkles className="h-4 w-4 text-electric-500" />
            <span className="text-sm font-medium text-electric-600 dark:text-electric-400">
              No credit card required
            </span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Ready to transform your{' '}
            <span className="bg-gradient-to-r from-electric-500 via-grid-400 to-energy-500 bg-clip-text text-transparent">
              grid research?
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Join developers, investors, and analysts who are already using GridAgent
            to make smarter decisions in US power markets.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => router.push('/chat')}
              size="lg"
              className="group bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-600 hover:to-electric-700 text-white px-10 py-7 text-lg rounded-xl shadow-xl shadow-electric-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-electric-500/30"
            >
              Start Analyzing Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/about')}
              className="px-10 py-7 text-lg rounded-xl border-2 hover:bg-muted/50"
            >
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-electric-500" />
              <span>Free tier available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-electric-500" />
              <span>No setup required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-electric-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
