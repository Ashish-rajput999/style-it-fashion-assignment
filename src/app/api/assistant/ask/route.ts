import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Simple list of common stopwords to exclude from keyword overlap calculations
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'do', 'does', 'did', 'how', 'what', 'why', 'is', 'are', 'was', 'were',
  'can', 'could', 'i', 'you', 'he', 'she', 'they', 'we', 'my', 'your', 'his', 'her', 'their',
  'to', 'for', 'on', 'in', 'at', 'with', 'about', 'against', 'before', 'after', 'during',
  'of', 'and', 'or', 'but', 'if', 'then', 'else', 'this', 'that', 'these', 'those'
])

function tokenizeAndClean(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
    .split(/\s+/)
    .filter((word) => word.trim().length > 0 && !STOP_WORDS.has(word))
}

export async function POST(req: NextRequest) {
  try {
    const { question } = (await req.json()) as { question: string }

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question is empty' }, { status: 400 })
    }

    // Fetch all seeded knowledge entries from DB
    const entries = await db.voiceKnowledgeEntry.findMany()

    const queryTokens = tokenizeAndClean(question)
    if (queryTokens.length === 0) {
      return NextResponse.json({
        answer: null,
        matchedQuestion: null,
        suggestedResponse: "I don't have an answer for that yet — I'll flag this for the team to follow up."
      })
    }

    let bestMatchEntry = null
    let highestScore = 0

    for (const entry of entries) {
      const entryTokens = tokenizeAndClean(entry.question)
      
      // Calculate token overlap score
      let matchCount = 0
      for (const token of queryTokens) {
        if (entryTokens.includes(token)) {
          matchCount++
        }
      }

      // Add weight for keyword indicators (direct substring match helper)
      const lowerQ = question.toLowerCase()
      const lowerEq = entry.question.toLowerCase()
      
      let extraWeight = 0
      if (lowerQ.includes('submit') || lowerQ.includes('upload') || lowerQ.includes('new meeting')) {
        if (lowerEq.includes('submit') || lowerEq.includes('new meeting')) extraWeight += 2
      }
      if (lowerQ.includes('compliance') || lowerQ.includes('framework') || lowerQ.includes('cse')) {
        if (lowerEq.includes('compliance') || lowerEq.includes('framework')) extraWeight += 2
      }
      if (lowerQ.includes('edit') || lowerQ.includes('change') || lowerQ.includes('correct')) {
        if (lowerEq.includes('edit') || lowerEq.includes('minutes')) extraWeight += 2
      }
      if (lowerQ.includes('sign') || lowerQ.includes('review') || lowerQ.includes('read')) {
        if (lowerEq.includes('review') || lowerEq.includes('sign')) extraWeight += 2
      }
      if (lowerQ.includes('secure') || lowerQ.includes('security') || lowerQ.includes('privacy') || lowerQ.includes('safe')) {
        if (lowerEq.includes('secure') || lowerEq.includes('uploads')) extraWeight += 2
      }

      const score = matchCount + extraWeight
      if (score > highestScore) {
        highestScore = score
        bestMatchEntry = entry
      }
    }

    // Require at least a reasonable score threshold to match, else fallback
    const THRESHOLD = 2
    if (bestMatchEntry && highestScore >= THRESHOLD) {
      return NextResponse.json({
        answer: bestMatchEntry.answer,
        matchedQuestion: bestMatchEntry.question,
      })
    }

    return NextResponse.json({
      answer: null,
      matchedQuestion: null,
      suggestedResponse: "I don't have an answer for that yet — I'll flag this for the team to follow up."
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
