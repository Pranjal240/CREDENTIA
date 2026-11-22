'use client'

import * as React from 'react'
import Link from 'next/link'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FitWordmark } from '@/components/site/fit-wordmark'

type StyleWithIndex = React.CSSProperties & { '--i'?: number }
const idx = (i: number) => ({ '--i': i }) as StyleWithIndex

const WORDS = ['RESUME', 'POLICE CERTIFICATE', 'AADHAAR', 'DEGREE']

/**
 * The document name in the tagline. Every name sits in the same cell, so the cell is as wide and as tall as
 * the longest one and nothing around it moves. The old name leaves quickly and the next arrives at once,
 * so two names are never on screen together.
 */
function RotatingWord() {
  const reduced = useReducedMotion()
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2800)
    return () => window.clearInterval(id)
  }, [reduced])

  return (
    <span role="img" aria-label="resume, police certificate, Aadhaar or degree" className="grid justify-items-center">
      {WORDS.map((word, i) => {
        const active = i === index
        return (
          <span
            key={word}
            aria-hidden="true"
            className="col-start-1 row-start-1 text-balance"
            style={{
              opacity: active ? 1 : 0,
              transform: active ? 'translate3d(0,0,0)' : 'translate3d(0,0.3em,0)',
              transition: 'opacity 240ms var(--swipe-ease), transform 320ms var(--swipe-ease)',
              transitionDelay: active ? '170ms' : '0ms',
            }}
          >
            {word}
          </span>
        )
      })}
    </span>
  )
}

const INDEX = [
  { n: '01', name: 'Resume', state: 'Analysed', href: '/features#resume' },
  { n: '02', name: 'Police certificate', state: 'Verified', href: '/features#police' },
  { n: '03', name: 'Aadhaar', state: 'Verified', href: '/features#aadhaar' },
  { n: '04', name: 'Degree certificate', state: 'Verified', href: '/features#degree' },
]

const CHECKS = ['Free for students', 'Only the last four Aadhaar digits are kept', 'You choose who sees your profile']

/**
 * The first screen and nothing else. CREDENTIA stands in the middle, scanned into place. Above it the tagline
 * and two short notes, below it an index of the four documents that ticks over as the beam passes, then the
 * explanation, the way in and the reassurances in three even columns. It fills the screen, so the next
 * section only begins once the first one has been read.
 */
export function LandingHero() {
  return (
    <section className="page-x relative flex min-h-[100svh] flex-col gap-8 pb-10 pt-[clamp(84px,9vw,116px)] lg:justify-between lg:pb-[88px]">
      <h1 className="sr-only">Credentia. Verify your resume, police certificate, Aadhaar and degree once, then share one trusted link.</h1>

      {/* Top: two notes and the tagline */}
      <div className="order-2 grid items-start gap-x-8 gap-y-6 lg:order-none lg:grid-cols-[1fr_1.25fr_1fr]">
        <div className="hero-up hidden lg:block" style={idx(2)}>
          <p className="text-sm font-extrabold text-foreground">AI credential verification</p>
          <p className="mt-1 max-w-[22ch] text-xs leading-relaxed text-muted-foreground sm:text-sm">For students, companies and universities in India</p>
        </div>

        <p className="text-center text-[clamp(1.3rem,2vw,2rem)] font-extrabold leading-[1.12] tracking-[-0.02em] text-foreground">
          <span className="mask-y block">
            <span className="hero-glyph block" style={idx(9)}>
              Verify your
            </span>
          </span>
          <span className="mask-y block text-brand-ink">
            <span className="hero-glyph block" style={idx(10)}>
              <RotatingWord />
            </span>
          </span>
          <span className="mask-y block">
            <span className="hero-glyph block" style={idx(11)}>
              once. Share one link.
            </span>
          </span>
        </p>

        <div className="hero-up hidden text-right lg:block" style={idx(2)}>
          <p className="text-sm font-extrabold text-foreground">Free for students</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">Made in India</p>
        </div>
      </div>

      {/* Middle: the wordmark, and under it the index of documents */}
      <div className="contents lg:block">
        <div className="relative order-1 mx-auto flex w-full items-center justify-center sm:w-[92%] lg:order-none lg:w-[80%]">
          <FitWordmark text="CREDENTIA" scan />
        </div>

        <div className="order-3 mx-auto w-full lg:order-none lg:mt-[clamp(16px,2.4vw,36px)]">
          <div aria-hidden="true" className="hero-rule flex items-center gap-3 text-muted-foreground">
            <span className="text-xs leading-none">+</span>
            <span className="h-px flex-1 bg-white/55" />
            <span className="text-xs leading-none">+</span>
          </div>

          <ul className="grid grid-cols-2 lg:grid-cols-4">
            {INDEX.map((doc, i) => (
              <li key={doc.n} className="hero-up min-w-0 border-white/12 [&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0" style={idx(3 + i)}>
                <Link href={doc.href} className="group flex items-center justify-between gap-3 px-3 py-3.5 transition-colors duration-300 hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none sm:px-5 sm:py-4">
                  <span className="min-w-0">
                    <span className="tabular block font-mono text-[11px] font-semibold text-muted-foreground">{doc.n}</span>
                    <span className="mt-0.5 block text-sm font-extrabold leading-tight text-foreground transition-colors group-hover:text-brand-ink sm:text-base">{doc.name}</span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-brand-ink sm:text-xs">{doc.state}</span>
                  </span>
                  <span className="ledger-tick grid size-6 shrink-0 place-items-center rounded-full bg-brand text-on-brand" style={idx(i)}>
                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="h-px w-full bg-white/12" />
        </div>
      </div>

      {/* Bottom: explanation, the way in, reassurances */}
      <div className="order-4 grid items-start gap-x-8 gap-y-6 lg:order-none lg:grid-cols-[1fr_1.25fr_1fr] lg:items-center">
        <p className="hero-up max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base" style={idx(6)}>
          Upload your documents. AI reads each one, an admin reviews anything uncertain, and you get one profile that companies and universities can trust.
        </p>

        <div className="hero-up flex flex-wrap items-center gap-3 lg:justify-center" style={idx(7)}>
          <Button href="/register" variant="primary" size="lg">
            Create free profile
            <ArrowRight className="size-4" />
          </Button>
          <Button href="/how-it-works" variant="default" size="lg">
            See how it works
          </Button>
        </div>

        <ul className="hero-up space-y-2 text-xs font-semibold text-muted-foreground sm:text-sm lg:justify-self-end" style={idx(8)}>
          {CHECKS.map((text) => (
            <li key={text} className="flex items-center gap-2">
              <Check className="size-3.5 shrink-0 text-success" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </div>

    </section>
  )
}

export default LandingHero
