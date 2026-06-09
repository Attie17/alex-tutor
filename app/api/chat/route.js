import Anthropic from '@anthropic-ai/sdk'
import { createClient, saveMessage } from '@/lib/supabase-server'
import { buildOnboardingPrompt, buildTeachingPrompt } from '@/lib/prompts'
import { COURSES } from '@/lib/courses'
import { checkRateLimit } from '@/lib/rate-limit'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MAX_TOKENS = 1000
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

function resolveName(user) {
  const fromMeta = user?.user_metadata?.first_name
  if (typeof fromMeta === 'string' && fromMeta.trim()) {
    return fromMeta.trim().slice(0, 50).replace(/[\r\n]/g, ' ')
  }
  const emailPrefix = user?.email?.split('@')[0]
  if (emailPrefix) return emailPrefix.slice(0, 50)
  return 'there'
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rate = checkRateLimit(`chat:${user.id}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
    if (!rate.ok) {
      const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))
      return Response.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }

    const { messages, courseId, sessionId, mode } = await request.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Missing or invalid messages' }, { status: 400 })
    }
    if (!courseId || !COURSES[courseId]) {
      return Response.json({ error: 'Missing or invalid courseId' }, { status: 400 })
    }
    if (!Number.isInteger(sessionId) || sessionId < 0) {
      return Response.json({ error: 'Missing or invalid sessionId' }, { status: 400 })
    }
    if (mode !== 'onboarding' && mode !== 'teaching') {
      return Response.json({ error: 'Missing or invalid mode' }, { status: 400 })
    }

    const name = resolveName(user)
    const course = COURSES[courseId]

    let system
    if (mode === 'onboarding') {
      system = buildOnboardingPrompt(name)
    } else {
      const session = course.sessions[sessionId - 1]
      if (!session) {
        return Response.json({ error: 'sessionId out of range for course' }, { status: 400 })
      }
      system = buildTeachingPrompt(name, courseId, session)
    }

    // Best-effort persistence of the new user message.
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'user' && typeof lastMsg.content === 'string') {
      try {
        await saveMessage(user.id, courseId, sessionId, 'user', lastMsg.content)
      } catch (e) {
        console.error('Failed to persist user message:', e)
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: MAX_TOKENS,
      system,
      messages,
    })

    const text = response.content.find(b => b.type === 'text')?.text || ''

    if (text) {
      try {
        await saveMessage(user.id, courseId, sessionId, 'assistant', text)
      } catch (e) {
        console.error('Failed to persist assistant reply:', e)
      }
    }

    return Response.json({ text })
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
