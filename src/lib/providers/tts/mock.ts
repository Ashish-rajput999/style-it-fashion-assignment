/**
 * Mock TTS Provider
 * Returns a pre-baked audio response (silent buffer for demo purposes).
 * In production, swap to Deepgram TTS for real speech synthesis.
 */
import type { TTSProvider } from '../types'

export class MockTTSProvider implements TTSProvider {
  async synthesize(text: string, lang = 'en'): Promise<ArrayBuffer> {
    // Simulate TTS processing delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Return a minimal valid WAV file (44 bytes, silent)
    const wavHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x00, 0x00, 0x00, // chunk size
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6d, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // subchunk size
      0x01, 0x00,             // PCM format
      0x01, 0x00,             // mono
      0x44, 0xac, 0x00, 0x00, // 44100 Hz
      0x88, 0x58, 0x01, 0x00, // byte rate
      0x02, 0x00,             // block align
      0x10, 0x00,             // bits per sample (16)
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x00, 0x00, 0x00, // data size (0 — silent)
    ])

    console.log(`[MockTTS] Synthesizing text (${text.length} chars, lang: ${lang})`)
    return wavHeader.buffer
  }
}
