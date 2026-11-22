'use client'

import * as React from 'react'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { Dialog } from '@/components/dash/dialog'

/**
 * Asks before something that is hard to undo. The confirm button names the action,
 * shows progress while it runs, and an error from the server stays in the dialog.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  busy = false,
  error,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
  busy?: boolean
  error?: string
  onConfirm: () => void
  onClose: () => void
  children?: React.ReactNode
}) {
  return (
    <Dialog
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <SmoothButton variant="ghost" shape="pill" onClick={onClose} disabled={busy}>
            Cancel
          </SmoothButton>
          <SmoothButton variant="solid" color={destructive ? 'destructive' : 'accent'} shape="pill" loading={busy} onClick={onConfirm}>
            {confirmLabel}
          </SmoothButton>
        </>
      }
    >
      <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
        {children}
        {error ? (
          <p role="alert" className="text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  )
}

export default ConfirmDialog
