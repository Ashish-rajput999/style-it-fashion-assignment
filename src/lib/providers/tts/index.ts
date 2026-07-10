import type { TTSProvider } from '../types'
import { MockTTSProvider } from './mock'

let ttsProvider: TTSProvider | null = null

export function getTTSProvider(): TTSProvider {
  if (ttsProvider) return ttsProvider

  const providerName = process.env.TTS_PROVIDER ?? 'mock'

  switch (providerName) {
    case 'deepgram': {
      const { DeepgramTTSProvider } = require('./deepgram')
      ttsProvider = new DeepgramTTSProvider()
      break
    }
    case 'mock':
    default:
      ttsProvider = new MockTTSProvider()
      break
  }

  return ttsProvider!
}

export type { TTSProvider } from '../types'
