import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase-server'
import { COURSES } from '@/lib/courses'
import { checkRateLimit } from '@/lib/rate-limit'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MAX_TOKENS = 600
const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rate = checkRateLimit(`quiz:${user.id}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
    if (!rate.ok) {
      const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))
      return Response.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }

    const { courseId, sessionId } = await request.json()

    if (!courseId || !COURSES[courseId]) {
      return Response.json({ error: 'Missing or invalid courseId' }, { status: 400 })
    }
    if (!Number.isInteger(sessionId) || sessionId < 1) {
      return Response.json({ error: 'Missing or invalid sessionId' }, { status: 400 })
    }
    const course = COURSES[courseId]
    const session = course.sessions[sessionId - 1]
    if (!session) {
      return Response.json({ error: 'sessionId out of range for course' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: MAX_TOKENS,
      messages: [{
        role: 'user',
        content: `Generate exactly 2 multiple-choice questions testing key concepts from "${session.title}" for a ${course.level.toLowerCase()} learner. Respond ONLY with raw JSON array, no markdown:\n[{"question":"...","options":[{"label":"...","correct":true},{"label":"...","correct":false},{"label":"...","correct":false},{"label":"...","correct":false}]},...]`
      }],
    })

    const text = response.content.find(b => b.type === 'text')?.text || ''
    console.log('[Quiz API] raw response:', text.slice(0, 300))

    let questions = null
    try {
      // Find first '[' and last ']' — most robust extraction regardless of fences
      const start = text.indexOf('[')
      const end = text.lastIndexOf(']')
      if (start !== -1 && end > start) {
        questions = JSON.parse(text.slice(start, end + 1))
      }
    } catch (e) {
      console.error('[Quiz API] JSON parse failed:', e.message)
      questions = null
    }

    console.log('[Quiz API] parsed questions count:', questions?.length ?? 'null')
    return Response.json({ questions })
  } catch (error) {
    console.error('Quiz API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
