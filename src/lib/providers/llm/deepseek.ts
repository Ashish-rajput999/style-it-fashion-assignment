/**
 * DeepSeek LLM Provider
 * Production implementation — enabled via AI_PROVIDER=deepseek + DEEPSEEK_API_KEY env var.
 * Uses OpenAI-compatible API.
 */
import type { LLMProvider, LLMSchema } from '../types'

export class DeepSeekLLMProvider implements LLMProvider {
  private apiKey: string
  private model: string

  constructor() {
    const key = process.env.DEEPSEEK_API_KEY
    if (!key) throw new Error('DEEPSEEK_API_KEY is required for DeepSeek LLM provider')
    this.apiKey = key
    this.model = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'
  }

  async generate(prompt: string, context: string, schema: LLMSchema): Promise<unknown> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: `You are a compliance meeting minutes expert. Generate ${schema} output as valid JSON only.` },
          { role: 'user', content: `${prompt}\n\nContext:\n${context}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  }
}
