'use client'

import * as React from 'react'
import GlassDock, { type DockItem } from '@/components/ui/glass-dock'
import { Panel } from '@/components/dash/kit'

/**
 * Shortcuts to documents and the pages used most, drawn as a dock. Each item is a
 * real link, so it works with the keyboard, opens in a new tab on request, and
 * announces its name to a screen reader.
 */
export function QuickAccess({ items, title = 'Quick access', subtitle, index = 0, className }: { items: DockItem[]; title?: string; subtitle?: string; index?: number; className?: string }) {
  return (
    <Panel title={title} subtitle={subtitle} index={index} className={className}>
      <div className="flex justify-center overflow-x-auto py-2 pt-12 scrollbar-thin">
        <GlassDock items={items} />
      </div>
    </Panel>
  )
}

export default QuickAccess
