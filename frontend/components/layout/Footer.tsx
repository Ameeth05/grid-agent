'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { DemoRequestForm } from '@/components/landing/DemoRequestForm'

const isos = ['PJM', 'MISO', 'SPP', 'ERCOT', 'NYISO', 'ISONE']

export function Footer() {
  const [demoFormOpen, setDemoFormOpen] = useState(false)

  return (
    <footer className="border-t border-lime/10 bg-[#080a00]">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="group flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-lime overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(200,255,50,0.4)]">
                <Image
                  src="/logo.png"
                  alt="GridAgent"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold tracking-[0.1em] transition-all duration-300 group-hover:tracking-[0.15em] text-lime">
                GRIDAGENT
              </span>
            </Link>
            <p className="text-sm text-white/50 max-w-xs mb-6 leading-relaxed font-light">
              AI-powered intelligence for US power markets. Transform weeks of due diligence into minutes.
            </p>
            <div className="flex flex-wrap gap-2">
              {isos.map((iso) => (
                <span
                  key={iso}
                  className="px-3 py-1 text-xs font-mono bg-lime/10 text-lime rounded-full border border-lime/20"
                >
                  {iso}
                </span>
              ))}
            </div>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="group text-sm text-white/50 hover:text-lime transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="w-0 h-px bg-lime transition-all duration-300 group-hover:w-4" />
                  About
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setDemoFormOpen(true)}
                  className="group text-sm text-white/50 hover:text-lime transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="w-0 h-px bg-lime transition-all duration-300 group-hover:w-4" />
                  Request Demo
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-lime/10 mt-12 pt-8 flex justify-center items-center">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} GridAgent. All rights reserved.
          </p>
        </div>
      </div>

      <DemoRequestForm open={demoFormOpen} onOpenChange={setDemoFormOpen} />
    </footer>
  )
}
