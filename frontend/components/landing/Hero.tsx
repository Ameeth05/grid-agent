'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { GridAnimation } from './GridAnimation'
import { PromptChips } from './PromptChips'
import { DemoRequestForm } from './DemoRequestForm'

const rotatingWords = [
  'Transmission Cost Analysis',
  'Interconnection Queues',
  'Cluster Result Analysis',
  'ISO Stakeholder Meetings',
]

export function Hero() {
  const [query, setQuery] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [demoFormOpen, setDemoFormOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setDemoFormOpen(true)
  }

  const handlePromptClick = (prompt: string) => {
    setQuery(prompt)
    setDemoFormOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-[#080a00]">
      {/* Background Animation */}
      <div className="absolute inset-0">
        <GridAnimation />
      </div>

      {/* Gradient overlays for depth - Kimi style */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080a00] via-transparent to-[#080a00] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#080a00] via-transparent to-[#080a00] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto pt-20">
        {/* Main headline - Kimi style with light font weight */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight mb-6 text-white">
            AI Agents For{' '}
            <span className="text-lime text-glow-lime">
              US Power Market Intelligence
            </span>
          </h1>

          {/* Rotating subtitle */}
          <div className="h-16 flex items-baseline justify-center gap-3">
            <span className="text-xl sm:text-2xl md:text-3xl text-white/60 font-light">
              AI-Powered
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl text-white/40 font-light">—</span>
            <div className="relative w-[260px] sm:w-[340px] md:w-[400px] overflow-visible">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="inline-block text-xl sm:text-2xl md:text-3xl font-semibold text-lime whitespace-nowrap"
                >
                  {rotatingWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Chat Input - Kimi style with lime glow */}
        <motion.form
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
          onSubmit={handleSubmit}
          className="relative max-w-4xl mx-auto mb-10"
        >
          <div className="relative group">
            {/* Lime glow effect */}
            <div className="absolute -inset-[2px] bg-lime/20 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-px bg-gradient-to-r from-lime/30 via-lime/50 to-lime/30 rounded-2xl opacity-50" />

            <div className="relative bg-[#0d1005]/80 backdrop-blur-xl border border-lime/20 rounded-2xl shadow-2xl">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Generation Interconnection, Cluster Results, Interconnection Queue, ISO Meetings..."
                className="min-h-[180px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-16 text-base sm:text-lg text-white placeholder:text-white/40 p-6"
              />
              <div className="absolute right-4 bottom-4 flex items-center gap-2">
                <span className="text-xs text-white/40 hidden sm:block">
                  {query.length > 0 ? 'Enter to submit' : ''}
                </span>
                <Button
                  type="submit"
                  size="icon"
                  className="h-14 w-14 rounded-xl bg-lime text-[#080a00] hover:scale-105 hover:shadow-[0_0_20px_rgba(200,255,50,0.4)] transition-all duration-300"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </motion.form>

        {/* Example Prompts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <PromptChips onPromptClick={handlePromptClick} />
        </motion.div>

        {/* CTA Button - Kimi style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-12 flex items-center justify-center"
        >
          <Button
            onClick={() => setDemoFormOpen(true)}
            size="lg"
            className="group bg-lime text-[#080a00] font-semibold px-10 py-7 text-lg rounded-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(200,255,50,0.5)] transition-all duration-300"
          >
            <Image
              src="/logo.png"
              alt="GridAgent"
              width={20}
              height={20}
              className="mr-2 h-5 w-5"
            />
            Start Analyzing
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Scroll indicator - Kimi style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/40 text-xs uppercase tracking-widest">Scroll to explore</span>
          <div className="w-px h-12 bg-gradient-to-b from-lime/50 to-transparent" />
        </motion.div>
      </div>

      {/* Demo Request Form Modal */}
      <DemoRequestForm open={demoFormOpen} onOpenChange={setDemoFormOpen} />
    </section>
  )
}
