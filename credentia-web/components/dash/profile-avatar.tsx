'use client'

import * as React from 'react'
import { Camera, LoaderCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { initialsOf } from '@/lib/format'

interface ProfileAvatarProps {
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  userId?: string | null
  size?: number
  /** Show the camera overlay that lets the owner change the picture. */
  editable?: boolean
  onUploaded?: (url: string) => void
  className?: string
}

/**
 * Round avatar with initials as a fallback. When editable, the owner can pick an
 * image. It is shrunk to 200 pixels in the browser and saved on the profile, the
 * same way the old avatar did.
 */
export function ProfileAvatar({ name, email, avatarUrl, userId, size = 36, editable = false, onUploaded, className }: ProfileAvatarProps) {
  const [uploading, setUploading] = React.useState(false)
  const [broken, setBroken] = React.useState(false)
  const input = React.useRef<HTMLInputElement>(null)

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Could not read the file'))
        reader.onload = () => {
          const img = new window.Image()
          img.onerror = () => reject(new Error('Could not read the image'))
          img.onload = () => {
            const max = 200
            const scale = Math.min(1, max / Math.max(img.width, img.height))
            const canvas = document.createElement('canvas')
            canvas.width = Math.round(img.width * scale)
            canvas.height = Math.round(img.height * scale)
            canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL('image/jpeg', 0.8))
          }
          img.src = reader.result as string
        }
        reader.readAsDataURL(file)
      })
      const { error } = await supabase.from('profiles').update({ avatar_url: dataUrl }).eq('id', userId)
      if (error) throw error
      setBroken(false)
      onUploaded?.(dataUrl)
    } catch (err) {
      console.error('Avatar upload failed', err)
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ''
    }
  }

  const label = name || email || 'Account'

  return (
    <div className={cn('group relative shrink-0 rounded-full', className)} style={{ width: size, height: size }}>
      {uploading ? (
        <div className="grid size-full place-items-center rounded-full border border-white/20 bg-white/10">
          <LoaderCircle className="animate-spin text-brand-ink" style={{ width: size * 0.4, height: size * 0.4 }} />
        </div>
      ) : avatarUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="size-full rounded-full border border-white/20 object-cover"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <div
          className="grid size-full place-items-center rounded-full border border-brand/40 bg-brand/20 font-extrabold text-foreground"
          style={{ fontSize: size * 0.38 }}
          aria-hidden="true"
        >
          {initialsOf(label)}
        </div>
      )}

      {editable ? (
        <>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={uploading}
            aria-label="Change profile picture"
            className="absolute inset-0 z-10 grid place-items-center rounded-full bg-black/65 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Camera className="text-white" style={{ width: size * 0.4, height: size * 0.4 }} />
          </button>
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </>
      ) : null}
    </div>
  )
}

export default ProfileAvatar
