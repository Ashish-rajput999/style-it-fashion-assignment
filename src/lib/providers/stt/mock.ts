/**
 * Mock STT Provider
 * Returns a realistic pre-baked transcript for demo purposes.
 * When given different files, it uses a filename-based hash to vary the output slightly
 * so different uploads produce visibly different results.
 * 
 * Production swap: Set STT_PROVIDER=deepgram and supply DEEPGRAM_API_KEY.
 */
import type { STTProvider, STTResult, TranscriptSegment } from '../types'

// Canned demo transcripts — one per "meeting type" variant
const DEMO_TRANSCRIPTS: TranscriptSegment[][] = [
  // Transcript A — CSE Ordinary Meeting
  [
    { speaker: 'Président', start: 0, end: 32, text: 'Je déclare la séance ouverte. Bienvenue à tous les membres du CSE. Nous avons un ordre du jour chargé aujourd\'hui. Commençons par l\'approbation du procès-verbal de la dernière réunion.' },
    { speaker: 'Secrétaire', start: 33, end: 58, text: 'Le procès-verbal de la réunion du 15 mai a été distribué par voie électronique. Je n\'ai reçu aucune observation. Nous pouvons donc le valider.' },
    { speaker: 'Élu Employés', start: 59, end: 95, text: 'Je souhaite apporter une modification mineure concernant le point sur les conditions de travail. La rédaction actuelle ne reflète pas fidèlement notre position. Nous avons demandé une consultation préalable, pas seulement une information.' },
    { speaker: 'Président', start: 96, end: 130, text: 'Je prends note. Nous rectifierons ce point. Le procès-verbal modifié sera validé lors de la prochaine réunion. Passons maintenant au point principal : le projet de réorganisation du service logistique.' },
    { speaker: 'DRH', start: 131, end: 185, text: 'La direction souhaite présenter un projet de réorganisation qui concerne environ 45 collaborateurs du service logistique. Cette réorganisation vise à optimiser les flux de travail et à s\'adapter aux nouvelles exigences du marché fashion. Trois postes seraient supprimés, avec accompagnement renforcé via le plan de sauvegarde.' },
    { speaker: 'Élu Employés', start: 186, end: 240, text: 'Cette annonce est préoccupante. Nous n\'avons pas été informés en temps utile. L\'article L.2312-8 du Code du travail impose une consultation préalable du CSE. Nous demandons le report de ce point et la remise d\'un dossier complet incluant l\'étude d\'impact social.' },
    { speaker: 'Élu CGT', start: 241, end: 280, text: 'Je soutiens la demande de report. De plus, je signale que trois des postes visés concernent des salariées protégées. Nous exigeons l\'avis de l\'inspecteur du travail avant toute décision.' },
    { speaker: 'Président', start: 281, end: 320, text: 'Nous entendons ces remarques. La direction s\'engage à fournir le dossier complet dans les 8 jours. Le point sera réinscrit à l\'ordre du jour de la réunion extraordinaire du 15 juillet. Passons aux questions diverses.' },
    { speaker: 'Élu Employés', start: 321, end: 360, text: 'Concernant les œuvres sociales, le budget activités est-il bien prévu à 0,8 % de la masse salariale cette année ? Nous n\'avons pas reçu la confirmation de la direction.' },
    { speaker: 'DRH', start: 361, end: 395, text: 'Le budget sera confirmé par écrit avant le 30 juin. Le montant prévu est bien de 0,8 % conformément à l\'accord collectif en vigueur.' },
    { speaker: 'Président', start: 396, end: 420, text: 'La séance est levée. Je remercie tous les participants. Le prochain CSE ordinaire est fixé au 12 août à 14h00.' },
  ],
  // Transcript B — AG / General Assembly variant
  [
    { speaker: 'Directeur Général', start: 0, end: 45, text: 'Bonjour à tous. Cette assemblée générale extraordinaire a été convoquée pour délibérer sur la nouvelle politique de télétravail et les conditions de mise en œuvre du plan stratégique 2025-2027 de Styleit Fashion.' },
    { speaker: 'Représentant Syndical', start: 46, end: 90, text: 'Nous avons pris connaissance du document. Plusieurs points nécessitent des clarifications, notamment les critères d\'éligibilité au télétravail pour les équipes de production qui ne peuvent pas télétravailler par nature de leurs fonctions.' },
    { speaker: 'Directeur Général', start: 91, end: 135, text: 'Excellente remarque. Les équipes de production seront compensées par d\'autres mesures : flexibilité horaire, prime de présence, et accès prioritaire aux formations. Nous ouvrons maintenant le vote sur la résolution concernant le plan stratégique.' },
    { speaker: 'Secrétaire de Séance', start: 136, end: 160, text: 'Résolution n°1 : Approbation du plan stratégique 2025-2027. Résultat du vote : 14 voix pour, 3 contre, 2 abstentions. La résolution est adoptée.' },
    { speaker: 'Représentant Syndical', start: 161, end: 200, text: 'Nous demandons l\'inscription au procès-verbal de notre réserve sur l\'absence d\'engagement chiffré concernant les recrutements. Le document mentionne des créations de postes sans calendrier précis.' },
    { speaker: 'Directeur Général', start: 201, end: 240, text: 'La réserve est actée. Nous nous engageons à fournir un calendrier détaillé des recrutements prévus d\'ici le 15 septembre. Résolution n°2 : Budget formation 2025. Le vote est ouvert.' },
    { speaker: 'Secrétaire de Séance', start: 241, end: 265, text: 'Résultat du vote sur le budget formation : 17 voix pour, 2 abstentions. Résolution adoptée à l\'unanimité moins 2 abstentions.' },
    { speaker: 'Directeur Général', start: 266, end: 295, text: 'L\'ordre du jour étant épuisé, je déclare la séance levée. Le procès-verbal sera diffusé sous 15 jours ouvrables. Je remercie tous les participants pour leur engagement constructif.' },
  ],
]

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // convert to 32bit int
  }
  return Math.abs(hash)
}

export class MockSTTProvider implements STTProvider {
  async transcribe(fileUrl: string, language = 'fr'): Promise<STTResult> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Pick transcript variant based on filename + time-based salt so repeated
    // uploads (even same filename) can produce different demo data
    const salt = fileUrl + '-' + Math.floor(Date.now() / 30000) // rotates every 30s
    const hash = simpleHash(salt)
    const transcriptIndex = hash % DEMO_TRANSCRIPTS.length
    const segments = DEMO_TRANSCRIPTS[transcriptIndex]

    // Calculate total duration from last segment
    const lastSegment = segments[segments.length - 1]
    const duration = lastSegment.end + 5

    return {
      segments,
      duration,
      language,
    }
  }
}
