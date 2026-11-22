'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type StyleWithIndex = React.CSSProperties & { '--i'?: number }

/**
 * A heading whose words rise out of a line mask as it scrolls into view. The movement itself lives in
 * globals.css, so it follows the scroll position, costs nothing in script, and is switched off for
 * people who ask for reduced motion. The words stay ordinary text, so reading and selecting work as usual.
 */
export function SwipeHeading({
  text,
  as: Tag = 'h2',
  className,
  startAt = 0,
}: {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
  className?: string
  startAt?: number
}) {
  const words = text.split(' ')
  return (
    <Tag className={className}>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <span className="mask-y inline-block align-top">
            <span data-swipe="word" className="inline-block" style={{ '--i': startAt + index } as StyleWithIndex}>
              {word}
            </span>
          </span>
          {index < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </Tag>
  )
}

/** Marks a block to swipe up as it enters the screen. `index` staggers neighbours. */
export function Swipe({
  children,
  className,
  kind = 'up',
  index = 0,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  kind?: 'up' | 'mask'
  index?: number
  as?: 'div' | 'li' | 'p' | 'section' | 'article' | 'figure' | 'span'
}) {
  return (
    <Tag data-swipe={kind === 'mask' ? 'mask' : ''} className={cn(className)} style={{ '--i': index } as StyleWithIndex}>
      {children}
    </Tag>
  )
}

/**
 * Browsers that cannot drive an animation from the scroll position get the same rise, started once
 * when each block comes into view. Browsers that can, and people who ask for less motion, are left alone.
 */
export function SwipeFallback() {
  const pathname = usePathname()

  React.useEffect(() => {
    const supported = typeof CSS !== 'undefined' && CSS.supports('(animation-timeline: view()) and (animation-range: entry)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (supported || calm) return

    const root = document.documentElement
    root.classList.add('swipe-io')

    const seen = new WeakSet<Element>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    const scan = () => {
      document.querySelectorAll('[data-swipe]').forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        observer.observe(el)
      })
    }
    scan()
    const mutations = new MutationObserver(scan)
    mutations.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutations.disconnect()
      observer.disconnect()
      root.classList.remove('swipe-io')
    }
  }, [pathname])

  return null
}
