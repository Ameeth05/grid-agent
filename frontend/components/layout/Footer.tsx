import Link from 'next/link'
import { Zap } from 'lucide-react'

const footerLinks = {
  product: [
    { href: '/chat', label: 'GridAgent Chat' },
    { href: '/watchlist', label: 'Watchlist' },
    { href: '/about', label: 'About' },
  ],
  resources: [
    { href: '/blog', label: 'Blog' },
    { href: '/news', label: 'News' },
    { href: '/docs', label: 'Documentation' },
  ],
  company: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/contact', label: 'Contact' },
  ],
}

const isos = ['PJM', 'MISO', 'SPP', 'ERCOT', 'NYISO', 'ISONE']

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 font-display font-bold text-xl mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-electric-500 to-electric-600 text-white shadow-lg shadow-electric-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <span>GridAgent</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
              AI-powered intelligence for US power markets. Transform weeks of due diligence into minutes.
            </p>
            <div className="flex flex-wrap gap-2">
              {isos.map((iso) => (
                <span
                  key={iso}
                  className="px-2 py-1 text-xs font-mono bg-electric-500/10 text-electric-500 rounded"
                >
                  {iso}
                </span>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-display font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-electric-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-display font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-electric-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-display font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-electric-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} GridAgent. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-electric-500"></span>
            </span>
            <span className="text-sm text-muted-foreground">
              YC S26 Applicant
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
