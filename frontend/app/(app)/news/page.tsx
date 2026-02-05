'use client'

import { useState } from 'react'
import { ExternalLink, Calendar, Tag, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DemoRequestForm } from '@/components/landing/DemoRequestForm'

// Mock news items
const newsItems = [
  {
    id: '1',
    title: 'FERC Approves Major Transmission Expansion in PJM',
    source: 'FERC',
    date: '2026-01-29',
    category: 'Regulatory',
    excerpt: 'FERC has approved a $5.2 billion transmission expansion project in PJM, expected to unlock 15 GW of renewable capacity.',
  },
  {
    id: '2',
    title: 'MISO Releases 2026 Cluster Study Timeline',
    source: 'MISO',
    date: '2026-01-28',
    category: 'Queue Update',
    excerpt: 'MISO announces revised timeline for 2026 cluster studies, with Phase 1 results expected by Q3.',
  },
  {
    id: '3',
    title: 'Record Battery Storage Capacity Added to ERCOT in January',
    source: 'ERCOT',
    date: '2026-01-27',
    category: 'Market Data',
    excerpt: 'ERCOT reports 2.5 GW of new battery storage capacity came online in January 2026, a new monthly record.',
  },
  {
    id: '4',
    title: 'SPP Proposes New Interconnection Queue Management Rules',
    source: 'SPP',
    date: '2026-01-25',
    category: 'Policy',
    excerpt: 'SPP files proposal with FERC to implement new queue management procedures aimed at reducing study timelines.',
  },
]

const categories = ['All', 'Regulatory', 'Queue Update', 'Market Data', 'Policy']

export default function NewsPage() {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <div className="h-full overflow-auto relative">
      {/* Blurred Content */}
      <div className="container py-8 max-w-4xl blur-sm pointer-events-none select-none">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ISO News</h1>
          <p className="text-muted-foreground">
            Stay updated with the latest developments in US grid interconnection
            and power markets.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === 'All' ? 'default' : 'outline'}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* News List */}
        <div className="space-y-4">
          {newsItems.map((item) => (
            <Card key={item.id} className="hover:border-electric-500/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-muted">
                        {item.source}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {item.date}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {item.excerpt}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-full bg-lime/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-lime" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Coming Soon</h2>
          <p className="text-muted-foreground mb-6">
            Real-time ISO news aggregation from FERC, PJM, MISO, ERCOT, SPP, NYISO,
            and other official sources. Get personalized alerts for your portfolio.
          </p>
          <Button
            size="lg"
            className="bg-lime hover:bg-lime/90 text-black font-semibold"
            onClick={() => setDemoOpen(true)}
          >
            Request Demo
          </Button>
        </div>
      </div>

      {/* Demo Request Form */}
      <DemoRequestForm
        open={demoOpen}
        onOpenChange={setDemoOpen}
        source="landing"
      />
    </div>
  )
}
