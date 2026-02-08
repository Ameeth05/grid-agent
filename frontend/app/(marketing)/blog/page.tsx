import Link from 'next/link'
import { ArrowRight, Calendar, Clock, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Footer } from '@/components/layout/Footer'

// Mock blog posts
const blogPosts = [
  {
    id: '1',
    title: 'Understanding PJM Cluster Study Results: A Deep Dive',
    excerpt: 'A comprehensive guide to interpreting cluster study results and understanding transmission network upgrades cost allocations in PJM.',
    author: 'GridAgent Team',
    date: '2026-01-28',
    readTime: '8 min read',
    category: 'Analysis',
  },
  {
    id: '2',
    title: 'FERC Order 2023: What Developers Need to Know',
    excerpt: 'Breaking down the key changes in FERC Order 2023 and how they impact interconnection queue management across all ISOs.',
    author: 'GridAgent Team',
    date: '2026-01-20',
    readTime: '12 min read',
    category: 'Policy',
  },
  {
    id: '3',
    title: 'The Rise of Battery Storage in ERCOT: 2025 Review',
    excerpt: 'Analyzing the explosive growth of battery storage projects in ERCOT and what it means for grid reliability.',
    author: 'GridAgent Team',
    date: '2026-01-15',
    readTime: '6 min read',
    category: 'Market Trends',
  },
  {
    id: '4',
    title: 'Interconnection Queue Withdrawal Patterns: A Statistical Analysis',
    excerpt: 'Using data to understand why projects withdraw from queues and how to identify high-risk positions.',
    author: 'GridAgent Team',
    date: '2026-01-10',
    readTime: '10 min read',
    category: 'Research',
  },
]

export default function BlogPage() {
  return (
    <>
      <div className="container py-16 md:py-24 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Insights, analysis, and deep dives into US grid interconnection
            and power market dynamics.
          </p>
        </div>

        {/* Featured Post */}
        {blogPosts[0] && (
          <Link href={`/blog/${blogPosts[0].id}`} className="block mb-12">
            <Card className="hover:border-electric-500/30 transition-colors overflow-hidden">
              <div className="md:flex">
                <div className="md:w-2/5 h-48 md:h-auto bg-gradient-to-br from-electric-500/20 to-electric-600/20" />
                <div className="flex-1">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-electric-500/10 text-electric-600 dark:text-electric-400">
                        Featured
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {blogPosts[0].category}
                      </span>
                    </div>
                    <CardTitle className="text-2xl">{blogPosts[0].title}</CardTitle>
                    <CardDescription className="text-base">
                      {blogPosts[0].excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {blogPosts[0].author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {blogPosts[0].date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {blogPosts[0].readTime}
                      </div>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {blogPosts.slice(1).map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`}>
              <Card className="h-full hover:border-electric-500/30 transition-colors group">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-muted-foreground">
                      {post.category}
                    </span>
                  </div>
                  <CardTitle className="text-xl group-hover:text-electric-500 transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription>{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{post.date}</span>
                      <span>{post.readTime}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-electric-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Coming Soon Note */}
        <div className="mt-16 text-center py-12 px-8 rounded-2xl bg-muted/50 border">
          <h3 className="text-xl font-semibold mb-2">More Content Coming Soon</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We are building out our content library with in-depth analysis,
            tutorials, and market insights. Check back soon!
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}
