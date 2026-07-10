/**
 * Mock LLM Provider
 * Does real light NLP over transcript text — word frequency, speaker analysis,
 * sentence counting, regex-based number extraction — so the demo output varies
 * visibly with different transcripts.
 * 
 * Production swap: Set AI_PROVIDER=openai|gemini|deepseek with matching API key.
 */
import type { LLMProvider, LLMSchema } from '../types'
import type { TranscriptSegment } from '../types'

// ─── NLP Helpers ────────────────────────────────────────────────────────────

function wordFrequency(text: string, stopwords: string[] = []): Record<string, number> {
  const words = text.toLowerCase().match(/\b[a-zA-ZÀ-ÿ]{4,}\b/g) ?? []
  const freq: Record<string, number> = {}
  for (const word of words) {
    if (!stopwords.includes(word)) {
      freq[word] = (freq[word] ?? 0) + 1
    }
  }
  return freq
}

function topN(freq: Record<string, number>, n: number): string[] {
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([word]) => word)
}

function countSentences(text: string): number {
  return (text.match(/[.!?]+/g) ?? []).length || 1
}

function extractNumbers(text: string): number[] {
  const matches = text.match(/\b\d+([.,]\d+)?\b/g) ?? []
  return matches.map((n) => parseFloat(n.replace(',', '.'))).filter((n) => !isNaN(n) && n > 0 && n < 10000)
}

// ─── Speaker Analysis Schema ─────────────────────────────────────────────────

function generateSpeakerAnalysis(segments: TranscriptSegment[]) {
  const speakerMap: Record<string, { wordCount: number; turnCount: number; sentences: number; sampleText: string }> = {}

  for (const seg of segments) {
    if (!speakerMap[seg.speaker]) {
      speakerMap[seg.speaker] = { wordCount: 0, turnCount: 0, sentences: 0, sampleText: '' }
    }
    const words = seg.text.match(/\b\w+\b/g) ?? []
    speakerMap[seg.speaker].wordCount += words.length
    speakerMap[seg.speaker].turnCount += 1
    speakerMap[seg.speaker].sentences += countSentences(seg.text)
    if (!speakerMap[seg.speaker].sampleText) {
      speakerMap[seg.speaker].sampleText = seg.text.slice(0, 120)
    }
  }

  const totalWords = Object.values(speakerMap).reduce((s, v) => s + v.wordCount, 0)
  const speakers = Object.entries(speakerMap).map(([name, stats]) => ({
    name,
    wordCount: stats.wordCount,
    turnCount: stats.turnCount,
    sentences: stats.sentences,
    participationPct: totalWords > 0 ? Math.round((stats.wordCount / totalWords) * 100) : 0,
    sampleText: stats.sampleText,
    role: deriveRole(name),
  }))

  const allText = segments.map((s) => s.text).join(' ')
  const stopwords = ['that', 'this', 'avec', 'dans', 'pour', 'nous', 'vous', 'les', 'des', 'une', 'est', 'sont', 'être', 'avoir']
  const topics = topN(wordFrequency(allText, stopwords), 8)

  return { speakers, topics, totalWords, totalTurns: segments.length }
}

function deriveRole(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('président') || lower.includes('president')) return 'Chairperson'
  if (lower.includes('drh') || lower.includes('rh')) return 'HR Director'
  if (lower.includes('secrétaire') || lower.includes('secretaire')) return 'Secretary'
  if (lower.includes('cgt') || lower.includes('cfdt') || lower.includes('syndical')) return 'Union Representative'
  if (lower.includes('élu') || lower.includes('elu')) return 'Elected Representative'
  if (lower.includes('directeur') || lower.includes('director')) return 'Executive'
  return 'Participant'
}

// ─── Chart Data Schema ────────────────────────────────────────────────────────

