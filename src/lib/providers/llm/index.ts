/**
 * LLM Provider index — selects implementation based on AI_PROVIDER env var.
 * Default: mock (works offline, no API key needed).
 * 
 * To use OpenAI: set AI_PROVIDER=openai and OPENAI_API_KEY=<your-key>
 * To use Gemini: set AI_PROVIDER=gemini and GEMINI_API_KEY=<your-key>
 * To use DeepSeek: set AI_PROVIDER=deepseek and DEEPSEEK_API_KEY=<your-key>
 */
import type { LLMProvider } from '../types'
import { MockLLMProvider } from './mock'

let llmProvider: LLMProvider | null = null

export function getLLMProvider(): LLMProvider {
  if (llmProvider) return llmProvider

  const providerName = process.env.AI_PROVIDER ?? 'mock'

  switch (providerName) {
    case 'openai': {
      const { OpenAILLMProvider } = require('./openai')
      llmProvider = new OpenAILLMProvider()
      break
    }
    case 'gemini': {
      const { GeminiLLMProvider } = require('./gemini')
      llmProvider = new GeminiLLMProvider()
      break
    }
    case 'deepseek': {
      const { DeepSeekLLMProvider } = require('./deepseek')
      llmProvider = new DeepSeekLLMProvider()
      break
    }
    case 'mock':
    default:
      llmProvider = new MockLLMProvider()
      break
  }

  return llmProvider!
}

export type { LLMProvider, LLMSchema } from '../types'
