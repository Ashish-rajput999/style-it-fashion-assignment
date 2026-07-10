/**
 * Tier configuration — single source of truth for:
 * - Pricing comparison table on the client wizard
 * - Admin's available-output-types list
 * - Feature gating logic
 */

export type Tier = 'ESSENTIAL' | 'SCOPE' | 'PREMIUM'
export type OutputType = 'SPEAKER_ANALYSIS' | 'REPORT_ANALYZER' | 'NUMERICAL_DATA' | 'MINUTES_REPORT' | 'PPT_EXPORT'

export interface TierFeature {
  category: string
  feature: string
  essential: string | boolean
  scope: string | boolean
  premium: string | boolean
}

export interface TierConfig {
  id: Tier
  name: string
  tagline: string
  color: string
  icon: string
  priceLabel: string
  outputs: OutputType[]
  features: string[]
}

export const TIER_FEATURES: TierFeature[] = [
  {
    category: 'Transcription',
    feature: 'Transcription type',
    essential: 'Single channel',
    scope: '+ Speaker diarization',
    premium: '+ Multi-language',
  },
  {
    category: 'Formatting',
    feature: 'Report format',
    essential: 'Chronological summary',
    scope: 'Agenda-based',
    premium: 'Agenda-based + formal legal layout',
  },
  {
    category: 'Compliance',
    feature: 'Compliance check',
    essential: 'Basic keyword check',
    scope: 'Full compliance audit',
    premium: 'Full audit + clause-by-clause notes',
  },
  {
    category: 'Editing',
    feature: 'Editing options',
    essential: 'Speaker names only',
    scope: 'Full text + speaker editing',
    premium: 'Full + human reviewer pass',
  },
  {
    category: 'Voting',
    feature: 'Voting log',
    essential: false,
    scope: 'Auto-detect & tabulate',
    premium: 'Auto-detect + signature-ready',
  },
  {
    category: 'Outputs',
    feature: 'Export formats',
    essential: 'PDF',
    scope: 'PDF + DOCX',
    premium: 'PDF + DOCX + Letterhead',
  },
  {
    category: 'Sign-off',
    feature: 'Digital signature',
    essential: false,
    scope: 'Digital sign-off block',
    premium: '+ Audit trail & certificate',
  },
]

export const TIERS: TierConfig[] = [
  {
    id: 'ESSENTIAL',
    name: 'Essential',
    tagline: 'For small teams needing basic compliance documentation.',
    color: '#6D5DF6',
    icon: '⭐',
    priceLabel: 'Contact for pricing',
    outputs: ['SPEAKER_ANALYSIS', 'MINUTES_REPORT'],
    features: [
      'Single-channel transcription',
      'Chronological meeting summary',
      'Basic compliance keyword check',
      'Speaker name editing',
      'PDF export',
    ],
  },
  {
    id: 'SCOPE',
    name: 'Scope',
    tagline: 'For HR and works councils needing full audit trails.',
    color: '#2F69FF',
    icon: '💎',
    priceLabel: 'Contact for pricing',
    outputs: ['SPEAKER_ANALYSIS', 'REPORT_ANALYZER', 'NUMERICAL_DATA', 'MINUTES_REPORT'],
    features: [
      'Speaker diarization',
      'Agenda-based formal report',
      'Full compliance audit',
      'Full text & speaker editing',
      'Voting log auto-tabulation',
      'PDF + DOCX export',
      'Digital sign-off block',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    tagline: 'For enterprise compliance officers and legal teams.',
    color: '#F6BF2F',
    icon: '👑',
    priceLabel: 'Contact for pricing',
    outputs: ['SPEAKER_ANALYSIS', 'REPORT_ANALYZER', 'NUMERICAL_DATA', 'MINUTES_REPORT', 'PPT_EXPORT'],
    features: [
      'Multi-language transcription',
      'Formal legal layout with letterhead',
      'Clause-by-clause compliance notes',
      'Human reviewer pass (flagging)',
      'Signature-ready voting logs',
      'PDF + DOCX + Letterhead export',
      'Audit trail & certificate',
    ],
  },
]

export function getTierConfig(tier: Tier): TierConfig {
  return TIERS.find((t) => t.id === tier) ?? TIERS[0]
}

export function getTierOutputs(tier: Tier): OutputType[] {
  return getTierConfig(tier).outputs
}

export function isOutputAvailableForTier(output: OutputType, tier: Tier): boolean {
  return getTierOutputs(tier).includes(output)
}
