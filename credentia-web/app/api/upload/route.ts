import { NextResponse } from 'next/server'
import { uploadToR2, getContentType } from '@/lib/r2'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'documents'
    const studentId = formData.get('studentId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const contentType = getContentType(file.name)

    const result = await uploadToR2(buffer, file.name, contentType, folder)

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Next.js App Router handles multipart automatically, no config needed
