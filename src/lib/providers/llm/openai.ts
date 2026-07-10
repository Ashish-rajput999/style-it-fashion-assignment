/**
 * OpenAI LLM Provider
 * Production implementation — enabled via AI_PROVIDER=openai + OPENAI_API_KEY env var.
 */
import type { LLMProvider, LLMSchema } from '../types'

const SCHEMA_INSTRUCTIONS: Record<LLMSchema, string> = {
  'speakers': 'Analyze the speakers in this transcript. Return JSON with: speakers (array of {name, role, wordCount, turnCount, participationPct, sampleText}), topics (string[]), totalWords, totalTurns.',
  'chart-data': 'Generate chart data from this transcript. Return JSON with: participationData ({name, value, turns}[]), timelineData ({label, utterances}[]), keyMetrics ({totalSpeakers, totalTurns, totalWords, durationMinutes}).',
  'analyzer': 'Perform a French Labor Code compliance analysis on this CSE meeting transcript. Return JSON with: score (0-100), compliantAreas (number), criticalRisks (number), missingDocuments (number), recommendations (number), findings (array of {code, label, compliant, riskLevel, detail}), breakdown (array of {label, score}), riskExposureLevel.',
  'report': 'Generate structured meeting minutes in the format of a formal CSE report. Return JSON conforming to the MeetingMind report schema with: meta, stats, attendees, execSummary, discussionSegments, compliance, speakerAnalysis fields.',
}

export class OpenAILLMProvider implements LLMProvider {
  private apiKey: string
  private model: string

  constructor() {
    const key = process.env.OPENAI_API_KEY
    if (!key) throw new Error('OPENAI_API_KEY is required for OpenAI LLM provider')
    this.apiKey = key
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  }

  async generate(prompt: string, context: string, schema: LLMSchema): Promise<unknown> {
    const systemInstruction = SCHEMA_INSTRUCTIONS[schema]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: `You are an expert meeting minutes analyst for compliance reports. ${systemInstruction} Always respond with valid JSON only.` },
          { role: 'user', content: `${prompt}\n\nTranscript/Context:\n${context}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  }
}
