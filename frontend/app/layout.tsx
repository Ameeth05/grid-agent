import type { Metadata } from 'next'

import { Providers } from '@/components/Providers'
import './globals.css'

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
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
