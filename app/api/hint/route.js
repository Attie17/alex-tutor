import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase-server'
import { COURSES } from '@/lib/courses'
import { checkRateLimit } from '@/lib/rate-limit'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MAX_TOKENS = 300
const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rate = checkRateLimit(`hint:${user.id}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
    if (!rate.ok) {
      const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))
      return Response.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }

    const { courseId, sessionId, hintNum, messages } = await request.json()

    if (!courseId || !COURSES[courseId]) {
      return Response.json({ error: 'Missing or invalid courseId' }, { status: 400 })
    }
    if (!Number.isInteger(sessionId) || sessionId < 1) {
      return Response.json({ error: 'Missing or invalid sessionId' }, { status: 400 })
    }
    if (!Number.isInteger(hintNum) || hintNum < 1 || hintNum > 3) {
      return Response.json({ error: 'hintNum must be 1, 2, or 3' }, { status: 400 })
    }
    if (!Array.isArray(messages)) {
      return Response.json({ error: 'Missing or invalid messages' }, { status: 400 })
    }
    const course = COURSES[courseId]
    const session = course.sessions[sessionId - 1]
    if (!session) {
      return Response.json({ error: 'sessionId out of range for course' }, { status: 400 })
    }

    const tail = messages.slice(-4)
      .map(m => `${m.role}: ${(m.content || '').toString().slice(0, 200)}`)
      .join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: MAX_TOKENS,
      messages: [{
        role: 'user',
        content: `Student stuck on "${session.title}". Give hint ${hintNum}/3 only — 2–3 encouraging sentences, specific to their situation, no full answer.\n\nRecent context:\n${tail}`
      }],
    })

    const text = response.content.find(b => b.type === 'text')?.text || ''

    return Response.json({ text })
  } catch (error) {
    console.error('Hint API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
