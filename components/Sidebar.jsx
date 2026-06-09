'use client'
import AlexAvatar from './AlexAvatar'
import { COURSES, TAG_COLORS } from '@/lib/courses'
import { C } from '@/lib/alex-theme'

export default function Sidebar({ open, userName, courseId, currentSession, completedSessions, onboarding, onSelectCourse, onReset, onStartFresh, levelMeta }) {
  const course = COURSES[courseId]
  const courses = Object.values(COURSES)

  return (
    <div style={{ width: open ? 260 : 0, minWidth: open ? 260 : 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden", transition: "all 0.25s ease", flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <AlexAvatar size={32} />
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: C.text }}>Alex</div>
            <div style={{ fontSize: 11, color: C.dim }}>Maranata Ventures</div>
          </div>
        </div>

        {/* User pill */}
        <div style={{ background: C.hi, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>👤</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{userName}</div>
            {levelMeta && <div style={{ fontSize: 11, color: levelMeta.color || C.muted }}>{levelMeta.label}</div>}
          </div>
        </div>
      </div>

      {/* Course tabs */}
      <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6, flexShrink: 0 }}>
        {courses.map(c => (
          <button key={c.id} onClick={() => onSelectCourse(c.id)}
            style={{ flex: 1, padding: "5px 4px", borderRadius: 8, border: `1px solid ${courseId === c.id ? c.color : C.border}`, background: courseId === c.id ? `${c.color}18` : "transparent", color: courseId === c.id ? c.color : C.dim, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.04em", transition: "all 0.15s" }}>
            {c.id === "work" ? "Work" : c.level.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {(onboarding && completedSessions.size === 0) ? (
          <div style={{ padding: "20px 10px", color: C.dim, fontSize: 12, textAlign: "center", lineHeight: 1.7 }}>
            Alex is getting to know you.<br />Your personalised path will appear here once your assessment is complete.
          </div>
        ) : course.sessions.map(s => {
          const done = completedSessions.has(`${courseId}-${s.id}`)
          const active = !done && s.id === currentSession
          const locked = !done && !active && s.id > currentSession
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, marginBottom: 2, background: active ? `rgba(245,158,11,0.07)` : "transparent", border: active ? `1px solid rgba(245,158,11,0.2)` : "1px solid transparent", opacity: locked ? 0.3 : 1, transition: "all 0.15s" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: done ? course.color : active ? `rgba(245,158,11,0.12)` : C.hi, border: `2px solid ${done ? course.color : active ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: done ? "#fff" : C.dim, fontWeight: 700 }}>
                {done ? "✓" : s.id}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: done ? course.color : active ? C.accent : C.muted, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: TAG_COLORS[s.tag] || C.dim, opacity: 0.8 }}>{s.tag}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer actions */}
      <div style={{ padding: "12px 12px", borderTop: `1px solid ${C.border}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <button onClick={onReset} style={{ width: "100%", background: "none", border: `1px solid ${C.border}`, color: C.dim, padding: 8, borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          🔄 Restart Course
        </button>
        {onStartFresh && (
          <button onClick={onStartFresh} style={{ width: "100%", background: "none", border: `1px solid ${C.red}40`, color: C.red, padding: 8, borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: 0.7 }}>
            🗑️ Start Fresh
          </button>
        )}
      </div>
    </div>
  )
}
