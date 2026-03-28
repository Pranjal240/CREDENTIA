import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadToR2 } from '@/lib/r2'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'documents'
    const studentId = formData.get('studentId') as string

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToR2(buffer, file.name, file.type, folder)

    if (studentId && folder === 'resumes') {
      await supabaseAdmin.from('students').update({
        resume_url: result.url,
        resume_filename: file.name,
      }).eq('id', studentId)
    }

    return NextResponse.json({ success: true, url: result.url, key: result.key, filename: file.name })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
