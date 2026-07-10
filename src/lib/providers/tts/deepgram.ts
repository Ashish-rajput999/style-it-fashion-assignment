/**
 * Deepgram TTS Provider
 * Production implementation — enabled via TTS_PROVIDER=deepgram + DEEPGRAM_API_KEY env var.
 */
import type { TTSProvider } from '../types'

export class DeepgramTTSProvider implements TTSProvider {
  private apiKey: string

  constructor() {
    const key = process.env.DEEPGRAM_API_KEY
    if (!key) throw new Error('DEEPGRAM_API_KEY is required for Deepgram TTS provider')
    this.apiKey = key
  }

  async synthesize(text: string, lang = 'en'): Promise<ArrayBuffer> {
    const response = await fetch('https://api.deepgram.com/v1/speak?' + new URLSearchParams({
      model: lang === 'fr' ? 'aura-asteria-fr' : 'aura-asteria-en',
    }), {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`Deepgram TTS API error: ${response.status} ${response.statusText}`)
    }

    return await response.arrayBuffer()
  }
}
