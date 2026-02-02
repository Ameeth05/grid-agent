'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap, BarChart2, FileSearch, AlertTriangle } from 'lucide-react'

const examplePrompts = [
  {
    text: "What's the total network upgrade cost risk for projects in PJM TC2 Phase?",
    short: "TC2 Upgrade Costs",
    icon: BarChart2,
    category: "Cost Analysis",
  },
  {
    text: "Analyze withdrawal patterns in MISO West cluster studies from 2024",
    short: "MISO Withdrawals",
    icon: AlertTriangle,
    category: "Risk Analysis",
  },
  {
    text: "Compare solar vs battery interconnection timelines across all ISOs",
    short: "Timeline Compare",
    icon: FileSearch,
    category: "Queue Analysis",
  },
]

interface PromptChipsProps {
  onPromptClick: (prompt: string) => void
}

export function PromptChips({ onPromptClick }: PromptChipsProps) {
  return (
    <div className="space-y-3">
      <div className="text-center text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">
        Try asking
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {examplePrompts.map((prompt, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
            onClick={() => onPromptClick(prompt.text)}
            className="group relative px-4 py-3 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-electric-500/30 transition-all duration-300"
          >
            <span className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-electric-500/10 text-electric-500 group-hover:bg-electric-500/20 transition-colors">
                <prompt.icon className="h-4 w-4" />
              </span>
              <span className="flex flex-col items-start">
                <span className="text-[10px] text-electric-500 font-mono uppercase tracking-wider">
                  {prompt.category}
                </span>
                <span className="text-sm text-foreground font-medium">
                  {prompt.short}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all ml-2" />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
