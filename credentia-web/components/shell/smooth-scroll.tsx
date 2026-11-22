'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Page scrolling is the browser's own. It is already smooth on every current browser, it costs nothing in
 * script, and it keeps scroll driven reveals in step with the finger or the wheel. A library that moves the
 * page from script on every frame made scrolling feel heavy, so it is gone.
 */

/** Scroll to a selector, element or y offset. */
export function scrollToTarget(target: string | HTMLElement | number, offset = 0) {
  if (typeof window === 'undefined') return
  if (typeof target === 'number') {
    window.scrollTo({ top: target + offset, behavior: 'smooth' })
    return
  }
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!el) return
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' })
}

/**
 * Freezes page scrolling behind an open overlay. The scrollbar gutter stays
 * reserved so the page does not jump sideways when the scrollbar disappears.
 */
export function setScrollLocked(locked: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (locked) {
    root.style.scrollbarGutter = 'stable'
    root.style.overflow = 'hidden'
  } else {
    root.style.overflow = ''
    root.style.scrollbarGutter = ''
  }
}

/**
 * Two small jobs. Every route change starts at the top. And while the page is moving, a class is set on the
 * root so always running decoration such as the orb and the marquee can rest, which leaves every frame
 * of the scroll for the page itself.
 */
export function SmoothScroll() {
  const pathname = usePathname() ?? ''

  useEffect(() => {
    const root = document.documentElement
    let timer = 0
    let frame = 0

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        root.classList.add('is-scrolling')
        window.clearTimeout(timer)
        timer = window.setTimeout(() => root.classList.remove('is-scrolling'), 160)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
      if (frame) cancelAnimationFrame(frame)
      root.classList.remove('is-scrolling')
    }
  }, [])

  // Every route change starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}
