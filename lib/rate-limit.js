// Per-process counter. Does NOT span serverless instances or survive
// cold starts — replace with a Supabase-backed counter before relying
// on this in production.
const buckets = new Map()

// Returns { ok: boolean, resetAt: number }.
// `key` should be specific to the route + user, e.g. `chat:${userId}`.
export function checkRateLimit(key, max, windowMs) {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || now - entry.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now })
    return { ok: true, resetAt: now + windowMs }
  }
  if (entry.count >= max) {
    return { ok: false, resetAt: entry.windowStart + windowMs }
  }
  entry.count += 1
  return { ok: true, resetAt: entry.windowStart + windowMs }
}
