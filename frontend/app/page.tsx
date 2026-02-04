import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { CTA } from '@/components/landing/CTA'
import { Footer } from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080a00]">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <CTA />
        <Footer />
      </main>
    </div>
  )
}
