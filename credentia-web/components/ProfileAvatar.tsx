'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'

interface ProfileAvatarProps {
  profile: any
  userId: string
  size?: 'sm' | 'md' | 'lg'
  onUploadSuccess?: (newUrl: string) => void
}

export function ProfileAvatar({ profile, userId, size = 'sm', onUploadSuccess }: ProfileAvatarProps) {
  const [uploading, setUploading] = useState(false)
  const [imgError, setImgError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const img = new window.Image()
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          const max_size = 200
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width
              width = max_size
            }
          } else {
            if (height > max_size) {
              width *= max_size / height
              height = max_size
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

            const { error } = await supabase
              .from('profiles')
              .update({ avatar_url: dataUrl })
              .eq('id', userId)

            if (error) throw error
            if (onUploadSuccess) onUploadSuccess(dataUrl)
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Failed to upload avatar', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const dim = size === 'lg' ? 64 : size === 'md' ? 40 : 32

  return (
    <div className="relative group rounded-full flex-shrink-0 cursor-pointer" style={{ width: dim, height: dim }}>
      {uploading ? (
        <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center border border-white/20">
          <Loader2 size={dim * 0.4} className="animate-spin text-blue-400" />
        </div>
      ) : profile?.avatar_url && !imgError ? (
        <div className="w-full h-full relative rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center">
          <img 
            src={profile.avatar_url} 
            alt="Avatar" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer" 
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-white font-heading font-bold" style={{ fontSize: dim * 0.4 }}>
          {(profile?.full_name || profile?.email || 'U')[0]?.toUpperCase()}
        </div>
      )}

      {/* Overlay to trigger upload */}
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10"
        title="Change Profile Picture"
      >
        <Camera size={dim * 0.4} className="text-white shadow-sm" />
      </button>

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
    </div>
  )
}
