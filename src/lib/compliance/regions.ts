/**
 * Compliance region and type configuration.
 * This is the single source of truth used by:
 * - Region-picker cards in the wizard
 * - Compliance-type cards in the wizard
 * - Mock LLM compliance analysis
 * - Admin report analyzer dashboard
 */

export interface ComplianceCheckItem {
  code: string
  article: string
  label: string
  description: string
  keywords: string[]
}

export interface ComplianceType {
  code: string
  name: string
  nameShort: string
  description: string
  active: boolean
  checklist: ComplianceCheckItem[]
}

export interface Region {
  code: string
  name: string
  flag: string
  active: boolean
  complianceTypes: ComplianceType[]
}

export const REGIONS: Region[] = [
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    active: true,
    complianceTypes: [
      {
        code: 'CSE',
        name: 'Comité Social et Économique',
        nameShort: 'CSE',
        description: 'Works council compliance for companies with 11+ employees. Covers information, consultation, and health & safety obligations.',
        active: true,
        checklist: [
          {
            code: 'L.2312-8',
            article: 'Art. L.2312-8',
            label: 'Information and Consultation',
            description: 'CSE must be informed and consulted prior to major organizational decisions.',
            keywords: ['consultation', 'consulter', 'informé', 'information', 'préalable', 'avis'],
          },
          {
            code: 'L.2315-34',
            article: 'Art. L.2315-34',
            label: 'Minutes and Voting',
            description: 'Official minutes must record all votes and resolutions with full details.',
            keywords: ['vote', 'voter', 'résolution', 'procès-verbal', 'adopté', 'rejeté', 'délibération'],
          },
          {
            code: 'L.2315-3',
            article: 'Art. L.2315-3',
            label: 'Elected Representatives Present',
            description: 'Meeting must have required quorum of elected representatives.',
            keywords: ['élu', 'représentant', 'secrétaire', 'trésorier', 'présent', 'quorum'],
          },
          {
            code: 'L.2323-7',
            article: 'Art. L.2323-7',
            label: 'Agenda Communicated',
            description: 'Order of business must be formally communicated in advance.',
            keywords: ['ordre du jour', 'ordre', 'point', 'agenda', 'convocation'],
          },
          {
            code: 'L.3121-27',
            article: 'Art. L.3121-27',
            label: 'Working Time and Hours',
            description: 'Compliance with working time regulations and record keeping.',
            keywords: ['durée', 'horaire', 'temps', 'heure', 'travail', 'congé'],
          },
          {
            code: 'R.4141-3',
            article: 'Art. R.4141-3',
            label: 'Health and Safety',
            description: 'CSSCT/HSE obligations and incident reporting.',
            keywords: ['sécurité', 'risque', 'santé', 'accident', 'prévention', 'danger'],
          },
          {
            code: 'L.2312-36',
            article: 'Art. L.2312-36',
            label: 'Economic and Financial Information',
            description: 'Regular sharing of economic data with the committee.',
            keywords: ['économique', 'financier', 'budget', 'résultat', 'chiffre affaires'],
          },
        ],
      },
      {
        code: 'AG',
        name: 'Accountability and Governance',
        nameShort: 'AG',
        description: 'General assembly governance standards — coming soon.',
        active: false,
        checklist: [],
      },
      {
        code: 'CSSCT',
        name: 'Commission Santé Sécurité et Conditions de Travail',
        nameShort: 'CSSCT',
        description: 'Health, safety and working conditions committee — coming soon.',
        active: false,
        checklist: [],
      },
      {
        code: 'CSEE',
        name: 'Comité Social et Économique d\'Établissement',
        nameShort: 'CSEE',
        description: 'Establishment-level works council — coming soon.',
        active: false,
        checklist: [],
      },
      {
        code: 'QVCT',
        name: 'Qualité de Vie et Conditions de Travail',
        nameShort: 'QVCT',
        description: 'Quality of work-life assessment — coming soon.',
        active: false,
        checklist: [],
      },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    active: false,
    complianceTypes: [],
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    active: false,
    complianceTypes: [],
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    active: false,
    complianceTypes: [],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    active: false,
    complianceTypes: [],
  },
  {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    active: false,
    complianceTypes: [],
  },
]

export function getRegion(code: string): Region | undefined {
  return REGIONS.find((r) => r.code === code)
}

export function getComplianceType(regionCode: string, typeCode: string): ComplianceType | undefined {
  return getRegion(regionCode)?.complianceTypes.find((t) => t.code === typeCode)
}

export function getActiveRegions(): Region[] {
  return REGIONS.filter((r) => r.active)
}

export function getActiveComplianceTypes(regionCode: string): ComplianceType[] {
  return getRegion(regionCode)?.complianceTypes.filter((t) => t.active) ?? []
}
