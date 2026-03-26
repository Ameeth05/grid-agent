'use client'

import { motion } from 'framer-motion'
import { Quote, Building2, Zap, Target, Clock, CheckCircle2 } from 'lucide-react'

const testimonials = [
  {
    quote: "Our agent reduced our interconnection queue analysis from 3 weeks to 30 minutes. It's become indispensable for our due diligence process.",
    author: "Director of Grid Development",
    company: "PE-backed IPP",
    metric: "95% time saved",
  },
  {
    quote: "Finally, an AI that actually understands power markets. The cluster study analysis alone has saved us from two bad investments.",
    author: "VP of Asset Development",
    company: "Renewable Energy Developer",
    metric: "2 bad deals avoided",
  },
  {
    quote: "We use our agent to monitor our entire portfolio's queue positions. The proactive alerts have been game-changing.",
    author: "Portfolio Manager",
    company: "Infrastructure Fund",
    metric: "500+ projects tracked",
  },
]

const useCases = [
  {
    icon: Target,
    title: 'M&A Due Diligence',
    description: 'Evaluate interconnection risk for project acquisitions in hours, not weeks.',
  },
  {
    icon: Building2,
    title: 'Portfolio Monitoring',
    description: 'Track queue positions, milestone deadlines, and upgrade cost changes across your entire portfolio.',
  },
  {
    icon: Clock,
    title: 'Regulatory Compliance',
    description: 'Stay ahead of FERC policy changes and stakeholder meeting deadlines.',
  },
]

const stats = [
  { value: '$2.3B+', label: 'Projects analyzed' },
  { value: '50+', label: 'Data sources integrated' },
  { value: '6', label: 'ISOs covered' },
  { value: '<30s', label: 'Average response time' },
]

export function SocialProof() {
  return (
    <section className="py-24 px-4">
      <div className="container max-w-7xl mx-auto">
        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-24"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-2xl bg-gradient-to-r from-electric-500/5 via-grid-400/5 to-energy-500/5 border border-electric-500/10">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div className="font-display text-4xl sm:text-5xl font-bold bg-gradient-to-r from-electric-500 to-grid-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-24"
        >
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Trusted by power market professionals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From PE-backed developers to infrastructure funds, our agent is the go-to tool for grid intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-electric-500/30 transition-all duration-300"
              >
                <Quote className="h-8 w-8 text-electric-500/20 mb-4" />
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.company}</div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-electric-500/10 text-electric-500 text-xs font-mono">
                    {testimonial.metric}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Use Cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Built for your workflow
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're evaluating a new acquisition or monitoring an existing portfolio, our agent fits right in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center p-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-electric-500/10 to-grid-500/10 flex items-center justify-center mx-auto mb-6">
                  <useCase.icon className="h-8 w-8 text-electric-500" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{useCase.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
