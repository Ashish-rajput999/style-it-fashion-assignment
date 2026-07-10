/**
 * Gemini LLM Provider
 * Production implementation — enabled via AI_PROVIDER=gemini + GEMINI_API_KEY env var.
 */
import type { LLMProvider, LLMSchema } from '../types'

export class GeminiLLMProvider implements LLMProvider {
  private apiKey: string
  private model: string

  constructor() {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY is required for Gemini LLM provider')
    this.apiKey = key
    this.model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'
  }

  async generate(prompt: string, context: string, schema: LLMSchema): Promise<unknown> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are a compliance meeting minutes expert. Schema: ${schema}\n${prompt}\n\nContext:\n${context}\n\nRespond with valid JSON only.` }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No content in Gemini response')
    return JSON.parse(text)
  }
}
