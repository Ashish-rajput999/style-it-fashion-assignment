/**
 * Report Schema — the canonical JSON shape all generated reports must conform to.
 * Both the admin Document Editor and the report renderer consume this type.
 * All GeneratedOutput.contentJson must be parseable as one of these types.
 */

export interface ReportMeta {
  title: string
  company: string
  date: string
  location: string
  meetingType: string
  complianceType: string
  region?: string
  preparedBy: string
  reference: string
  language?: string
}

export interface ReportStats {
  attendees: number
  duration: string
  decisions: number
  actionItems: number
}

export interface Attendee {
  name: string
  role: string
  status: 'Present' | 'Excused' | 'Absent'
  arrival?: string
  departure?: string
  initials?: string
}

export interface ExecSummaryCard {
  label: string
  text: string
}

export interface DiscussionSegment {
  speaker: string
  role: string
  text: string
  timestamp?: string
  roleVariant?: 'neutral' | 'role-a' | 'role-b'
}

export interface AlertItem {
  type: 'decision' | 'unresolved' | 'tension' | 'projection'
  subject: string
  fact: string
  nextStep?: string
  implication?: string
  responsibleEntity?: string
  relatedArticle?: string
}

export interface TimelineEntry {
  date: string
  description: string
}

export interface VoteBlock {
  question: string
  voteDate: string
  voters: { name: string; group: string; vote: string }[]
  result: string
}

export interface ComplianceFinding {
  code: string
  label: string
  compliant: boolean
  riskLevel: 'low' | 'medium' | 'high'
  coverage: number
  detail: string
}

export interface ComplianceAnalysis {
  score: number
  compliantAreas: number
  criticalRisks: number
  missingDocuments: number
  recommendations: number
  riskExposureLevel: string
  findings: ComplianceFinding[]
  breakdown: { label: string; score: number }[]
}

export interface SpeakerStats {
  name: string
  role: string
  wordCount: number
  turnCount: number
  participationPct: number
  sampleText?: string
}

export interface SpeakerAnalysis {
  speakers: SpeakerStats[]
  topics: string[]
  totalWords: number
  totalTurns: number
}

export interface ChartDataPoint {
  name: string
  value: number
  turns?: number
}

export interface ChartData {
  participationData: ChartDataPoint[]
  timelineData: { label: string; utterances: number }[]
  keyMetrics: {
    totalSpeakers: number
    totalTurns: number
    totalWords: number
    avgWordsPerTurn?: number
    durationMinutes: number
    numbersFound?: number[]
  }
  topics: string[]
}

// ─── Full Report Types ─────────────────────────────────────────────────────────

export interface MinutesReport {
  type: 'MINUTES_REPORT'
  meta: ReportMeta
  stats: ReportStats
  attendees: Attendee[]
  execSummary: ExecSummaryCard[]
  discussionSegments: DiscussionSegment[]
  alerts?: AlertItem[]
  timeline?: TimelineEntry[]
  votes?: VoteBlock[]
  compliance: ComplianceAnalysis
  speakerAnalysis: SpeakerAnalysis
}

export interface SpeakerAnalysisReport {
  type: 'SPEAKER_ANALYSIS'
  meta: Partial<ReportMeta>
  speakers: SpeakerStats[]
  topics: string[]
  totalWords: number
  totalTurns: number
}

export interface ReportAnalyzerOutput {
  type: 'REPORT_ANALYZER'
  meta: Partial<ReportMeta>
  compliance: ComplianceAnalysis
}

export interface NumericalDataOutput {
  type: 'NUMERICAL_DATA'
  meta: Partial<ReportMeta>
  chartData: ChartData
}

export type GeneratedOutputContent =
  | MinutesReport
  | SpeakerAnalysisReport
  | ReportAnalyzerOutput
  | NumericalDataOutput