function generateChartData(segments: TranscriptSegment[]) {
  const speakerAnalysis = generateSpeakerAnalysis(segments)
  const allText = segments.map((s) => s.text).join(' ')
  const numbers = extractNumbers(allText)

  // Speaker participation pie
  const participationData = speakerAnalysis.speakers.map((s) => ({
    name: s.name.split(' ').slice(0, 2).join(' '),
    value: s.participationPct,
    turns: s.turnCount,
  }))

  // Timeline distribution — bucket into 5 time windows
  const buckets = 5
  const maxTime = Math.max(...segments.map((s) => s.end))
  const bucketSize = maxTime / buckets
  const timelineData = Array.from({ length: buckets }, (_, i) => {
    const from = i * bucketSize
    const to = (i + 1) * bucketSize
    const count = segments.filter((s) => s.start >= from && s.start < to).length
    return { label: `${Math.round(from / 60)}m`, utterances: count }
  })

  // Key numbers extracted from text
  const keyMetrics = {
    totalSpeakers: speakerAnalysis.speakers.length,
    totalTurns: speakerAnalysis.totalTurns,
    totalWords: speakerAnalysis.totalWords,
    avgWordsPerTurn: Math.round(speakerAnalysis.totalWords / speakerAnalysis.totalTurns),
    durationMinutes: Math.round(maxTime / 60),
    numbersFound: numbers.slice(0, 5),
  }

  return { participationData, timelineData, keyMetrics, topics: speakerAnalysis.topics }
}

// ─── Compliance Analyzer Schema ───────────────────────────────────────────────

const CSE_CHECKLIST = [
  { code: 'L.2312-8', label: 'Information/Consultation préalable', keywords: ['consultation', 'consulter', 'informé', 'information', 'préalable'] },
  { code: 'L.2315-34', label: 'Procès-verbal et vote', keywords: ['vote', 'voter', 'résolution', 'procès-verbal', 'adopté', 'rejeté'] },
  { code: 'L.2315-3', label: 'Représentants du personnel présents', keywords: ['élu', 'représentant', 'secrétaire', 'trésorier'] },
  { code: 'L.2323-7', label: 'Ordre du jour communiqué', keywords: ['ordre du jour', 'ordre', 'point', 'agenda'] },
  { code: 'L.3121-27', label: 'Horaires de travail et durée', keywords: ['durée', 'horaire', 'temps', 'heure'] },
  { code: 'R.4141-3', label: 'Hygiène et sécurité', keywords: ['sécurité', 'risque', 'santé', 'accident'] },
]

function generateComplianceAnalysis(segments: TranscriptSegment[]) {
  const allText = segments.map((s) => s.text).join(' ').toLowerCase()

  const findings = CSE_CHECKLIST.map((item) => {
    const found = item.keywords.filter((kw) => allText.includes(kw)).length
    const coverage = Math.min(1, found / item.keywords.length)
    const compliant = coverage >= 0.4
    const riskLevel: 'low' | 'medium' | 'high' = coverage >= 0.6 ? 'low' : coverage >= 0.2 ? 'medium' : 'high'

    return {
      code: item.code,
      label: item.label,
      compliant,
      riskLevel,
      coverage: Math.round(coverage * 100),
      detail: compliant
        ? `Requirement met: ${item.keywords.filter((kw) => allText.includes(kw)).join(', ')} mentioned.`
        : `Requirement not clearly met. Expected keywords: ${item.keywords.join(', ')}.`,
    }
  })

  const compliantCount = findings.filter((f) => f.compliant).length
  const score = Math.round((compliantCount / findings.length) * 100)
  const risks = findings.filter((f) => !f.compliant)
  const criticalRisks = risks.filter((f) => f.riskLevel === 'high').length
  const mediumRisks = risks.filter((f) => f.riskLevel === 'medium').length

  return {
    score,
    compliantAreas: compliantCount,
    missingDocuments: criticalRisks,
    recommendations: mediumRisks + Math.floor(Math.random() * 3) + 2,
    criticalRisks,
    findings,
    breakdown: [
      { label: 'Labor Law Compliance', score: Math.min(100, score + 3) },
      { label: 'Documentation Quality', score: Math.min(100, score - 4) },
      { label: 'Risk Exposure', score: Math.max(10, 100 - score + 19) },
      { label: 'Data Completeness', score: Math.min(100, score - 1) },
    ],
    riskExposureLevel: score >= 80 ? 'Low' : score >= 60 ? 'Low to Medium' : score >= 40 ? 'Medium' : 'High',
  }
}

// ─── Report Schema ────────────────────────────────────────────────────────────

