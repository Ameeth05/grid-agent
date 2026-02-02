import type { Metadata } from 'next'
import { DM_Sans, Space_Grotesk, JetBrains_Mono } from 'next/font/google'

import { Header } from '@/components/layout/Header'
import { Providers } from '@/components/Providers'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GridAgent - AI Analyst for US Grid and Power Markets',
  description: 'AI-powered research and analysis for US grid interconnection queues and power markets. Transform weeks of due diligence into minutes.',
  keywords: ['grid', 'power markets', 'interconnection', 'PJM', 'MISO', 'ERCOT', 'AI', 'analysis'],
  authors: [{ name: 'GridAgent' }],
  openGraph: {
    title: 'GridAgent - AI Analyst for US Grid and Power Markets',
    description: 'Transform weeks of due diligence into minutes with AI-powered grid analysis.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
