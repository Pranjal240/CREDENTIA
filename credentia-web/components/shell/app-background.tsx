'use client'

import { FluidMorphBg } from '@/components/ui/fluid-morph-bg'

/**
 * Fixed background for the whole app. It mounts once in the root layout and is drawn once. Nothing about it
 * moves: a layer that changes under the glass surfaces forces them to be blurred again on every frame,
 * and that cost is paid on every page. The shapes are the same art, held still.
 */
export function AppBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" style={{ contain: 'strict' }}>
      <FluidMorphBg still className="h-full w-full" />
    </div>
  )
}
