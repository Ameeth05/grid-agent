import { ExternalLink, Calendar, Tag } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/layout/Footer'

// Mock news items
const newsItems = [
  {
    id: '1',
    title: 'FERC Approves Major Transmission Expansion in PJM',
    source: 'FERC',
    date: '2026-01-29',
    category: 'Regulatory',
    excerpt: 'FERC has approved a $5.2 billion transmission expansion project in PJM, expected to unlock 15 GW of renewable capacity.',
    url: '#',
  },
  {
    id: '2',
    title: 'MISO Releases 2026 Cluster Study Timeline',
    source: 'MISO',
    date: '2026-01-28',
    category: 'Queue Update',
    excerpt: 'MISO announces revised timeline for 2026 cluster studies, with Phase 1 results expected by Q3.',
    url: '#',
  },
  {
    id: '3',
    title: 'Record Battery Storage Capacity Added to ERCOT in January',
    source: 'ERCOT',
    date: '2026-01-27',
    category: 'Market Data',
    excerpt: 'ERCOT reports 2.5 GW of new battery storage capacity came online in January 2026, a new monthly record.',
    url: '#',
  },
  {
    id: '4',
    title: 'SPP Proposes New Interconnection Queue Management Rules',
    source: 'SPP',
    date: '2026-01-25',
    category: 'Policy',
    excerpt: 'SPP files proposal with FERC to implement new queue management procedures aimed at reducing study timelines.',
    url: '#',
  },
  {
    id: '5',
    title: 'PJM Capacity Auction Results Released',
    source: 'PJM',
    date: '2026-01-23',
    category: 'Market Data',
    excerpt: 'PJM releases Base Residual Auction results for 2029/2030, showing increased clearing prices in most zones.',
    url: '#',
  },
  {
    id: '6',
    title: 'NYISO Updates Large Facility Interconnection Procedures',
    source: 'NYISO',
    date: '2026-01-20',
    category: 'Regulatory',
    excerpt: 'NYISO implements revised LFIP with new provisions for energy storage and hybrid projects.',
    url: '#',
  },
]

const categories = ['All', 'Regulatory', 'Queue Update', 'Market Data', 'Policy']
const sources = ['All', 'FERC', 'PJM', 'MISO', 'ERCOT', 'SPP', 'NYISO', 'ISONE']

export default function NewsPage() {
  return (
    <>
      <div className="container py-16 md:py-24 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Grid News</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest developments in US grid interconnection
            and power markets.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
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
                  <Button variant="ghost" size="icon" className="shrink-0" asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
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

        {/* Pagination */}
        <div className="flex justify-center mt-12">
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="outline">
              Next
            </Button>
          </div>
        </div>

        {/* Note */}
        <div className="mt-16 text-center py-12 px-8 rounded-2xl bg-muted/50 border">
          <h3 className="text-xl font-semibold mb-2">Real-Time Updates Coming Soon</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We are building automated news aggregation from official ISO sources,
            FERC filings, and industry publications. Stay tuned!
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}
