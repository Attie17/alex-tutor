'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { COURSES, STUCK_WORDS } from '@/lib/courses'
import { C, GLOBAL_CSS } from '@/lib/alex-theme'
import { sendChat, fetchQuiz, fetchHint } from '@/lib/api-client'

const FREE_SESSIONS = 2
import AlexAvatar from '@/components/AlexAvatar'
import Spinner from '@/components/Spinner'
import MessageBubble from '@/components/MessageBubble'
import QuizPanel from '@/components/QuizPanel'
import Sidebar from '@/components/Sidebar'

export default function TutorApp({
  userId,
  initialFirstName,
  initialCourseId,
  initialSessionId,
  initialMode,
  initialMessages,
  initialCompletedByAll,
  purchasedCourses = [],
}) {
  const supabase = createClient()
  const router = useRouter()

  // Name modal state
  const [firstName, setFirstName] = useState(initialFirstName)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Chat / progress state
  const [messages, setMessages] = useState(initialMessages || [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(initialMode)
  const [courseId, setCourseId] = useState(initialCourseId)
  const [currentSession, setCurrentSession] = useState(initialSessionId > 0 ? initialSessionId : 1)
  const [completedSessions, setCompletedSessions] = useState(() => {
    const set = new Set()
    for (const [cid, ids] of Object.entries(initialCompletedByAll || {})) {
      ids.forEach(id => set.add(`${cid}-${id}`))
    }
    return set
  })
  const [levelMeta, setLevelMeta] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hintCount, setHintCount] = useState(0)
  const [quiz, setQuiz] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [stuckDetected, setStuckDetected] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const onboardingStarted = useRef(false)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, quiz])

  // Auto-kick off onboarding once we have a name AND there's no history yet.
  useEffect(() => {
    if (!firstName) return
    if (mode !== 'onboarding') return
    if (messages.length > 0) return
    if (onboardingStarted.current) return
    onboardingStarted.current = true
    startOnboarding()
  }, [firstName, mode, messages.length])

  async function startOnboarding() {
    setLoading(true)
    try {
      const text = await sendChat({
        messages: [{ role: 'user', content: `My name is ${firstName}. Please start my assessment.` }],
        courseId,
        sessionId: 0,
        mode: 'onboarding',
      })
      setMessages([{ role: 'assistant', content: text }])
    } catch (e) {
      if (e.status === 401) { router.push('/auth/login?redirect=/learn'); return }
      console.error(e)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function handleNameSubmit() {
    const trimmed = nameInput.trim()
    if (!trimmed || savingName) return
    setSavingName(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { first_name: trimmed } })
      if (error) { console.error('updateUser error:', error); return }
      setFirstName(trimmed)
      // Force the server component to re-run so it picks up the new first_name from Supabase Auth
      router.refresh()
    } finally {
      setSavingName(false)
    }
  }

  function detectAssessment(text) {
    // Match "🎯 ASSESSMENT: level=X recommended=Y" AND bare "level=X recommended=Y"
    const match = text.match(/(?:🎯\s*ASSESSMENT:\s*)?level=\[?(\w+)\]?\s*recommended=\[?(\w+)\]?/i)
    if (!match) return null
    const labels = { beginner: 'Beginner', work: 'Professional', advanced: 'Advanced User' }
    const colors = { beginner: C.green, work: C.accent2, advanced: C.accent }
    const rec = COURSES[match[2]] ? match[2] : 'beginner'
    return { courseId: rec, label: labels[match[1]] || 'Beginner', color: colors[match[1]] || C.green }
  }

  function detectSessionComplete(text) {
    return /🎉\s*\*{0,2}\s*Session complete/i.test(text)
  }

  async function sendMessage(text) {
    if (!text?.trim() || loading) return
    setInput('')
    setStuckDetected(false)

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    const isStuck = STUCK_WORDS.some(w => text.toLowerCase().includes(w))

    try {
      const apiMessages = newMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      const reply = await sendChat({
        messages: apiMessages,
        courseId,
        sessionId: mode === 'onboarding' ? 0 : currentSession,
        mode,
      })
      const updated = [...newMessages, { role: 'assistant', content: reply }]
      setMessages(updated)

      if (mode === 'onboarding') {
        const assessment = detectAssessment(reply)
        if (assessment) {
          setMode('teaching')
          setCourseId(assessment.courseId)
          setLevelMeta({ label: assessment.label, color: assessment.color })
          setCurrentSession(1)
          setHintCount(0)
          supabase.auth.updateUser({ data: { recommended_course: assessment.courseId } })
            .catch(err => console.error('updateUser (recommended_course) error:', err))
        }
      }

      if (mode === 'teaching' && detectSessionComplete(reply)) {
        console.log('[Session] complete detected, fetching quiz for session', currentSession)
        const key = `${courseId}-${currentSession}`
        setCompletedSessions(prev => new Set([...prev, key]))
        setHintCount(0)
        setQuiz(null)

        supabase.from('user_progress').upsert({
          user_id: userId,
          course_id: courseId,
          session_id: currentSession,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,course_id,session_id' })
          .then(({ error }) => { if (error) console.error('user_progress upsert error:', error) })

        setQuizLoading(true)
        try {
          const questions = await fetchQuiz({ courseId, sessionId: currentSession })
          if (questions && questions.length > 0) setQuiz({ questions, sessionId: currentSession })
        } catch (qe) {
          console.error('Quiz fetch failed:', qe)
        } finally {
          setQuizLoading(false)
        }
      }

      if (isStuck && hintCount < 3 && mode === 'teaching') {
        setStuckDetected(true)
      }
    } catch (e) {
      if (e.status === 401) { router.push('/auth/login?redirect=/learn'); return }
      console.error(e)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function getHintNow() {
    if (hintCount >= 3 || loading) return
    const newCount = hintCount + 1
    setHintCount(newCount)
    setStuckDetected(false)
    setLoading(true)
    try {
      const apiMsgs = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))
      const text = await fetchHint({ courseId, sessionId: currentSession, hintNum: newCount, messages: apiMsgs })
      setMessages(prev => [...prev, { role: 'hint', content: text, hintNum: newCount }])
    } catch (e) {
      if (e.status === 401) { router.push('/auth/login?redirect=/learn'); return }
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleQuizPass() {
    setQuiz(null)
    const course = COURSES[courseId]
    if (currentSession < course.sessions.length) {
      const next = currentSession + 1
      setCurrentSession(next)
      setMessages(prev => [...prev, { role: 'assistant', content: `Great work, ${firstName}! 🎉 Let's move on to Session ${next}: **${course.sessions[next - 1].title}**.\n\nReady when you are — just say "let's go" or ask me anything.` }])
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: `🏆 Incredible work, ${firstName}! You've completed the entire **${course.title}** course!\n\nYou're now ready to use Claude with real confidence. I'm proud of the progress you've made. 🌟` }])
    }
  }

  function handleQuizSkip() {
    setQuiz(null)
    const course = COURSES[courseId]
    if (currentSession < course.sessions.length) setCurrentSession(s => s + 1)
  }

  async function resetCourse() {
    if (!window.confirm('Restart this course? Your progress for it will be cleared.')) return
    const { error } = await supabase.from('user_progress').delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)
    if (error) console.error('user_progress delete error:', error)

    setMessages([])
    setMode('onboarding')
    setCurrentSession(1)
    setCompletedSessions(prev => {
      const next = new Set()
      for (const k of prev) if (!k.startsWith(`${courseId}-`)) next.add(k)
      return next
    })
    setLevelMeta(null)
    setQuiz(null)
    setHintCount(0)
    onboardingStarted.current = false
  }

  async function startFresh() {
    if (!window.confirm('⚠️ Start Fresh?\n\nThis will delete ALL your chat history, progress, and profile name, then sign you out so you experience the full new-user flow.\n\nThis cannot be undone.')) return
    try {
      await supabase.from('chat_messages').delete().eq('user_id', userId)
      await supabase.from('user_progress').delete().eq('user_id', userId)
      // Clear metadata fields — use empty string so Supabase doesn't skip the key on merge
      await supabase.auth.updateUser({ data: { first_name: '', recommended_course: '' } })
    } catch (e) {
      console.error('startFresh error:', e)
    }
    // Sign out so the server re-reads a clean auth session on next load
    await supabase.auth.signOut()
    window.location.href = '/auth/login?redirect=/learn'
  }

  async function handleBuy() {
    if (buyLoading) return
    setBuyLoading(true)
    try {
      const res = await fetch('/api/payfast/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment initiation failed')
      // Build and submit the PayFast form
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.payfastUrl
      Object.entries(data.fields).forEach(([k, v]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = k
        input.value = v
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()
    } catch (e) {
      console.error('Buy error:', e)
      setBuyLoading(false)
    }
  }

  async function selectCourse(newCourseId) {
    if (newCourseId === courseId && mode !== 'onboarding') return
    setCourseId(newCourseId)
    setCurrentSession(1)
    setMode('teaching')
    setQuiz(null)
    setHintCount(0)
    setStuckDetected(false)
    const newCourse = COURSES[newCourseId]
    const firstSession = newCourse.sessions[0]
    const switchMsg = { role: 'user', content: `I'd like to switch to the ${newCourse.title} course and start Session 1: ${firstSession.title}.` }
    const history = [...messages, switchMsg]
    setMessages(history)
    setLoading(true)
    try {
      const apiMsgs = history
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }))
      const reply = await sendChat({
        messages: apiMsgs,
        courseId: newCourseId,
        sessionId: 1,
        mode: 'teaching',
      })
      setMessages([...history, { role: 'assistant', content: reply }])
    } catch (e) {
      if (e.status === 401) { router.push('/auth/login?redirect=/learn'); return }
      console.error(e)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const course = COURSES[courseId]
  const session = course.sessions[currentSession - 1]
  const hasPurchased = purchasedCourses.includes(courseId)
  const isPaywalled = mode === 'teaching' && !hasPurchased && currentSession > FREE_SESSIONS

  if (!firstName) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ position: 'fixed', inset: 0, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
          <div style={{ maxWidth: 420, width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, animation: 'fadeUp .3s ease both' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px', boxShadow: `0 0 30px rgba(245,158,11,0.3)` }}>🤖</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: C.text, textAlign: 'center', margin: '0 0 8px' }}>What should Alex call you?</h2>
            <p style={{ fontSize: 13, color: C.dim, textAlign: 'center', margin: '0 0 22px' }}>Just your first name is fine.</p>
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNameSubmit() }}
              placeholder="Your first name"
              disabled={savingName}
              style={{ width: '100%', background: C.hi, border: `1px solid ${nameInput.trim() ? C.accent : C.border}`, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 15, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}
            />
            <button
              onClick={handleNameSubmit}
              disabled={nameInput.trim().length === 0 || savingName}
              style={{ width: '100%', padding: 12, background: nameInput.trim() && !savingName ? `linear-gradient(135deg, ${C.accent}, ${C.accent2})` : C.hi, color: nameInput.trim() && !savingName ? C.bg : C.dim, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: nameInput.trim() && !savingName ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif" }}
            >
              {savingName ? 'Saving…' : "Let's go"}
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
        {/* Top header */}
        <div style={{ height: 50, background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, zIndex: 10 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, padding: 6, lineHeight: 1 }}>☰</button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 7px ${C.green}` }} />
            <span style={{ fontSize: 13, color: C.muted }}>
              {mode === 'onboarding' ? `Alex is getting to know you, ${firstName}…` : `${course.level} · Session ${currentSession} · ${session?.title}`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {hintCount > 0 && <div style={{ fontSize: 11, color: C.accent, background: `rgba(245,158,11,0.08)`, border: `1px solid rgba(245,158,11,0.2)`, padding: '2px 8px', borderRadius: 20 }}>💡 {hintCount}/3 hints</div>}
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.accent, background: `rgba(245,158,11,0.08)`, border: `1px solid rgba(245,158,11,0.2)`, padding: '3px 10px', borderRadius: 20 }}>Alex · Haiku</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Sidebar
            open={sidebarOpen}
            userName={firstName}
            courseId={courseId}
            currentSession={currentSession}
            completedSessions={completedSessions}
            onboarding={mode === 'onboarding' && !levelMeta}
            onSelectCourse={selectCourse}
            onReset={resetCourse}
            onStartFresh={startFresh}
            levelMeta={levelMeta}
          />

          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Paywall gate */}
            {isPaywalled ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
                <div style={{ maxWidth: 460, width: '100%', textAlign: 'center', animation: 'fadeUp .3s ease both' }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 10px' }}>
                    You've finished your free sessions!
                  </h2>
                  <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: '0 0 8px' }}>
                    You've completed the first {FREE_SESSIONS} free sessions of <strong style={{ color: C.text }}>{course.title}</strong>.
                  </p>
                  <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.7, margin: '0 0 28px' }}>
                    Unlock all {course.sessions.length} sessions to continue your journey with Alex.
                  </p>
                  <div style={{ background: C.surface, border: `1px solid rgba(245,158,11,0.25)`, borderRadius: 16, padding: '24px', marginBottom: 24 }}>
                    <div style={{ fontSize: 13, color: C.dim, marginBottom: 6 }}>Full course access</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: C.accent, marginBottom: 4 }}>
                      R{course.priceZAR}
                    </div>
                    <div style={{ fontSize: 12, color: C.dim }}>{course.sessions.length} sessions · Lifetime access</div>
                  </div>
                  <button
                    onClick={handleBuy}
                    disabled={buyLoading}
                    style={{ width: '100%', padding: '14px 24px', background: buyLoading ? C.border : `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, color: buyLoading ? C.dim : C.bg, border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: buyLoading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', marginBottom: 12 }}
                  >
                    {buyLoading ? 'Redirecting to PayFast…' : `Unlock Full Course →`}
                  </button>
                  <p style={{ fontSize: 11, color: C.dim }}>Secure payment via PayFast · South Africa</p>
                </div>
              </div>
            ) : (
            <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
              <div style={{ maxWidth: 680, margin: '0 auto' }}>
                {messages.map((msg, i) => <MessageBubble key={i} msg={msg} userName={firstName} />)}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
                    <AlexAvatar />
                    <div style={{ background: C.hi, border: `1px solid ${C.border}`, borderRadius: '18px 18px 18px 4px', padding: '14px 18px' }}>
                      <Spinner />
                    </div>
                  </div>
                )}
                {quizLoading && <div style={{ textAlign: 'center', color: C.purple, fontSize: 13, padding: 16, opacity: 0.8 }}>📝 Generating your quiz…</div>}
                {quiz && <QuizPanel quiz={quiz.questions} onPass={handleQuizPass} onSkip={handleQuizSkip} />}
                {stuckDetected && hintCount < 3 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, animation: 'fadeUp .3s ease both' }}>
                    <button onClick={getHintNow} style={{ background: `rgba(245,158,11,0.08)`, border: `1px solid rgba(245,158,11,0.3)`, color: C.accent, padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      💡 Get a hint ({3 - hintCount} remaining)
                    </button>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
              <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: C.hi, border: `1px solid ${C.border}`, borderRadius: 14, padding: '8px 8px 8px 16px' }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                    onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
                    placeholder="Reply to Alex… (Enter to send)"
                    rows={1}
                    disabled={loading}
                    style={{ flex: 1, background: 'none', border: 'none', color: C.text, fontSize: 14, resize: 'none', lineHeight: 1.6, padding: '6px 0', maxHeight: 120, overflowY: 'auto', fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    style={{ width: 36, height: 36, borderRadius: 9, background: input.trim() && !loading ? `linear-gradient(135deg, ${C.accent}, ${C.accent2})` : C.border, border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', color: C.bg, fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
                  >↑</button>
                </div>
                <div style={{ textAlign: 'center', marginTop: 5, fontSize: 11, color: C.dim }}>Shift+Enter for new line · Enter to send</div>
              </div>
            </div>
            </>)} {/* end paywall conditional */}
          </div>
        </div>
      </div>
    </>
  )
}
