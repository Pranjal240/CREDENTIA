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
  const sanitized = originalFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const key = `credentia/${folder}/${Date.now()}-${sanitized}`

  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: contentType,
    CacheControl: 'max-age=31536000',
  }))

  return {
    url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`,
    key,
    filename: originalFilename,
    bytes: file.length,
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    Key: key,
  }))
}

export default r2Client
