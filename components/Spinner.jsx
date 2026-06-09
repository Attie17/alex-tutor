'use client'
import { C } from '@/lib/alex-theme'

export default function Spinner() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "2px 0" }}>
      {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
    </div>
  )
}
