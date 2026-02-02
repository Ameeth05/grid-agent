'use client'

import { motion } from 'framer-motion'
import {
  GitBranch,
  FileSearch,
  Shield,
  BarChart3,
  Globe2,
  Clock,
  Sparkles,
  Database,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: GitBranch,
    title: 'Queue Intelligence',
    description: 'Real-time tracking of 12,000+ interconnection queue positions. Get instant alerts on status changes, milestone completions, and project withdrawals.',
    highlight: 'Real-time tracking',
  },
  {
    icon: FileSearch,
    title: 'Cluster Study Analysis',
    description: 'Deep analysis of cluster study results including network upgrade cost allocations, affected system impacts, and cost sharing arrangements.',
    highlight: 'Deep analysis',
  },
  {
    icon: Shield,
    title: 'FERC Policy Intelligence',
    description: 'Automated monitoring of FERC rulings, Order 2023 compliance, and regulatory developments. Never miss a policy change that affects your projects.',
    highlight: 'Automated monitoring',
  },
  {
    icon: BarChart3,
    title: 'Risk Quantification',
    description: 'AI-powered risk scoring for upgrade cost exposure, queue position threats, cluster withdrawal patterns, and timeline delays.',
    highlight: 'AI-powered scoring',
  },
  {
    icon: TrendingUp,
    title: 'Market Analytics',
    description: 'LMP analysis, congestion forecasting, and capacity market insights across all ISOs. Make data-driven investment decisions.',
    highlight: 'Data-driven decisions',
  },
  {
    icon: AlertCircle,
    title: 'Proactive Alerts',
    description: 'Get notified instantly when projects near yours withdraw, upgrade costs change, or stakeholder meetings are scheduled.',
    highlight: 'Instant notifications',
  },
]

const isos = [
  { name: 'PJM', projects: '5,234', color: 'from-blue-500 to-blue-600' },
  { name: 'MISO', projects: '3,847', color: 'from-green-500 to-green-600' },
  { name: 'SPP', projects: '1,523', color: 'from-yellow-500 to-yellow-600' },
  { name: 'ERCOT', projects: '1,456', color: 'from-orange-500 to-orange-600' },
  { name: 'NYISO', projects: '432', color: 'from-purple-500 to-purple-600' },
  { name: 'ISONE', projects: '355', color: 'from-red-500 to-red-600' },
]

const capabilities = [
  { label: 'Natural Language Queries', description: 'Ask questions in plain English' },
  { label: 'Document Analysis', description: 'Upload PDFs, spreadsheets, studies' },
  { label: 'Custom Reports', description: 'Generate investor-ready reports' },
  { label: 'API Access', description: 'Integrate with your workflows' },
]

export function Features() {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-electric-500/20 bg-electric-500/5">
            <Sparkles className="h-4 w-4 text-electric-500" />
            <span className="text-sm font-medium text-electric-600 dark:text-electric-400">
              Purpose-built for power markets
            </span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Everything you need for{' '}
            <span className="bg-gradient-to-r from-electric-500 via-grid-400 to-energy-500 bg-clip-text text-transparent">
              grid intelligence
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            From interconnection queue tracking to FERC policy analysis, GridAgent gives you
            comprehensive coverage across all major US ISOs in one unified platform.
          </p>

          {/* ISO Coverage Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto mb-16">
            {isos.map((iso, index) => (
              <motion.div
                key={iso.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="group relative p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-electric-500/30 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${iso.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`} />
                <div className="relative">
                  <div className="text-lg font-bold font-display">{iso.name}</div>
                  <div className="text-xs text-muted-foreground">{iso.projects} projects</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature Cards - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="group h-full border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-electric-500/30 transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-500/10 to-grid-500/10 flex items-center justify-center mb-4 group-hover:from-electric-500/20 group-hover:to-grid-500/20 transition-all duration-300">
                      <feature.icon className="h-6 w-6 text-electric-500" />
                    </div>
                    <span className="text-[10px] font-mono text-electric-500 bg-electric-500/10 px-2 py-1 rounded-full">
                      {feature.highlight}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-display">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Capabilities Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm"
        >
          {capabilities.map((cap, index) => (
            <div key={cap.label} className="text-center">
              <div className="font-display font-semibold text-lg mb-1">{cap.label}</div>
              <div className="text-sm text-muted-foreground">{cap.description}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
