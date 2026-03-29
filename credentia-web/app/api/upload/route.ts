import { NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    // Validate content type
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: `Invalid content-type: ${contentType}. Expected multipart/form-data.` },
        { status: 400 }
      )
    }

    // Parse form data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (parseError: any) {
      console.error('[upload] FormData parse error:', parseError)
      return NextResponse.json(
        { success: false, error: `Failed to parse form data: ${parseError.message}` },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'documents'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided in form data. Ensure the field name is "file".' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Uploaded file is empty (0 bytes).' },
        { status: 400 }
      )
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max is 10MB.` },
        { status: 400 }
      )
    }

    // Verify R2 env vars are configured
    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || !process.env.CLOUDFLARE_R2_BUCKET_NAME) {
      console.error('[upload] Missing R2 environment variables')
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: R2 storage credentials are missing.' },
        { status: 500 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log(`[upload] Uploading ${file.name} (${file.size} bytes, ${file.type}) to folder: ${folder}`)

    // Upload to R2
    const result = await uploadToR2(buffer, file.name, file.type, folder)

    console.log(`[upload] Success: ${result.url}`)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[upload] Unhandled error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Upload failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