function generateMinutesReport(segments: TranscriptSegment[], meetingContext?: Record<string, unknown>) {
  const speakerAnalysis = generateSpeakerAnalysis(segments)
  const complianceAnalysis = generateComplianceAnalysis(segments)

  return {
    type: 'MINUTES_REPORT',
    meta: {
      title: (meetingContext?.title as string) ?? 'CSE Meeting Minutes',
      company: (meetingContext?.company as string) ?? 'Styleit Fashion Pvt Ltd',
      date: (meetingContext?.meetingDate as string) ?? new Date().toISOString(),
      location: (meetingContext?.location as string) ?? 'Mumbai',
      meetingType: (meetingContext?.meetingType as string) ?? 'Ordinary',
      complianceType: (meetingContext?.complianceType as string) ?? 'CSE',
      preparedBy: 'MeetingMind AI',
      reference: `MM-${Date.now()}`,
    },
    stats: {
      attendees: speakerAnalysis.speakers.length,
      duration: `${Math.ceil((segments[segments.length - 1]?.end ?? 3600) / 60)} min`,
      decisions: segments.filter((s) => /décision|voté|adopté|résolution/i.test(s.text)).length,
      actionItems: segments.filter((s) => /s'engage|engagement|prochain|deadline|délai/i.test(s.text)).length,
    },
    attendees: speakerAnalysis.speakers.map((s) => ({
      name: s.name,
      role: s.role,
      status: 'Present',
      arrival: '09:00',
      departure: '11:30',
    })),
    execSummary: [
      { label: 'Executive Summary', text: `The ${(meetingContext?.complianceType as string) ?? 'CSE'} meeting was held on ${new Date((meetingContext?.meetingDate as string) ?? new Date()).toLocaleDateString('fr-FR')} and covered ${speakerAnalysis.topics.slice(0, 3).join(', ')}. ${speakerAnalysis.speakers.length} participants engaged across ${segments.length} discussion turns.` },
      { label: 'Context', text: `Meeting conducted in accordance with French Labor Code requirements. ${complianceAnalysis.compliantAreas} out of ${complianceAnalysis.findings.length} compliance areas were satisfactorily covered.` },
      { label: 'Compliance Status', text: `Overall compliance score: ${complianceAnalysis.score}%. ${complianceAnalysis.criticalRisks} critical areas require immediate attention.` },
    ],
    discussionSegments: segments.map((seg) => ({
      speaker: seg.speaker,
      role: deriveRole(seg.speaker),
      text: seg.text,
      timestamp: `${Math.floor(seg.start / 60)}:${String(Math.floor(seg.start % 60)).padStart(2, '0')}`,
    })),
    compliance: complianceAnalysis,
    speakerAnalysis,
  }
}

// ─── Main Provider ────────────────────────────────────────────────────────────

export class MockLLMProvider implements LLMProvider {
  async generate(prompt: string, context: string, schema: LLMSchema): Promise<unknown> {
    // Simulate LLM processing delay
    await new Promise((resolve) => setTimeout(resolve, 1200))

    // Parse segments from context if provided
    let segments: TranscriptSegment[] = []
    let meetingContext: Record<string, unknown> = {}

    try {
      const parsed = JSON.parse(context)
      if (Array.isArray(parsed)) {
        segments = parsed
      } else if (parsed.segments) {
        segments = parsed.segments
        meetingContext = parsed.context ?? {}
      } else {
        meetingContext = parsed
        // Try to parse segments from prompt
        const segMatch = prompt.match(/\[.*\]/s)
        if (segMatch) segments = JSON.parse(segMatch[0])
      }
    } catch {
      // Context is plain text — do best-effort analysis
      if (context.length > 50) {
        segments = [{ speaker: 'Speaker 1', start: 0, end: 60, text: context.slice(0, 500) }]
      }
    }

    switch (schema) {
      case 'speakers':
        return generateSpeakerAnalysis(segments)
      case 'chart-data':
        return generateChartData(segments)
      case 'analyzer':
        return generateComplianceAnalysis(segments)
      case 'report':
        return generateMinutesReport(segments, meetingContext)
      default:
        return { error: 'Unknown schema', schema }
    }
  }
}
