'use client'
import AlexAvatar from './AlexAvatar'
import CodeBlock from './CodeBlock'
import { C } from '@/lib/alex-theme'

function renderContent(text) {
  const cleaned = text
    // Strip "🎯 ASSESSMENT: ..." lines
    .replace(/🎯\s*ASSESSMENT:.*?(\n|$)/g, '')
    // Strip bare "level=X recommended=Y" lines (with optional brackets)
    .replace(/\n?[ \t]*-{3,}[ \t]*\n[ \t]*level=\[?\w+\]?\s+recommended=\[?\w+\]?[ \t]*\n[ \t]*-{3,}[ \t]*\n?/gs, '\n')
    .replace(/^[ \t]*level=\[?\w+\]?\s+recommended=\[?\w+\]?[ \t]*(\n|$)/gm, '')
    .replace(/^##\s+🎓[^\n]*\n?/gm, '')
    .trim()
  return cleaned.split(/(```[\s\S]*?```|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) return <CodeBlock key={i} text={part.slice(3, -3).replace(/^\w+\n/, "")} />
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} style={{ background: C.hi, color: C.accent2, padding: "2px 6px", borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{part.slice(1, -1)}</code>
    return <span key={i}>{part}</span>
  })
}

export default function MessageBubble({ msg, userName }) {
  const isUser = msg.role === "user"

  if (msg.role === "hint") return (
    <div style={{ display: "flex", marginBottom: 16, alignItems: "flex-start", gap: 10, animation: "fadeUp .3s ease both" }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>💡</div>
      <div style={{ maxWidth: "78%", background: `rgba(245,158,11,0.06)`, color: "#fcd34d", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", lineHeight: 1.7, fontSize: 14, border: `1px solid rgba(245,158,11,0.25)`, whiteSpace: "pre-wrap" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.accent, marginBottom: 6 }}>Hint {msg.hintNum} of 3</div>
        {msg.content}
      </div>
    </div>
  )

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16, alignItems: "flex-end", gap: 10, animation: "fadeUp .25s ease both" }}>
      {!isUser && <AlexAvatar />}
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 6 }}>
        {!isUser && <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: "0.06em", textTransform: "uppercase", paddingLeft: 4 }}>Alex</div>}
        {isUser && <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", paddingRight: 4 }}>{userName || "You"}</div>}
        <div style={{ background: isUser ? `linear-gradient(135deg, ${C.accent}, ${C.accent2})` : C.hi, color: isUser ? C.bg : C.text, padding: "12px 16px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", lineHeight: 1.7, fontSize: 14.5, border: isUser ? "none" : `1px solid ${C.border}`, boxShadow: isUser ? `0 4px 12px rgba(245,158,11,0.25)` : "none", whiteSpace: "pre-wrap" }}>
          {isUser ? msg.content : renderContent(msg.content)}
        </div>
      </div>
      {isUser && <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>}
    </div>
  )
}
