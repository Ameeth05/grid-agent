'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowRight, Activity, TrendingUp, Shield, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { GridAnimation } from './GridAnimation'
import { PromptChips } from './PromptChips'

const rotatingWords = [
  'Due Diligence',
  'Queue Analysis',
  'Risk Assessment',
  'FERC Research',
  'Cost Modeling',
]

const liveMetrics = [
  { label: 'Queue Projects', value: '12,847', icon: Activity, change: '+234 this week' },
  { label: 'ISOs Tracked', value: '6', icon: TrendingUp, change: 'PJM, MISO, ERCOT...' },
  { label: 'Data Sources', value: '50+', icon: Shield, change: 'FERC, OASIS, ISO APIs' },
  { label: 'Avg Response', value: '<30s', icon: Clock, change: 'vs weeks manual' },
]

export function Hero() {
  const [query, setQuery] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.trim()) {
      router.push(`/chat?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handlePromptClick = (prompt: string) => {
    setQuery(prompt)
    router.push(`/chat?q=${encodeURIComponent(prompt)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0">
        <GridAnimation />
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-radial from-electric-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        {/* Live indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-electric-500/20 bg-electric-500/5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-electric-500"></span>
            </span>
            <span className="text-sm font-medium text-electric-600 dark:text-electric-400">
              Live Grid Intelligence
            </span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs text-muted-foreground">12,847 projects tracked</span>
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-center mb-6"
        >
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4">
            <span className="text-foreground">Power Market</span>
            <br />
            <span className="bg-gradient-to-r from-electric-500 via-grid-400 to-energy-500 bg-clip-text text-transparent">
              Intelligence
            </span>
          </h1>

          {/* Rotating subtitle */}
          <div className="h-12 flex items-center justify-center">
            <span className="text-xl sm:text-2xl md:text-3xl text-muted-foreground font-medium">
              AI-powered{' '}
            </span>
            <div className="relative h-[1.5em] w-[220px] sm:w-[280px] ml-2 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 text-xl sm:text-2xl md:text-3xl font-semibold text-electric-500"
                >
                  {rotatingWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Value proposition */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-12 leading-relaxed"
        >
          Transform <span className="text-foreground font-medium">weeks of manual research</span> into
          <span className="text-foreground font-medium"> minutes</span>. Analyze interconnection queues,
          FERC filings, cluster studies, and market risks across{' '}
          <span className="text-electric-500 font-medium">all major US ISOs</span>.
        </motion.p>

        {/* Chat Input - Premium treatment */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onSubmit={handleSubmit}
          className="relative max-w-3xl mx-auto mb-8"
        >
          <div className="relative group">
            {/* Animated border glow */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-electric-500/50 via-grid-400/50 to-energy-500/50 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 group-focus-within:opacity-60 transition-opacity duration-500" />
            <div className="absolute -inset-[1px] bg-gradient-to-r from-electric-500 via-grid-400 to-energy-500 rounded-2xl opacity-0 group-hover:opacity-20 group-focus-within:opacity-30 transition-opacity duration-300" />

            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-electric-500/5">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about interconnection queue positions, cluster study results, FERC Order 2023 impacts..."
                className="min-h-[140px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-16 text-base sm:text-lg placeholder:text-muted-foreground/60"
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {query.length > 0 ? 'Enter to send' : ''}
                </span>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!query.trim()}
                  className="h-11 w-11 rounded-xl bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-600 hover:to-electric-700 disabled:opacity-50 shadow-lg shadow-electric-500/25 transition-all duration-300"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.form>

        {/* Example Prompts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <PromptChips onPromptClick={handlePromptClick} />
        </motion.div>

        {/* Live metrics strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {liveMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
              className="group relative p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-electric-500/30 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-2">
                <metric.icon className="h-4 w-4 text-electric-500" />
                <span className="text-[10px] text-muted-foreground font-mono">LIVE</span>
              </div>
              <div className="font-display text-2xl font-bold text-foreground mb-1">
                {metric.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium mb-1">
                {metric.label}
              </div>
              <div className="text-[10px] text-electric-500/80 truncate">
                {metric.change}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA for non-authenticated users */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            onClick={() => router.push('/chat')}
            size="lg"
            className="group bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-600 hover:to-electric-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-electric-500/25"
          >
            Start Analyzing
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <span className="text-sm text-muted-foreground">
            No credit card required
          </span>
        </motion.div>
      </div>
    </section>
  )
}
