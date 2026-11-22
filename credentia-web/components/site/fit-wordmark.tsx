'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

type StyleWithIndex = React.CSSProperties & { '--i'?: number }

/**
 * A word set in capitals at exactly the width of its container. The size is worked out from the real
 * letter widths, so nothing is stretched, and it is worked out again when the container or the font changes.
 * Letters rise into place one by one when `animate` is on. Decorative only, so it is hidden from
 * screen readers. Give the page a real heading next to it.
 */
export function FitWordmark({
  text,
  outline = false,
  animate = true,
  scan = false,
  className,
}: {
  text: string
  outline?: boolean
  animate?: boolean
  /** Letters are checked by a sweeping beam on load, and answer the pointer afterwards. */
  scan?: boolean
  className?: string
}) {
  const wrap = React.useRef<HTMLSpanElement>(null)
  const word = React.useRef<HTMLSpanElement>(null)

  useIsoLayoutEffect(() => {
    const outer = wrap.current
    const inner = word.current
    if (!outer || !inner) return

    let lastWidth = 0
    const fit = () => {
      const available = outer.clientWidth
      if (!available) return
      // Layout widths, not bounding boxes, so a scale or a slide on a parent cannot skew the result.
      inner.style.fontSize = '1000px'
      const natural = inner.offsetWidth
      if (natural > 0) inner.style.fontSize = `${((1000 * available) / natural).toFixed(3)}px`
      outer.style.setProperty('--wm-w', `${available}px`)
      lastWidth = available
    }

    fit()
    const observer = new ResizeObserver(() => {
      if (outer.clientWidth !== lastWidth) fit()
    })
    observer.observe(outer)
    void document.fonts?.ready.then(fit)
    return () => observer.disconnect()
  }, [text])

  return (
    <span ref={wrap} aria-hidden="true" className={cn('wordmark relative block w-full', className)}>
      <span
        ref={word}
        className={cn('wordmark-word inline-flex whitespace-nowrap font-extrabold uppercase leading-[0.86]', outline ? 'tracking-[-0.02em]' : 'tracking-[-0.045em]')}
        style={{ fontSize: 'clamp(2rem, 15vw, 30rem)' }}
      >
        {Array.from(text).map((letter, index) => (
          <span key={index} className={cn('inline-block', scan ? 'wm-letter cursor-default' : animate && 'hero-glyph', outline && 'wordmark-outline')} style={{ '--i': index } as StyleWithIndex}>
            {letter}
          </span>
        ))}
      </span>
      {scan ? <span className="wm-beam pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-brand opacity-0" style={{ boxShadow: '0 0 26px 6px rgba(217,30,38,0.55)' }} /> : null}
    </span>
  )
}

export default FitWordmark
