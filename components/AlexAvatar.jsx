'use client'
import { C } from '@/lib/alex-theme'

export default function AlexAvatar({ size = 34, pulse = false }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, flexShrink: 0, boxShadow: pulse ? `0 0 12px ${C.accent}80` : "none" }}>
      🤖
    </div>
  )
}
