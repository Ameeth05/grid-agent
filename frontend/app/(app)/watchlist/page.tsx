'use client'

import { useState } from 'react'
import { Plus, Bell, Trash2, Search, Filter, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DemoRequestForm } from '@/components/landing/DemoRequestForm'

// Mock data for demonstration
const mockWatchlistItems = [
  {
    id: '1',
    projectId: 'AF1-234',
    projectName: 'Solar Farm Alpha',
    iso: 'PJM',
    status: 'Active',
    capacity: '150 MW',
    lastUpdate: '2026-01-28',
    alerts: 2,
  },
  {
    id: '2',
    projectId: 'AG2-567',
    projectName: 'Wind Project Beta',
    iso: 'MISO',
    status: 'Study Phase',
    capacity: '300 MW',
    lastUpdate: '2026-01-25',
    alerts: 0,
  },
  {
    id: '3',
    projectId: 'AH3-890',
    projectName: 'Battery Storage Gamma',
    iso: 'ERCOT',
    status: 'Queue Position Change',
    capacity: '100 MW',
    lastUpdate: '2026-01-30',
    alerts: 1,
  },
]

export default function WatchlistPage() {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <div className="h-full overflow-auto relative">
      {/* Blurred Content */}
      <div className="container py-8 blur-sm pointer-events-none select-none">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Portfolio Dashboard</h1>
            <p className="text-muted-foreground">
              Track {mockWatchlistItems.length} projects across all ISOs
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project name or ID..."
              className="pl-10"
              disabled
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Watchlist Items */}
        <div className="grid gap-4">
          {mockWatchlistItems.map((item) => (
            <Card key={item.id} className="hover:border-electric-500/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-muted-foreground">
                        {item.projectId}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-electric-500/10 text-electric-600 dark:text-electric-400">
                        {item.iso}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{item.projectName}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.alerts > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <Bell className="h-3 w-3" />
                        <span className="text-xs font-medium">{item.alerts}</span>
                      </div>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    <span className="font-medium">{item.status}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Capacity: </span>
                    <span className="font-medium">{item.capacity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Update: </span>
                    <span className="font-medium">{item.lastUpdate}</span>
                  </div>
                </div>
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
            Track your interconnection projects across PJM, MISO, ERCOT, SPP, and NYISO.
            Get real-time alerts on queue position changes, study milestones, and stakeholder news.
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
