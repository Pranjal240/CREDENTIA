'use client'

import * as React from 'react'
import { MagnifyingGlass, Sparkle, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Accessible name. Defaults to the placeholder. */
  label?: string
  /** Shows the Ask AI button. Called with the current text when pressed or when Enter is hit on a multi word query. */
  onAskAI?: (query: string) => void
  className?: string
  autoFocus?: boolean
}

/**
 * The compact search field used above tables and lists. It has the same look as
 * the header of the search palette. Typing filters what is already on screen at
 * once. Ask AI hands the same words to the palette, which searches the whole
 * database and reads the question with AI.
 */
export function SearchBar({ value, onChange, placeholder = 'Search', label, onAskAI, className, autoFocus }: SearchBarProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 transition-colors focus-within:border-white/25',
        className,
      )}
    >
      <MagnifyingGlass className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onAskAI && value.trim().split(/\s+/).length > 2) {
            e.preventDefault()
            onAskAI(value.trim())
          }
        }}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      {onAskAI ? (
        <button
          type="button"
          onClick={() => onAskAI(value.trim())}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand/15"
        >
          <Sparkle weight="fill" className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Ask AI</span>
          <span className="sr-only sm:hidden">Ask AI</span>
        </button>
      ) : null}
    </div>
  )
}

export default SearchBar
