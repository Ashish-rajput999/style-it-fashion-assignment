import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import puppeteer from 'puppeteer'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ outputId: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { outputId } = await params

  try {
    // 1. Fetch from DB
    const output = await db.generatedOutput.findUnique({
      where: { id: outputId },
      include: {
        meetingRequest: {
          include: {
            clientProfile: true,
          },
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

    // 2. Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    
    // Use the expected secret token for export render verification
    const secret = process.env.NEXTAUTH_SECRET || 'secret'
    const port = process.env.PORT || '3000'
    const renderUrl = `http://localhost:${port}/export/render/${outputId}?secret=${secret}`

    await page.goto(renderUrl, { waitUntil: 'networkidle0' })

    // 3. Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    })

    await browser.close()

    // 4. Formulate filename
    const company = meeting.clientProfile.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const title = meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const dateStr = meeting.meetingDate
      ? new Date(meeting.meetingDate).toISOString().split('T')[0]
      : 'no-date'
    const filename = `${company}_${title}_${dateStr}.pdf`

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error('PDF Generation Error:', err)
    return new Response(
      JSON.stringify({
        error: 'PDF generation failed',
        message: err.message || String(err),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
