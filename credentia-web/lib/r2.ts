// lib/r2.ts — Cloudflare R2 Storage Helper
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(
  file: Buffer,
  originalFilename: string,
  contentType: string,
  folder: string = 'documents'
): Promise<{ url: string; key: string; filename: string; bytes: number }> {
  const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const uniqueKey = `credentia/${folder}/${Date.now()}-${sanitizedFilename}`

  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: uniqueKey,
      Body: file,
      ContentType: contentType,
      CacheControl: 'max-age=31536000',
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        folder,
      },
    })
  )

  return {
    url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${uniqueKey}`,
    key: uniqueKey,
    filename: originalFilename,
    bytes: file.length,
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: key,
    })
  )
}

export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
  }
  return types[ext || ''] || 'application/octet-stream'
}

export default r2Client
