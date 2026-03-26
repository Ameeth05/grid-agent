'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  BrainCircuit,
  Zap,
  Radio,
  Sparkles,
  Activity,
  Bot,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Bot,
    title: 'Track Your Portfolio',
    description: 'Track Queue Positions, ISO Stakeholder Meetings, and Orders that matter to your portfolio. Cut the noise and focus on data that matters to you.',
    highlight: 'Portfolio',
  },
  {
    icon: Activity,
    title: 'Real Time Tracking',
    description: 'Track Interconnection Queue in Real time with instant alerts on status changes, milestone completions, and project withdrawals.',
    highlight: 'Live Updates',
    featured: true,
  },
  {
    icon: Radio,
    title: 'Stakeholder Meeting Coverage',
    description: 'Keep updated on all the latest Stakeholder Meetings with comprehensive coverage across all major US ISOs in one unified platform.',
    highlight: 'Full Coverage',
  },
  {
    icon: BrainCircuit,
    title: 'Cluster Analysis',
    description: 'Deep analysis of cluster study results including network upgrade cost allocations, affected system impacts, and cost sharing arrangements.',
    highlight: 'Deep Analysis',
  },
  {
    icon: Zap,
    title: 'Risk Assessment',
    description: 'AI-powered risk scoring for upgrade cost exposure, queue position threats, cluster withdrawal patterns, and timeline delays.',
    highlight: 'AI Risk Scoring',
  },
  {
    icon: Sparkles,
    title: 'M&A Intelligence',
    description: 'Track project acquisitions, ownership changes, and market consolidation trends across all ISOs for investment decisions.',
    highlight: 'Market Intel',
  },
]

const isos = [
  { name: 'PJM' },
  { name: 'MISO' },
  { name: 'SPP' },
  { name: 'ERCOT' },
  { name: 'ISONE' },
  { name: 'NYISO' },
]

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isInView }
}

export function Features() {
  const headerRef = useInView()
  const cardsRef = useInView()

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-12 bg-[#080a00] relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(200, 255, 50, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 255, 50, 0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="max-w-6xl mx-auto relative">
        {/* Section Header - Kimi style */}
        <div
          ref={headerRef.ref}
          className={`text-center mb-16 transition-all duration-1000 ease-out ${
            headerRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-lime/20 bg-lime/5">
            <Image
              src="/logo.png"
              alt="Gridsurf"
              width={16}
              height={16}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-lime">
              Build Your Workflow
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-light mb-6 text-white">
            <span className="text-lime text-glow-lime">
              Automate Your Workflows
            </span>
            <br />
            <span className="text-white/90">with our agents</span>
          </h2>

          <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            Comprehensive coverage across all major US ISOs in one unified platform.
          </p>

          {/* ISO Coverage - Kimi style badges */}
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto mb-16">
            {isos.map((iso, index) => (
              <div
                key={iso.name}
                className={`group relative px-6 py-3 rounded-full border border-lime/20 bg-lime/5 hover:border-lime/40 hover:bg-lime/10 transition-all duration-300 ${
                  headerRef.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="text-lg font-semibold text-white group-hover:text-lime transition-colors duration-300">
                  {iso.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Cards - Kimi style bento grid */}
        <div ref={cardsRef.ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`transition-all duration-600 ease-out ${
                cardsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Card className={`group h-full border-lime/10 bg-[#0d1005]/50 backdrop-blur-sm hover:bg-[#0d1005]/80 hover:border-lime/30 transition-all duration-300 overflow-hidden ${feature.featured ? 'ring-1 ring-lime/30' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-xl bg-lime/10 flex items-center justify-center mb-4 group-hover:bg-lime/20 transition-all duration-300`}>
                      <feature.icon className={`h-7 w-7 text-lime`} />
                    </div>
                    <span className="text-[10px] font-mono text-lime bg-lime/10 px-2 py-1 rounded-full uppercase tracking-wider">
                      {feature.highlight}
                    </span>
                  </div>
                  <CardTitle className={`text-white font-medium ${feature.featured ? 'text-2xl' : 'text-xl'}`}>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className={`text-white/50 leading-relaxed ${feature.featured ? 'text-base' : 'text-sm'}`}>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
