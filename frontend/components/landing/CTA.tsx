'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DemoRequestForm } from '@/components/landing/DemoRequestForm'

export function CTA() {
  const router = useRouter()
  const [demoFormOpen, setDemoFormOpen] = useState(false)

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-12 relative overflow-hidden bg-[#080a00]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lime/5 to-transparent pointer-events-none" />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-gradient-radial from-lime/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-lime/20 bg-lime/5">
            <Sparkles className="h-4 w-4 text-lime" />
            <span className="text-sm font-medium text-lime">
              Get Started Today
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-light mb-6 text-white">
            Ready to transform your{' '}
            <span className="text-lime text-glow-lime">
              grid research?
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Join developers, investors, and analysts who are already using GridAgent
            to make smarter decisions in US power markets.
          </p>

          {/* CTA Buttons - Kimi style */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => setDemoFormOpen(true)}
              size="lg"
              className="group bg-lime text-[#080a00] font-semibold px-10 py-7 text-lg rounded-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(200,255,50,0.5)] transition-all duration-300"
            >
              Request a Demo
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/about')}
              className="px-10 py-7 text-lg rounded-xl border-lime/30 text-white bg-transparent hover:bg-lime/10 hover:border-lime/50 transition-all duration-300"
            >
              Learn More
            </Button>
          </div>

          {/* Trust indicators - Kimi style */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-lime animate-pulse" />
              <span>All US ISOs covered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-lime animate-pulse" />
              <span>Real-time updates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-lime animate-pulse" />
              <span>AI-powered analysis</span>
            </div>
          </div>
        </motion.div>
      </div>

      <DemoRequestForm open={demoFormOpen} onOpenChange={setDemoFormOpen} />
    </section>
  )
}
