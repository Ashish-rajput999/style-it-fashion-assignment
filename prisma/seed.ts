import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing tables
  console.log('🧹 Cleaning existing database records...')
  await prisma.voiceKnowledgeEntry.deleteMany()
  await prisma.promptTemplate.deleteMany()
  await prisma.generatedOutput.deleteMany()
  await prisma.previewResult.deleteMany()
  await prisma.transcript.deleteMany()
  await prisma.meetingRequest.deleteMany()
  await prisma.clientProfile.deleteMany()
  await prisma.user.deleteMany()

  // Hash password
  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. Create Admin User
  console.log('👤 Creating Admin User...')
  const admin = await prisma.user.create({
    data: {
      email: 'admin@meetingmind.com',
      passwordHash,
      role: 'ADMIN',
      name: 'System Administrator',
    },
  })

  // 2. Create Demo Client Profiles
  console.log('👥 Creating Demo Client Profiles...')
  const clientsData = [
    {
      email: 'client1@meetingmind.com',
      name: 'Pierre Dubois',
      companyName: 'AeroParts France',
      tier: 'ESSENTIAL',
      title: 'CSE Logistics Restructure Plan',
      ref: 'REF-2026-CSE-001',
    },
    {
      email: 'client2@meetingmind.com',
      name: 'Sarah Bernard',
      companyName: 'RetailCorp Europe',
      tier: 'SCOPE',
      title: 'Extraordinary Works Council Meeting',
      ref: 'REF-2026-CSE-002',
    },
    {
      email: 'client3@meetingmind.com',
      name: 'Jean Dupont',
      companyName: 'TechSolutions Paris',
      tier: 'PREMIUM',
      title: 'Annual Economic and Strategy Review',
      ref: 'REF-2026-CSE-003',
    },
  ]

  for (const client of clientsData) {
    const user = await prisma.user.create({
      data: {
        email: client.email,
        passwordHash,
        role: 'CLIENT',
        name: client.name,
      },
    })

    const profile = await prisma.clientProfile.create({
      data: {
        userId: user.id,
        companyName: client.companyName,
        region: 'FR',
        complianceType: 'CSE',
        notesFromAdmin: `Seeded demo profile for ${client.companyName}`,
      },
    })

    // 3. Create one populated MeetingRequest + GeneratedOutput per client
    console.log(`📝 Creating MeetingRequest and Outputs for ${client.companyName} (${client.tier})...`)
    const meetingDate = new Date('2026-06-20T10:00:00.000Z')
    const request = await prisma.meetingRequest.create({
      data: {
        clientProfileId: profile.id,
        title: client.title,
        meetingDate,
        language: 'fr',
        region: 'FR',
        complianceType: 'CSE',
        location: 'Paris HQ - Salle Conseil',
        meetingType: client.tier === 'ESSENTIAL' ? 'Ordinary' : 'Extraordinary',
        tier: client.tier,
        status: 'DISPATCHED', // Ready for viewing
        sourceFileUrl: '/uploads/sample-audio.mp3',
        notes: `Automatically generated demo meeting for testing the ${client.tier} tier report templates.`,
      },
    })

    // Seed mock raw transcript
    await prisma.transcript.create({
      data: {
        meetingRequestId: request.id,
        rawJson: JSON.stringify([
          { speaker: 'Mohit Dandwani', start: 0, end: 15, text: 'Bienvenue à tous pour cette séance du CSE. Nous débutons l\'ordre du jour par la réorganisation de la logistique.' },
          { speaker: 'Sarah Bernard', start: 16, end: 32, text: 'Merci Monsieur le Président. La direction propose d\'introduire des parcours de formation pour les opérateurs impactés.' },
          { speaker: 'Pierre Dubois', start: 33, end: 55, text: 'Nous demandons des compensations supplémentaires et un délai de réflexion d\'au moins un mois avant la mise en œuvre.' },
        ]),
        editedJson: JSON.stringify([
          { speaker: 'Mohit Dandwani (Président)', start: 0, end: 15, text: 'Bienvenue à tous pour cette séance du CSE. Nous débutons l\'ordre du jour par la réorganisation de la logistique.' },
          { speaker: 'Sarah Bernard (DRH)', start: 16, end: 32, text: 'Merci Monsieur le Président. La direction propose d\'introduire des parcours de formation pour les opérateurs impactés.' },
          { speaker: 'Pierre Dubois (Élu Union A)', start: 33, end: 55, text: 'Nous demandons des compensations supplémentaires et un délai de réflexion d\'au moins un mois avant la mise en œuvre de l\'Article L.2312-8.' },
        ]),
      },
    })

    // Conforming MINUTES_REPORT content conforming to report-schema.ts
    const minutesReportContent = {
      type: 'MINUTES_REPORT',
      meta: {
        title: client.title,
        company: client.companyName,
        date: meetingDate.toISOString(),
        location: 'Paris HQ - Salle Conseil',
        meetingType: client.tier === 'ESSENTIAL' ? 'Ordinary' : 'Extraordinary',
        complianceType: 'CSE',
        preparedBy: 'MeetingMind AI',
        reference: client.ref,
        language: 'fr',
      },
      stats: {
        attendees: 3,
        duration: '1h 20m',
        decisions: 1,
        actionItems: 2,
      },
      attendees: [
        { name: 'Mohit Dandwani', role: 'Chairperson', status: 'Present', arrival: '10:00', departure: '11:20' },
        { name: 'Sarah Bernard', role: 'HR Director', status: 'Present', arrival: '10:00', departure: '11:20' },
        { name: 'Pierre Dubois', role: 'Staff Representative (Union A)', status: 'Present', arrival: '10:02', departure: '11:20' },
      ],
      execSummary: [
        {
          label: 'Executive Summary',
          text: `This ${client.tier} tier report outlines the restructure of the logistics sector. The committee held consultations regarding retraining packages, aligning with Article L.2312-8 of the French Labor Code.`,
        },
        {
          label: 'Organizational Impact',
          text: 'A total of 15 logistics positions are planned for relocation, with corresponding compensation plans agreed upon by majority vote.',
        },
      ],
      discussionSegments: [
        {
          speaker: 'Mohit Dandwani',
          role: 'Chairperson',
          text: 'Bienvenue à tous pour cette séance du CSE. Nous débutons l\'ordre du jour par la réorganisation de la logistique.',
          timestamp: '10:02',
          roleVariant: 'neutral',
        },
        {
          speaker: 'Sarah Bernard',
          role: 'HR Director',
          text: 'Merci Monsieur le Président. La direction propose d\'introduire des parcours de formation pour les opérateurs impactés.',
          timestamp: '10:05',
          roleVariant: 'role-b',
        },
        {
          speaker: 'Pierre Dubois',
          role: 'Staff Representative (Union A)',
          text: 'Nous demandons des compensations supplémentaires et un délai de réflexion d\'au moins un mois avant la mise en œuvre de l\'Article L.2312-8.',
          timestamp: '10:12',
          roleVariant: 'role-a',
        },
      ],
      alerts: [
        {
          type: 'decision',
          subject: 'Relocation Packages Approved',
          fact: 'Compensation packages ratified with an increased budget allocation of 12% for retraining.',
          nextStep: 'HR department to distribute details of the plan to employees.',
          relatedArticle: 'Art. L.2315-34',
        },
        {
          type: 'unresolved',
          subject: 'Relocation Schedule Sign-off',
          fact: 'The transition calendar remains open pending regional operator feedback.',
          nextStep: 'Sarah Bernard to procure details by July 15.',
        },
      ],
      timeline: [
        { date: '10:02 AM', description: 'Opening address and agenda presentation.' },
        { date: '10:05 AM', description: 'HR presentation of retraining program details.' },
        { date: '10:12 AM', description: 'Union statements regarding transition durations.' },
        { date: '10:50 AM', description: 'Formal vote called on relocation compensation plan.' },
        { date: '11:20 AM', description: 'Adjournment.' },
      ],
      votes: [
        {
          question: 'Adopt final logistics transition support packages with 12% training compensation?',
          voteDate: '2026-06-20',
          voters: [
            { name: 'Pierre Dubois', group: 'Union A', vote: 'Favorable' },
            { name: 'Sarah Bernard', group: 'HR Management', vote: 'Favorable' },
          ],
          result: 'Resolution approved by majority vote.',
        },
      ],
      compliance: {
        score: 85,
        compliantAreas: 5,
        criticalRisks: 0,
        missingDocuments: 1,
        recommendations: 2,
        riskExposureLevel: 'Low',
        findings: [
          {
            code: 'L.2312-8',
            label: 'Information and Consultation',
            compliant: true,
            riskLevel: 'low',
            coverage: 100,
            detail: 'Agenda formally shared and topic discussed fully.',
          },
          {
            code: 'L.2315-34',
            label: 'Minutes and Voting',
            compliant: true,
            riskLevel: 'low',
            coverage: 100,
            detail: 'Formal votes and resolutions recorded with voter names.',
          },
          {
            code: 'L.2315-3',
            label: 'Elected Representatives Present',
            compliant: true,
            riskLevel: 'low',
            coverage: 100,
            detail: 'Required quorum was met by participant representatives.',
          },
          {
            code: 'R.4141-3',
            label: 'Health and Safety',
            compliant: false,
            riskLevel: 'medium',
            coverage: 0,
            detail: 'No specific HSE risk discussion recorded in the transcript.',
          },
        ],
        breakdown: [
          { label: 'Procedure', score: 100 },
          { label: 'Information Sharing', score: 100 },
          { label: 'HSE Checks', score: 50 },
        ],
      },
      speakerAnalysis: {
        speakers: [
          { name: 'Mohit Dandwani', role: 'Chairperson', wordCount: 150, turnCount: 5, participationPct: 20 },
          { name: 'Sarah Bernard', role: 'HR Director', wordCount: 350, turnCount: 8, participationPct: 45 },
          { name: 'Pierre Dubois', role: 'Staff Representative', wordCount: 280, turnCount: 7, participationPct: 35 },
        ],
        topics: ['logistics', 'retraining', 'consultation', 'restructure'],
        totalWords: 780,
        totalTurns: 20,
      },
    }

    await prisma.generatedOutput.create({
      data: {
        meetingRequestId: request.id,
        type: 'MINUTES_REPORT',
        contentJson: JSON.stringify(minutesReportContent),
        locked: true,
        lockedAt: new Date(),
        dispatchedAt: new Date(),
      },
    })
  }

  // 4. Seed Prompt Presets
  console.log('📝 Seeding Prompt Presets...')
  const templates = [
    {
      name: 'Basic Minutes Summary',
      outputType: 'MINUTES_REPORT',
      tier: 'ESSENTIAL',
      promptText: 'Analyze the transcript chronologically. Generate a clean executive summary and index the main discussion segments.',
    },
    {
      name: 'Agenda Compliance Report',
      outputType: 'MINUTES_REPORT',
      tier: 'SCOPE',
      promptText: 'Generate agenda-based formal meeting minutes. Perform a checklist compliance audit and draft the decision callout cards.',
    },
    {
      name: 'Legal Compliance Audit & Transcripts',
      outputType: 'MINUTES_REPORT',
      tier: 'PREMIUM',
      promptText: 'Perform a comprehensive French Labor Code compliance check. Log clause-by-clause analysis, full diarized speaker dialogue tables, and vote outcome summaries.',
    },
    {
      name: 'Speaker Analysis Generator',
      outputType: 'SPEAKER_ANALYSIS',
      tier: 'ALL',
      promptText: 'Analyze talking durations, turn metrics, and topic allocations per participant.',
    },
  ]

  for (const t of templates) {
    await prisma.promptTemplate.create({
      data: t,
    })
  }

  // 5. Seed Voice Knowledge Entries (FAQ FAQs for assistant)
  console.log('🎙️ Seeding Voice Assistant FAQs...')
  const voiceFAQs = [
    {
      question: 'How do I submit a new meeting?',
      answer: 'Click the "New Report" button on your dashboard. Choose your region and compliance type, specify meeting details, and upload your audio recording. The AI will start transcribing automatically.',
    },
    {
      question: 'What compliance frameworks are supported?',
      answer: 'Currently we support CSE (Comité Social et Économique) works councils for France, auditable against the French Labor Code. Support for German Betriebsrat is coming soon.',
    },
    {
      question: 'Can I edit the meeting minutes before dispatching?',
      answer: 'Yes! As an administrator, you can open any meeting from the queue, access the transcription editor, correct speaker names, and use the "AI Assist" toolbar to draft components.',
    },
    {
      question: 'How do clients review and sign their reports?',
      answer: 'Once dispatched, clients can read their reports inside our interactive 3D e-book reader. They can verify details and check off compliance audits directly on their dashboard.',
    },
    {
      question: 'Are my audio uploads secure?',
      answer: 'Absolutely. All uploaded audio is encrypted at rest and in transit. We execute transcriptions using sandboxed private APIs and purge raw files after final report generation.',
    },
  ]

  for (const entry of voiceFAQs) {
    await prisma.voiceKnowledgeEntry.create({
      data: entry,
    })
  }

  console.log('✅ Database seeding finished successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
