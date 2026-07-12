import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ outputId: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { outputId } = await params

  // PDF generation via Puppeteer requires a self-hosted deployment with
  // a full Chromium binary. It is disabled on Vercel serverless.
  // DOCX export is available and works everywhere.
  if (process.env.VERCEL || process.env.DISABLE_PDF_EXPORT === 'true') {
    return new Response(
      JSON.stringify({
        error: 'PDF export is not available in the cloud demo deployment.',
        message:
          'PDF generation requires a self-hosted environment with Chromium. ' +
          'Please use the DOCX export instead, or clone and run this project locally.',
      }),
      {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Local / self-hosted: use Puppeteer
  try {
    const output = await db.generatedOutput.findUnique({
      where: { id: outputId },
      include: {
        meetingRequest: {
          include: { clientProfile: true },
        },
      },
    })

    if (!output) {
      return new Response(JSON.stringify({ error: 'Output not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const meeting = output.meetingRequest

    // Dynamic import so the puppeteer module is never bundled for Vercel
    const puppeteer = (await import('puppeteer')).default
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    const secret = process.env.NEXTAUTH_SECRET || 'secret'
    const port = process.env.PORT || '3000'
    const renderUrl = `http://localhost:${port}/export/render/${outputId}?secret=${secret}`

    await page.goto(renderUrl, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    })

    await browser.close()

    const company = meeting.clientProfile.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const title = meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const dateStr = meeting.meetingDate
      ? new Date(meeting.meetingDate).toISOString().split('T')[0]
      : 'no-date'
    const filename = `${company}_${title}_${dateStr}.pdf`

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('PDF Generation Error:', message)
    return new Response(
      JSON.stringify({ error: 'PDF generation failed', message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
