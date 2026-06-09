'use client'

export default function CodeBlock({ text }) {
  return (
    <div style={{ background: "#020617", border: `1px solid #1e3a5f`, borderRadius: 8, padding: "12px 16px", margin: "8px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#7dd3fc", overflowX: "auto", whiteSpace: "pre" }}>
      {text}
    </div>
  )
}
