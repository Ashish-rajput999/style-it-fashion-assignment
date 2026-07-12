import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import type { MinutesReport } from '@/lib/report-schema'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType } from 'docx'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ outputId: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { outputId } = await params

  try {
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
    const report = JSON.parse(output.contentJson) as MinutesReport

    // 1. Map executive summary items
    const summaryParagraphs: Paragraph[] = []
    if (report.execSummary && report.execSummary.length > 0) {
      for (const item of report.execSummary) {
        summaryParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${item.label}: `, bold: true }),
              new TextRun({ text: item.text }),
            ],
            spacing: { after: 120 },
          })
        )
      }
    }

    // 2. Map discussion segments
    const discussionParagraphs: Paragraph[] = []
    if (report.discussionSegments && report.discussionSegments.length > 0) {
      for (const seg of report.discussionSegments) {
        discussionParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `[${seg.timestamp || '00:00'}] `, color: '555555' }),
              new TextRun({ text: `${seg.speaker} (${seg.role || 'Participant'}): `, bold: true }),
              new TextRun({ text: seg.text }),
            ],
            spacing: { after: 80 },
          })
        )
      }
    }

    // 3. Map resolutions
    const resolutionsParagraphs: Paragraph[] = []
    if (report.alerts && report.alerts.length > 0) {
      for (const alert of report.alerts) {
        resolutionsParagraphs.push(
          new Paragraph({
            text: `${alert.type.toUpperCase()}: ${alert.subject}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 120, after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fact: ', bold: true }),
              new TextRun({ text: alert.fact }),
            ],
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Next Step: ', bold: true }),
              new TextRun({ text: alert.nextStep }),
            ],
            spacing: { after: 80 },
          })
        )
      }
    }

    // 4. Map compliance checklist
    const complianceParagraphs: Paragraph[] = []
    if (report.compliance) {
      complianceParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Compliance Score: ', bold: true }),
            new TextRun({ text: `${report.compliance.score}%` }),
          ],
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Risk Rating: ', bold: true }),
            new TextRun({ text: `${report.compliance.riskExposureLevel} Risk` }),
          ],
          spacing: { after: 120 },
        })
      )

      if (report.compliance.findings && report.compliance.findings.length > 0) {
        for (const f of report.compliance.findings) {
          complianceParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: `[${f.code}] `, bold: true }),
                new TextRun({ text: `${f.label}: `, bold: true }),
                new TextRun({ text: f.detail }),
                new TextRun({
                  text: f.compliant ? ' (✓ Met)' : ' (✗ Unresolved)',
                  color: f.compliant ? '198C61' : 'D94B4B',
                  bold: true,
                }),
              ],
              spacing: { after: 80 },
            })
          )
        }
      }
    }

    // Create a new document structure
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title Page
            new Paragraph({
              text: report.meta.title || meeting.title,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
            }),
            new Paragraph({
              text: `Company: ${report.meta.company || meeting.clientProfile.companyName}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
            }),
            new Paragraph({
              text: `Date: ${report.meta.date ? new Date(report.meta.date).toLocaleDateString() : '—'}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
            }),
            new Paragraph({
              text: `Prepared By: ${report.meta.preparedBy || 'MeetingMind AI'}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
            }),
            new Paragraph({
              text: `Reference ID: ${report.meta.reference || '—'}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 480 },
            }),

            // Section 1: Executive Summary
            new Paragraph({
              text: 'I. Executive Summary',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 },
            }),
            ...summaryParagraphs,

            // Section 2: Attendance Register
            new Paragraph({
              text: 'II. Attendance Register',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Name', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Role', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Arrival', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Departure', bold: true })] })] }),
                  ],
                }),
                ...((report.attendees || []).map(
                  (att) =>
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ text: att.name })] }),
                        new TableCell({ children: [new Paragraph({ text: att.role })] }),
                        new TableCell({ children: [new Paragraph({ text: att.status })] }),
                        new TableCell({ children: [new Paragraph({ text: att.arrival || '—' })] }),
                        new TableCell({ children: [new Paragraph({ text: att.departure || '—' })] }),
                      ],
                    })
                )),
              ],
            }),

            // Section 3: Verbatim Transcript Discussion
            new Paragraph({
              text: 'III. Meeting Discussion Segments',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 },
            }),
            ...discussionParagraphs,

            // Section 4: Decisions & Resolutions
            new Paragraph({
              text: 'IV. Key Resolutions & Decisions',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 },
            }),
            ...resolutionsParagraphs,

            // Section 5: Compliance Findings
            new Paragraph({
              text: 'V. Regulatory Compliance Audit Checklist',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 },
            }),
            ...complianceParagraphs,
          ],
        },
      ],
    })

    const docxBuffer = await Packer.toBuffer(doc)

    // Formulate filename
    const company = meeting.clientProfile.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const title = meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const dateStr = meeting.meetingDate
      ? new Date(meeting.meetingDate).toISOString().split('T')[0]
      : 'no-date'
    const filename = `${company}_${title}_${dateStr}.docx`

    return new Response(docxBuffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error('DOCX Exporter Error:', err)
    return new Response(
      JSON.stringify({
        error: 'DOCX generation failed',
        message: err.message || String(err),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
