'use client'

import ButtonCopy from '@/components/smoothui/components/button-copy'
import { cn } from '@/lib/utils'

/** Writes text to the clipboard, with a fallback for browsers or contexts that block the async API. */
async function writeClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch {
    // fall through to the legacy path
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(area)
  if (!ok) throw new Error('Copy failed')
}

interface CopyButtonProps {
  /** The text to copy. */
  value: string
  className?: string
  disabled?: boolean
  /** Called after a successful copy. */
  onCopied?: () => void
}

/**
 * The copy control used everywhere in Credentia: verified links, certificate
 * numbers, tokens, emails. It shows the loading, success and error states of
 * the ButtonCopy reference.
 */
export function CopyButton({ value, className, disabled, onCopied }: CopyButtonProps) {
  return (
    <ButtonCopy
      // The reference button fills with the page colour, which is solid black here. A light glass fill suits our surfaces.
      className={cn('bg-white/[0.06] hover:bg-white/[0.12]', className)}
      disabled={disabled || !value}
      duration={1800}
      loadingDuration={350}
      onCopy={async () => {
        await writeClipboard(value)
        onCopied?.()
      }}
    />
  )
}

export default CopyButton
