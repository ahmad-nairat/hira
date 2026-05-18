import { injectable } from 'tsyringe'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface IFileService {
  upload(buffer: Buffer, key: string, mimeType: string): Promise<string>
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>
  publicUrl(key: string): string
}

@injectable()
export class R2FileService implements IFileService {
  private readonly s3: S3Client
  private readonly bucket: string
  private readonly publicBase: string

  constructor() {
    this.bucket = process.env.R2_BUCKET as string
    this.publicBase = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
      forcePathStyle: true,
    })
  }

  async upload(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    )
    return this.publicUrl(key)
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    )
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`
  }
}
