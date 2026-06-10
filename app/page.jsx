'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  bg:'#0a0f1a', surface:'#0f172a', card:'#131c2e', border:'#1e293b',
  border2:'#334155', amber:'#f59e0b', orange:'#f97316', green:'#10b981',
  purple:'#8b5cf6', blue:'#3b82f6', pink:'#ec4899', text:'#f1f5f9',
  muted:'#94a3b8', dim:'#64748b', dimmer:'#475569',
}

const COURSES = [
  {
    id:'beginner', num:'01', emoji:'🌱',
    title:'Learning to Work with Claude',
    subtitle:'Beginner',
    color:'#10b981',
    desc:'Never used AI intentionally? Start here. Six lessons that go from "What is AI?" to using it for something real in your life today.',
    lessons:6, freeCount:2,
    price:'R399', usd:'$22',
    tags:['No tech needed','Beginner-friendly','6 sessions'],
    cta:'Start for Free →',
    href:'/learn',
  },
  {
    id:'work', num:'02', emoji:'🚀',
    title:'Claude at Work',
    subtitle:'Professional',
    color:'#3b82f6',
    desc:'You use AI daily — now get serious about it. Master prompting patterns, Projects, and the everyday workflows that make Claude an extension of how you work.',
    lessons:10, freeCount:2,
    price:'R599', usd:'$33',
    tags:['Hands-on practice','Real workflows','10 sessions'],
    cta:'Start Learning →',
    href:'/learn?course=work',
  },
  {
    id:'advanced', num:'03', emoji:'⚙️',
    title:'Mastering Claude',
    subtitle:'Advanced',
    color:'#ef4444',
    desc:'Already fluent with Claude? Push further — advanced prompting techniques, multi-step workflows, working with files and long context, and a capstone project that solves a real problem in your life.',
    lessons:16, freeCount:2,
    price:'R999', usd:'$55',
    tags:['Advanced','16 sessions','Capstone project'],
    cta:'Go Deep →',
    href:'/learn?course=advanced',
  },
]

