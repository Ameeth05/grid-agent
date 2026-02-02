import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { SocialProof } from '@/components/landing/SocialProof'
import { CTA } from '@/components/landing/CTA'
import { Footer } from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <SocialProof />
      <CTA />
      <Footer />
    </>
  )
}
