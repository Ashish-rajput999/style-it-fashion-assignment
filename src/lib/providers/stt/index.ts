/**
 * STT Provider index — selects implementation based on STT_PROVIDER env var.
 * Default: mock (works offline, no API key needed).
 * 
 * To use Deepgram: set STT_PROVIDER=deepgram and DEEPGRAM_API_KEY=<your-key>
 */
import type { STTProvider } from '../types'
import { MockSTTProvider } from './mock'

let sttProvider: STTProvider | null = null

export function getSTTProvider(): STTProvider {
  if (sttProvider) return sttProvider

  const providerName = process.env.STT_PROVIDER ?? 'mock'

  switch (providerName) {
    case 'deepgram': {
      // Lazy import to avoid loading Deepgram code unless actually needed
      const { DeepgramSTTProvider } = require('./deepgram')
      sttProvider = new DeepgramSTTProvider()
      break
    }
    case 'mock':
    default:
      sttProvider = new MockSTTProvider()
      break
  }

  return sttProvider!
}

export type { STTProvider, STTResult, TranscriptSegment } from '../types'
