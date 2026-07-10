import path from 'path'
import fs from 'fs/promises'

export interface StorageProvider {
  save(buffer: Buffer, filename: string, folder?: string): Promise<string>
  read(fileUrl: string): Promise<Buffer>
  delete(fileUrl: string): Promise<void>
  getPublicUrl(fileUrl: string): string
}

/**
 * Local filesystem storage provider.
 * Files are stored under /public/uploads/<folder>/<filename>.
 * In production, swap this for an S3StorageProvider implementing the same interface.
 */
class LocalStorageProvider implements StorageProvider {
  private uploadDir: string

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR ?? './public/uploads'
  }

  async save(buffer: Buffer, filename: string, folder = 'uploads'): Promise<string> {
    const dir = path.join(this.uploadDir, folder)
    await fs.mkdir(dir, { recursive: true })

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const timestamp = Date.now()
    const finalName = `${timestamp}_${safeFilename}`
    const filePath = path.join(dir, finalName)

    await fs.writeFile(filePath, buffer)
    return `/${folder}/${finalName}`
  }

  async read(fileUrl: string): Promise<Buffer> {
    const filePath = path.join(process.cwd(), 'public', fileUrl)
    const data = await fs.readFile(filePath)
    return Buffer.from(data)
  }

  async delete(fileUrl: string): Promise<void> {
    const filePath = path.join(process.cwd(), 'public', fileUrl)
    await fs.unlink(filePath).catch(() => undefined)
  }

  getPublicUrl(fileUrl: string): string {
    return fileUrl
  }
}

export const storage: StorageProvider = new LocalStorageProvider()
