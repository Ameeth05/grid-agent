'use client'

import { useState } from 'react'
import { Plus, Bell, Eye, Trash2, Search, Filter } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

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
  const { isAuthenticated, loading } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  if (loading) {
    return (
      <div className="container py-16 text-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-16 md:py-24 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-electric-500/10 flex items-center justify-center mx-auto mb-6">
          <Eye className="h-8 w-8 text-electric-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Project Watchlist</h1>
        <p className="text-muted-foreground mb-8">
          Track interconnection projects and get alerts when their status changes.
          Sign in to create your personalized watchlist.
        </p>
      </div>
    )
  }

  const filteredItems = mockWatchlistItems.filter(
    (item) =>
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Watchlist</h1>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Watchlist Items */}
      <div className="grid gap-4">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:border-electric-500/30 transition-colors">
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
          </motion.div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No projects match your search
          </div>
        )}
      </div>
    </div>
  )
}