export default function LandingPage() {
  const [hovered, setHovered] = useState(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:"'DM Sans',sans-serif", overflowX:'hidden' }}>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(10,15,26,0.92)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${C.border}`, padding:'0 20px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'22px' }}>🤖</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:'18px', fontWeight:'800', color:C.amber, letterSpacing:'-0.5px' }}>Alex</span>
          <span style={{ fontSize:'11px', color:C.dim, fontWeight:'600', letterSpacing:'0.06em', textTransform:'uppercase' }}>Tutor</span>
        </div>
        {/* Desktop nav links — hidden on small screens via CSS class */}
        <div className="nav-links" style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <a href="#courses" style={{ fontSize:'13px', color:C.muted, fontWeight:'500', textDecoration:'none' }}>Courses</a>
          <a href="#how" style={{ fontSize:'13px', color:C.muted, fontWeight:'500', textDecoration:'none' }}>How it works</a>
        </div>
        <button onClick={()=>router.push('/auth/login')} style={{ background:`linear-gradient(135deg,${C.amber},${C.orange})`, border:'none', color:'#0f172a', padding:'9px 20px', borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:'700', whiteSpace:'nowrap' }}>Sign In</button>
      </nav>
      <style>{`
        @media (max-width: 480px) { .nav-links { display: none !important; } }
      `}</style>

      {/* Hero */}
      <div style={{ padding:'90px 32px 70px', maxWidth:'900px', margin:'0 auto', textAlign:'center', position:'relative' }}>
        <div style={{ position:'absolute', top:'40px', left:'50%', transform:'translateX(-50%)', width:'600px', height:'400px', background:'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'20px', padding:'5px 14px', marginBottom:'28px' }}>
          <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:C.green, boxShadow:`0 0 6px ${C.green}` }} />
          <span style={{ fontSize:'12px', fontWeight:'700', color:C.green, letterSpacing:'0.06em' }}>FIRST 2 SESSIONS FREE IN EVERY COURSE</span>
        </div>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(40px,7vw,78px)', fontWeight:'800', color:C.text, margin:'0 0 8px', letterSpacing:'-2px', lineHeight:1.05 }}>Learn Claude.</h1>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(40px,7vw,78px)', fontWeight:'800', margin:'0 0 24px', letterSpacing:'-2px', lineHeight:1.05, background:`linear-gradient(135deg,${C.amber},${C.orange})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Taught by Claude.</h1>
        <p style={{ fontSize:'18px', color:C.muted, maxWidth:'540px', margin:'0 auto 40px', lineHeight:'1.7' }}>Three interactive courses that adapt to your level. Live AI feedback. No videos. No passive reading. Just real practice with Alex, your personal AI tutor.</p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={()=>router.push('/learn')} style={{ background:`linear-gradient(135deg,${C.amber},${C.orange})`, color:'#0f172a', border:'none', padding:'16px 36px', borderRadius:'50px', fontSize:'16px', fontWeight:'700', fontFamily:"'DM Sans',sans-serif", cursor:'pointer', boxShadow:'0 8px 28px rgba(245,158,11,0.4)' }}>Start for Free →</button>
          <a href="#courses" style={{ background:'none', border:`1px solid ${C.border2}`, color:C.muted, padding:'16px 36px', borderRadius:'50px', fontSize:'16px', fontWeight:'600', fontFamily:"'DM Sans',sans-serif", cursor:'pointer', display:'inline-block', textDecoration:'none' }}>See all courses</a>
          {installPrompt && !installed && (
            <button onClick={handleInstall} style={{ background:'none', border:`1px solid ${C.green}`, color:C.green, padding:'16px 28px', borderRadius:'50px', fontSize:'15px', fontWeight:'600', fontFamily:"'DM Sans',sans-serif", cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'8px' }}>
              📲 Add to Home Screen
            </button>
          )}
        </div>
        {installed && (
          <p style={{ marginTop:'16px', fontSize:'13px', color:C.green }}>✓ Alex Tutor added to your home screen!</p>
        )}
      </div>

      {/* Quote */}
      <div style={{ background:'rgba(245,158,11,0.04)', borderTop:'1px solid rgba(245,158,11,0.1)', borderBottom:'1px solid rgba(245,158,11,0.1)', padding:'32px', textAlign:'center' }}>
        <p style={{ fontStyle:'italic', fontSize:'18px', color:C.muted, maxWidth:'600px', margin:'0 auto 10px', lineHeight:'1.7' }}>"Claude is currently the closest thing to a senior-engineer-level AI partner for building complicated apps."</p>
        <p style={{ fontSize:'12px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.amber }}>Perplexity AI — independently ranked the best. That's why every Alex Tutor session is taught by Claude.</p>
      </div>

      {/* Courses */}
      <div id="courses" style={{ padding:'80px 24px', maxWidth:'1100px', margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'52px' }}>
          <div style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:C.amber, marginBottom:'12px' }}>Three Courses</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(28px,4vw,44px)', fontWeight:'800', color:C.text, margin:'0', letterSpacing:'-1px' }}>Pick your starting point</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'20px' }}>
          {COURSES.map(course => (
            <div key={course.id} onMouseEnter={()=>setHovered(course.id)} onMouseLeave={()=>setHovered(null)}
              style={{ background:hovered===course.id?`${course.color}08`:C.card, border:`1px solid ${hovered===course.id?course.color:C.border}`, borderRadius:'20px', padding:'28px 24px', transition:'all 0.25s', transform:hovered===course.id?'translateY(-4px)':'translateY(0)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:'16px', right:'20px', fontFamily:"'Syne',sans-serif", fontSize:'72px', fontWeight:'800', color:`${course.color}08`, lineHeight:1, userSelect:'none' }}>{course.num}</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'20px', padding:'3px 10px', marginBottom:'16px' }}>
                <span style={{ fontSize:'10px', fontWeight:'700', color:C.green }}>First {course.freeCount} lessons free</span>
              </div>
              <div style={{ fontSize:'36px', marginBottom:'12px' }}>{course.emoji}</div>
              <div style={{ fontSize:'10px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:course.color, marginBottom:'6px' }}>{course.subtitle}</div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:'22px', fontWeight:'800', color:C.text, margin:'0 0 12px', letterSpacing:'-0.5px', lineHeight:1.2 }}>{course.title}</h3>
              <p style={{ fontSize:'13.5px', color:C.muted, lineHeight:'1.7', marginBottom:'20px' }}>{course.desc}</p>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'24px' }}>
                {course.tags.map(t=><span key={t} style={{ fontSize:'11px', fontWeight:'600', color:C.dim, background:'#1e293b', border:`1px solid ${C.border2}`, padding:'3px 9px', borderRadius:'20px' }}>{t}</span>)}
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:'8px', marginBottom:'20px' }}>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:'28px', fontWeight:'800', color:C.text }}>{course.price}</span>
                <span style={{ fontSize:'13px', color:C.dim }}>{course.usd}</span>
                <span style={{ fontSize:'12px', color:C.dim, marginLeft:'4px' }}>once-off</span>
              </div>
              <button onClick={()=>router.push(course.href)} style={{ width:'100%', background:hovered===course.id?`linear-gradient(135deg,${course.color},${C.amber})`:'#1e293b', border:`1px solid ${hovered===course.id?course.color:C.border2}`, color:hovered===course.id?'#0f172a':C.muted, padding:'13px', borderRadius:'12px', fontSize:'14px', fontWeight:'700', fontFamily:"'DM Sans',sans-serif", cursor:'pointer', transition:'all 0.25s' }}>
                {course.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* How Alex teaches */}
      <div id="how" style={{ padding:'72px 24px', background:C.surface, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:C.amber, marginBottom:'12px' }}>The Alex Principle</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(24px,4vw,38px)', fontWeight:'800', color:C.text, margin:'0 0 16px', letterSpacing:'-1px' }}>One step. Confirmed. Then the next.</h2>
          <p style={{ fontSize:'16px', color:C.muted, lineHeight:'1.8', maxWidth:'520px', margin:'0 auto 48px' }}>Alex never dumps a wall of information. Every message teaches one thing, then asks if you got it — and waits for your answer before moving on.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'14px', textAlign:'left' }}>
            {[
              { icon:'🎯', title:'One thing at a time', desc:'Every message covers exactly one concept or action. No more.' },
              { icon:'✅', title:'Always verified', desc:'Alex never moves forward until you confirm it worked.' },
              { icon:'🔧', title:'Fixes problems live', desc:'If something looks different, Alex asks what you see and fixes it with you.' },
              { icon:'🧠', title:'Adapts to you', desc:'Same curriculum, taught at four different depths based on your background.' },
            ].map(item=>(
              <div key={item.title} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'14px', padding:'20px 16px' }}>
                <div style={{ fontSize:'26px', marginBottom:'10px' }}>{item.icon}</div>
                <div style={{ fontSize:'14px', fontWeight:'700', color:C.text, marginBottom:'6px' }}>{item.title}</div>
                <div style={{ fontSize:'13px', color:C.dim, lineHeight:'1.6' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding:'72px 24px', maxWidth:'700px', margin:'0 auto' }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'28px', fontWeight:'800', color:C.text, textAlign:'center', marginBottom:'36px', letterSpacing:'-0.5px' }}>Common questions</h2>
        {[
          { q:'Do I need anything special to start?', a:'Just a browser. Everything happens in the chat window — no downloads, no installs, no setup.' },
          { q:'Can I really start for free?', a:'Yes. The first two sessions of every course are completely free. No payment needed to try.' },
          { q:'What if something on my screen looks different?', a:'Just tell Alex. Describe what you see and Alex will walk you through fixing it before continuing.' },
          { q:'Is this South Africa only?', a:'No. The courses work for anyone anywhere. Pricing is shown in both Rands and USD.' },
          { q:'Which AI model does Alex use?', a:'Claude Haiku — the fastest and most affordable Claude model, perfect for real-time tutoring.' },
        ].map((item,i)=>(
          <div key={i} style={{ borderBottom:`1px solid ${C.border}`, padding:'20px 0' }}>
            <div style={{ fontSize:'15px', fontWeight:'600', color:C.text, marginBottom:'8px' }}>{item.q}</div>
            <div style={{ fontSize:'14px', color:C.dim, lineHeight:'1.7' }}>{item.a}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${C.border}`, padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'18px' }}>🤖</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:'15px', fontWeight:'800', color:C.amber }}>Alex Tutor</span>
        </div>
        <div style={{ fontSize:'12px', color:C.dimmer }}>Powered by Claude Haiku · Anthropic</div>
        <div style={{ fontSize:'12px', color:C.dimmer }}>© 2026 Maranata Ventures</div>
      </div>
    </div>
  )
}
