'use client'
import { useState } from 'react'
import { C } from '@/lib/alex-theme'

export default function QuizPanel({ quiz, onPass, onSkip }) {
  const [selected, setSelected] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  if (!quiz?.length) return null

  const handleSubmit = () => {
    let c = 0
    quiz.forEach((q, qi) => { if (q.options[selected[qi]]?.correct) c++ })
    setScore(c); setSubmitted(true)
    if (c >= 1) setTimeout(() => onPass(), 1800)
  }
  const allAnswered = Object.keys(selected).length === quiz.length
  const passed = submitted && score >= 1
  const failed = submitted && score === 0

  return (
    <div style={{ margin: "16px 0", padding: 20, background: `rgba(139,92,246,0.06)`, border: `1px solid rgba(139,92,246,0.3)`, borderRadius: 16, animation: "fadeUp .3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>📝</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.06em", textTransform: "uppercase" }}>Quick Check</div>
          <div style={{ fontSize: 12, color: C.dim }}>Answer to unlock the next session</div>
        </div>
        {submitted && <div style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: passed ? C.green : C.red }}>{passed ? `✅ ${score}/2 — Great!` : `❌ ${score}/2`}</div>}
      </div>
      {quiz.map((q, qi) => (
        <div key={qi} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8, lineHeight: 1.5 }}>{qi + 1}. {q.question}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {q.options.map((opt, oi) => {
              const isSel = selected[qi] === oi
              const isCorr = submitted && opt.correct
              const isWrong = submitted && isSel && !opt.correct
              return (
                <button key={oi} onClick={() => !submitted && setSelected(s => ({ ...s, [qi]: oi }))}
                  style={{ background: isCorr ? "rgba(16,185,129,0.15)" : isWrong ? "rgba(239,68,68,0.1)" : isSel ? "rgba(139,92,246,0.15)" : C.hi, border: `1px solid ${isCorr ? C.green : isWrong ? C.red : isSel ? C.purple : C.border}`, borderRadius: 10, padding: "10px 12px", cursor: submitted ? "default" : "pointer", textAlign: "left", color: isCorr ? "#6ee7b7" : isWrong ? "#fca5a5" : isSel ? "#c4b5fd" : C.muted, fontSize: 13, lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {!submitted ? (
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={handleSubmit} disabled={!allAnswered}
            style={{ background: allAnswered ? `linear-gradient(135deg, ${C.purple}, #6366f1)` : C.border, color: allAnswered ? "#fff" : C.dim, border: "none", padding: "10px 24px", borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: allAnswered ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
            Submit Answers
          </button>
          <button onClick={onSkip} style={{ background: "none", color: C.dim, border: `1px solid ${C.border}`, padding: "10px 20px", borderRadius: 50, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Skip Quiz</button>
        </div>
      ) : failed ? (
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={() => { setSelected({}); setSubmitted(false); }}
            style={{ background: `linear-gradient(135deg, ${C.red}, ${C.accent2})`, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Try Again
          </button>
          <button onClick={onSkip} style={{ background: "none", color: C.dim, border: `1px solid ${C.border}`, padding: "10px 20px", borderRadius: 50, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Continue Anyway</button>
        </div>
      ) : <div style={{ color: C.green, fontSize: 13, marginTop: 8 }}>Unlocking next session…</div>}
    </div>
  )
}
