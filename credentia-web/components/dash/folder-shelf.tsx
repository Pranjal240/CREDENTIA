'use client'

import * as React from 'react'
import GlassFolder, { type ArtPreset, type FolderFile } from '@/components/ui/glass-folder'
import { FolderWindow, type FolderEntry } from '@/components/shell/folder-window'
import { useContainerWidth } from '@/hooks/use-container-width'
import { cn } from '@/lib/utils'

export interface FolderSpec {
  id: string
  label: string
  art: ArtPreset
  seed?: number
  entries: FolderEntry[]
  /** Second line on the folder. Defaults to the item count. */
  meta?: string
  /** Line under the title in the file window. */
  subtitle?: string
  loading?: boolean
  emptyTitle?: string
  emptyHint?: string
  /** Buttons in the file window toolbar, for example an upload action. */
  actions?: React.ReactNode
}

const toFile = (entry: FolderEntry): FolderFile => ({ name: entry.name, meta: entry.meta })

/**
 * A row of glass folders. Pressing one opens a file window with every file in it.
 * Folder width follows the space available so three fit on a wide screen, two on
 * a tablet and one on a phone, and the folders never overflow.
 */
export function FolderShelf({ folders, className }: { folders: FolderSpec[]; className?: string }) {
  const gridRef = React.useRef<HTMLDivElement>(null)
  const width = useContainerWidth(gridRef)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [origin, setOrigin] = React.useState<DOMRect | null>(null)

  const columns = width >= 900 ? 3 : width >= 560 ? 2 : 1
  const gap = 24
  const folderWidth = width > 0 ? Math.max(220, Math.min(340, Math.floor((width - gap * (columns - 1)) / columns))) : 300
  const open = folders.find((f) => f.id === openId) ?? null

  // The files handed to each folder only change when its entries do.
  const files = React.useMemo(() => Object.fromEntries(folders.map((f) => [f.id, f.entries.map(toFile)])), [folders])

  return (
    <>
      <div ref={gridRef} className={cn('grid justify-items-center gap-x-6 gap-y-4', className)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {folders.map((folder, i) => (
          <GlassFolder
            key={folder.id}
            label={folder.label}
            meta={folder.loading ? 'Loading' : folder.meta}
            art={folder.art}
            seed={folder.seed ?? 3 + i * 4}
            tone="dark"
            files={files[folder.id]}
            mode="window"
            action="none"
            width={folderWidth}
            appearDelay={i * 90}
            onActivate={(rect) => {
              setOrigin(rect)
              setOpenId(folder.id)
            }}
          />
        ))}
      </div>

      <FolderWindow
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        title={open?.label ?? ''}
        subtitle={open?.subtitle}
        entries={open?.entries ?? []}
        loading={open?.loading}
        originRect={origin}
        emptyTitle={open?.emptyTitle}
        emptyHint={open?.emptyHint}
        actions={open?.actions}
      />
    </>
  )
}

export default FolderShelf
