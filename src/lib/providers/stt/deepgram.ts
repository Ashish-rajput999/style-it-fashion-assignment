/**
 * Deepgram STT Provider
 * Real implementation — enabled via STT_PROVIDER=deepgram + DEEPGRAM_API_KEY env var.
 */
import type { STTProvider, STTResult } from '../types'

export class DeepgramSTTProvider implements STTProvider {
  private apiKey: string

  constructor() {
    const key = process.env.DEEPGRAM_API_KEY
    if (!key) throw new Error('DEEPGRAM_API_KEY is required for Deepgram STT provider')
    this.apiKey = key
  }

  async transcribe(fileUrl: string, language = 'fr'): Promise<STTResult> {
    // Deepgram Transcription API call
    const response = await fetch('https://api.deepgram.com/v1/listen?' + new URLSearchParams({
      model: 'nova-2',
      language,
      diarize: 'true',
      punctuate: 'true',
      utterances: 'true',
    }), {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: fileUrl }),
    })

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const utterances = data.results?.utterances ?? []

    return {
      segments: utterances.map((u: { speaker: number; start: number; end: number; transcript: string }) => ({
        speaker: `Speaker ${u.speaker}`,
        start: u.start,
        end: u.end,
        text: u.transcript,
      })),
      duration: data.metadata?.duration,
      language: data.metadata?.language,
    }
  }
}
