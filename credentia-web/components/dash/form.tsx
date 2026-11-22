'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export const inputClass =
  'min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-white/20 focus:border-white/30 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-60'

/** A labelled control. The label is always visible and tied to the control, never a placeholder. */
export function Field({ label, hint, error, htmlFor, children, className }: { label: string; hint?: string; error?: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold text-foreground/85">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />
})

export const SelectInput = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function SelectInput({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(inputClass, 'select-chevron cursor-pointer appearance-none pr-9', className)} {...props}>
      {children}
    </select>
  )
})

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputClass, 'min-h-[96px] resize-y py-2.5', className)} {...props} />
})

/** An on or off control. Press it, or focus it and press Space. */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50 pointer-coarse:h-8 pointer-coarse:w-14',
        checked ? 'border-brand bg-brand' : 'border-white/20 bg-white/10',
      )}
    >
      <span aria-hidden="true" className={cn('absolute size-5 rounded-full bg-white transition-transform duration-200', checked ? 'translate-x-[24px]' : 'translate-x-[3px]')} />
    </button>
  )
}
