import { Zap, Target, Users, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Footer } from '@/components/layout/Footer'

const values = [
  {
    icon: Target,
    title: 'Mission',
    description: 'Democratize access to grid market intelligence, enabling faster and smarter investment decisions in the energy transition.',
  },
  {
    icon: Lightbulb,
    title: 'Vision',
    description: 'A world where every developer and investor can make informed decisions about grid infrastructure in minutes, not weeks.',
  },
  {
    icon: Users,
    title: 'For Whom',
    description: 'Energy developers, investors, utilities, and consultants who need fast, accurate analysis of US grid interconnection data.',
  },
]

const team = [
  {
    name: 'Coming Soon',
    role: 'Founder',
    bio: 'Building the future of grid intelligence.',
  },
]

export default function AboutPage() {
  return (
    <>
      <div className="container py-16 md:py-24 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-electric-500/30 bg-electric-500/10 text-electric-600 dark:text-electric-400">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">About GridAgent</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Accelerating the Energy Transition
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            GridAgent is an AI-powered research agent that transforms how energy professionals
            analyze US grid interconnection data and power market intelligence.
          </p>
        </div>

        {/* Problem Statement */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The Problem</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground">
              The US power grid is undergoing a massive transformation. Thousands of solar, wind,
              and battery storage projects are waiting in interconnection queues across the country.
              Developers and investors spend weeks manually analyzing queue data, cluster studies,
              FERC filings, and stakeholder meetings to assess project viability and risks.
            </p>
            <p className="text-lg text-muted-foreground mt-4">
              This manual process is slow, error-prone, and expensive. Critical insights get missed.
              Investment decisions get delayed. The energy transition slows down.
            </p>
          </div>
        </section>

        {/* Solution */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Our Solution</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground">
              GridAgent is an AI research agent that can answer complex questions about grid
              interconnection in seconds. Ask about network upgrade costs, queue positions,
              cluster study results, withdrawal risks, or FERC policy impacts, and get instant,
              accurate answers backed by primary source data.
            </p>
            <p className="text-lg text-muted-foreground mt-4">
              We cover all major US ISOs: PJM, MISO, SPP, ISONE, NYISO, and ERCOT.
              Our agent tracks queue changes, cluster results, stakeholder meetings,
              and regulatory filings in real-time.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="border-border/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-electric-500/10 flex items-center justify-center mb-4">
                    <value.icon className="h-6 w-6 text-electric-500" />
                  </div>
                  <CardTitle>{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* YC */}
        <section className="text-center py-12 px-8 rounded-2xl bg-muted/50 border">
          <h2 className="text-2xl font-bold mb-4">YC Spring 2026 Applicant</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We are applying to Y Combinator Spring 2026 to accelerate our mission of
            democratizing grid market intelligence.
          </p>
        </section>
      </div>
      <Footer />
    </>
  )
}
