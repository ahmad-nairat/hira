import { injectable } from 'tsyringe'
import { promises as fs } from 'fs'
import * as path from 'path'
import { IFileService } from './file.service'

const UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR ?? path.resolve(process.cwd(), 'uploads')

@injectable()
export class LocalFileService implements IFileService {
  private readonly publicBase: string

  constructor() {
    // Served by AppServer at /files/{key}. Prefer absolute URL via API_PUBLIC_URL so
    // workers and the platform can fetch resumes by full URL.
    const apiBase = (process.env.API_PUBLIC_URL ?? '').replace(/\/$/, '')
    const explicit = process.env.LOCAL_FILE_PUBLIC_URL?.replace(/\/$/, '')
    this.publicBase = explicit ?? (apiBase ? `${apiBase}/files` : '/files')
  }

  async upload(buffer: Buffer, key: string, _mimeType: string): Promise<string> {
    const fullPath = path.join(UPLOAD_DIR, key)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, buffer)
    return this.publicUrl(key)
  }

  async getSignedUrl(key: string, _expiresInSeconds?: number): Promise<string> {
    return this.publicUrl(key)
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`
  }
}

export const LOCAL_UPLOAD_DIR = UPLOAD_DIR
