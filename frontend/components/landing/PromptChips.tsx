'use client'

import { TrendingUp, Filter, BarChart3 } from 'lucide-react'

const examplePrompts = [
  {
    text: "What was discussed in the latest PJM RTEP stakeholder meeting?",
    category: "Stakeholder Updates",
    icon: TrendingUp,
  },
  {
    text: "Do a detailed Risk Assessment of AG1-XXX from latest TC2 Results",
    category: "Cluster Analysis",
    icon: Filter,
  },
  {
    text: "How many gas plants were added in the same county as my project?",
    category: "Queue Analysis",
    icon: BarChart3,
  },
]

interface PromptChipsProps {
  onPromptClick: (prompt: string) => void
}

export function PromptChips({ onPromptClick }: PromptChipsProps) {
  return (
    <div className="w-full overflow-hidden">
      <div className="text-center text-xs text-white/40 font-medium uppercase tracking-widest mb-4">
        Try Asking
      </div>

      {/* Scrolling container */}
      <div className="relative max-w-5xl mx-auto px-4">
        <div className="flex gap-3 justify-center animate-fade-in">
          {/* Prompt cards - Kimi style */}
          {examplePrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onPromptClick(prompt.text)}
              className="group flex-1 min-w-0 max-w-[340px] text-left px-4 py-3 rounded-xl border border-lime/20 bg-[#0d1005]/50 backdrop-blur-sm hover:bg-[#0d1005]/80 hover:border-lime/40 hover:shadow-[0_0_20px_rgba(200,255,50,0.1)] transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              {/* Category header */}
              <div className="flex items-center gap-2 mb-2">
                <prompt.icon className="h-4 w-4 text-lime" />
                <span className="text-xs font-medium text-lime uppercase tracking-wider">
                  {prompt.category}
                </span>
              </div>

              {/* Full prompt text */}
              <p className="text-sm font-medium text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                {prompt.text}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
