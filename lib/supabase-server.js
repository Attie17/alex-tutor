import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function saveMessage(userId, courseId, sessionId, role, content) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      course_id: courseId,
      session_id: sessionId,
      role,
      content,
    })
  if (error) throw error
}

export async function getMessages(userId, courseId, sessionId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) throw error
  return (data || []).reverse()
}

export async function markSessionComplete(userId, courseId, sessionId) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        session_id: sessionId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id,session_id' },
    )
  if (error) throw error
}

export async function getCompletedSessions(userId, courseId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_progress')
    .select('session_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('completed', true)
  if (error) throw error
  return (data || []).map(r => r.session_id)
}

export async function getUserPurchases(userId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_purchases')
    .select('course_id')
    .eq('user_id', userId)
  if (error) throw error
  return (data || []).map(r => r.course_id)
}
