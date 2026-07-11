import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { storage } from '@/lib/storage'

const ALLOWED_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_BYTES = 500 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const draftId = formData.get('draftId') as string | null

    if (!file || !draftId) {
      return NextResponse.json({ error: 'Missing file or draftId.' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `File too large. Max ${MAX_BYTES / 1024 / 1024} MB.` }, { status: 413 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File type "${file.type}" not supported.` }, { status: 415 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileUrl = await storage.save(buffer, file.name, 'uploads')

    await db.meetingRequest.update({
      where: { id: draftId },
      data: { sourceFileUrl: fileUrl },
    })

    return NextResponse.json({ ok: true, fileUrl })
  } catch (err) {
    console.error('[UPLOAD]', err)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
