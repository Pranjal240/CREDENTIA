import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { userId, documentType, fileUrl, fileName, fileSize } = await req.json()
    if (!userId || !documentType || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('documents').upsert({
      user_id: userId,
      document_type: documentType,
      file_url: fileUrl,
      file_name: fileName || null,
      file_size: fileSize || null,
      status: 'pending',
      uploaded_at: new Date().toISOString(),
    }, { onConflict: 'user_id,document_type' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
