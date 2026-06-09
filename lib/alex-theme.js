export const C = {
  bg:       "#0a0f1a",
  surface:  "#0f172a",
  hi:       "#1e293b",
  border:   "#334155",
  accent:   "#f59e0b",
  accent2:  "#f97316",
  text:     "#f1f5f9",
  muted:    "#94a3b8",
  dim:      "#475569",
  green:    "#10b981",
  blue:     "#3b82f6",
  purple:   "#8b5cf6",
  red:      "#ef4444",
}

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: ${C.bg}; font-family: 'DM Sans', sans-serif; color: ${C.text}; }
  @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-6px);opacity:1} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
  @keyframes glow { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes spin { to{transform:rotate(360deg)} }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
  textarea { font-family: 'DM Sans', sans-serif; }
  textarea:focus, input:focus { outline: none; }
  input::placeholder, textarea::placeholder { color: ${C.dim}; }
`
