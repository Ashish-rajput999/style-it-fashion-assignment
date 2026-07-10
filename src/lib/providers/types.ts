/**
 * STT Provider Interface
 * Swap implementations via STT_PROVIDER env var.
 * All providers implement this interface so no other code needs to change.
 */
export interface TranscriptSegment {
  speaker: string
  start: number
  end: number
  text: string
}

export interface STTResult {
  segments: TranscriptSegment[]
  duration?: number
  language?: string
}

export interface STTProvider {
  transcribe(fileUrl: string, language?: string): Promise<STTResult>
}

/**
 * LLM Provider Interface
 */
export type LLMSchema = 'report' | 'analyzer' | 'speakers' | 'chart-data'

export interface LLMProvider {
  generate(prompt: string, context: string, schema: LLMSchema): Promise<unknown>
}

/**
 * TTS Provider Interface
 */
export interface TTSProvider {
  synthesize(text: string, lang?: string): Promise<ArrayBuffer>
}
