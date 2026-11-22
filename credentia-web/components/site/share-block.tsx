'use client'

import QRCode from 'react-qr-code'
import { CopyButton } from '@/components/ui/copy-button'

/** The profile address with a copy button and a QR code that opens it. */
export function ShareBlock({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0 rounded-xl bg-white p-2" aria-hidden="true">
        <QRCode value={url} size={84} bgColor="#FFFFFF" fgColor="#000000" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-muted-foreground">Profile link</p>
        <p className="mt-1 break-all font-mono text-xs text-foreground/85">{url}</p>
      </div>
      <CopyButton value={url} />
    </div>
  )
}

export default ShareBlock
