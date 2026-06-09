// Browser → API routes. The server enforces auth, rate limit, and
// selects the system prompt. The API key never leaves the server.

async function postJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = new Error(`${path} failed: ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export async function sendChat({ messages, courseId, sessionId, mode }) {
  const data = await postJson('/api/chat', { messages, courseId, sessionId, mode })
  return data.text
}

export async function fetchQuiz({ courseId, sessionId }) {
  const data = await postJson('/api/quiz', { courseId, sessionId })
  return data.questions
}

export async function fetchHint({ courseId, sessionId, hintNum, messages }) {
  const data = await postJson('/api/hint', { courseId, sessionId, hintNum, messages })
  return data.text
}
