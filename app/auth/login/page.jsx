'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

const C = {
  bg:'#0a0f1a', surface:'#0f172a', card:'#131c2e',
  border:'#1e293b', border2:'#334155', amber:'#f59e0b',
  orange:'#f97316', green:'#10b981', text:'#f1f5f9',
  muted:'#94a3b8', dim:'#64748b',
}

function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState('signin')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [message, setMessage]   = useState(null)
  const [showPw, setShowPw]     = useState(false)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') || '/'
  const supabase     = createClient()

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError(null); setMessage(null)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirect}` }
      })
      if (error) setError(error.message)
      else setMessage('Almost there! Check your inbox for a confirmation email from Alex Tutor — it will arrive from a Supabase address on our behalf. Click the link, then come back here to sign in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push(redirect)
    }
    setLoading(false)
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'DM Sans',sans-serif" }}>

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:'32px' }}>
        <img src="/alex-logo.png" alt="Alex Tutor" style={{ height:'72px', width:'auto', marginBottom:'12px' }} />
        <p style={{ fontSize:'14px', color:C.dim }}>Sign in to continue your learning journey</p>
      </div>

      {/* Quote */}
      <div style={{ width:'100%', maxWidth:'400px', background:C.card, border:`1px solid rgba(245,158,11,0.2)`, borderRadius:'14px', padding:'18px 20px', marginBottom:'20px' }}>
        <div style={{ fontSize:'20px', color:C.amber, marginBottom:'8px' }}>"</div>
        <p style={{ fontStyle:'italic', fontSize:'14px', color:C.muted, lineHeight:'1.7' }}>Claude is currently the closest thing to a senior-engineer-level AI partner for building complicated apps.</p>
        <div style={{ borderTop:`1px solid rgba(245,158,11,0.15)`, marginTop:'12px', paddingTop:'10px', fontSize:'11px', fontWeight:'700', color:C.amber, letterSpacing:'0.08em', textAlign:'center' }}>PERPLEXITY AI</div>
        <p style={{ fontSize:'11px', color:C.dim, textAlign:'center', marginTop:'4px' }}>That's why this course teaches the Claude API.</p>
      </div>

      {/* Form */}
      <div style={{ width:'100%', maxWidth:'400px', background:C.surface, border:`1px solid ${C.border}`, borderRadius:'16px', padding:'28px 24px' }}>

        {/* Mode toggle */}
        <div style={{ display:'flex', background:C.card, borderRadius:'10px', padding:'4px', marginBottom:'24px' }}>
          {['signin','signup'].map(m => (
            <button key={m} onClick={()=>{ setMode(m); setError(null); setMessage(null); }} style={{ flex:1, padding:'8px', borderRadius:'7px', border:'none', background:mode===m?'#1e293b':'transparent', color:mode===m?C.text:C.dim, fontSize:'13px', fontWeight:mode===m?'600':'500', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s' }}>
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Email */}
        <div style={{ marginBottom:'14px' }}>
          <label style={{ display:'block', fontSize:'11px', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:C.dim, marginBottom:'6px' }}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={handleKey} placeholder="you@example.com"
            style={{ width:'100%', background:C.card, border:`1px solid ${C.border2}`, borderRadius:'10px', padding:'11px 14px', fontSize:'14px', color:C.text, fontFamily:"'DM Sans',sans-serif", outline:'none' }} />
        </div>

        {/* Password */}
        <div style={{ marginBottom:'20px' }}>
          <label style={{ display:'block', fontSize:'11px', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:C.dim, marginBottom:'6px' }}>Password</label>
          <div style={{ position:'relative' }}>
            <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={handleKey} placeholder="••••••••"
              style={{ width:'100%', background:C.card, border:`1px solid ${C.border2}`, borderRadius:'10px', padding:'11px 40px 11px 14px', fontSize:'14px', color:C.text, fontFamily:"'DM Sans',sans-serif", outline:'none' }} />
            <button onClick={()=>setShowPw(s=>!s)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:C.dim, cursor:'pointer', fontSize:'16px' }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Error / Message */}
        {error   && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#f87171', marginBottom:'16px' }}>{error}</div>}
        {message && <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:C.green, marginBottom:'16px' }}>{message}</div>}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} style={{ width:'100%', background:`linear-gradient(135deg,${C.amber},${C.orange})`, color:'#0f172a', border:'none', padding:'13px', borderRadius:'10px', fontSize:'15px', fontWeight:'700', fontFamily:"'DM Sans',sans-serif", cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, transition:'all 0.2s' }}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
        </button>

        <p style={{ textAlign:'center', fontSize:'12px', color:C.dim, marginTop:'16px' }}>
          <a href="/" style={{ color:C.amber }}>← Back to home</a>
        </p>
      </div>

      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#0a0f1a', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}>Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}
