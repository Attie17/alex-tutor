import { getAdminClient } from './supabase-admin'

/**
 * Server-side logger — writes to the app_logs table via service role.
 * Safe to call from any server component, route handler, or API route.
 *
 * @param {'info'|'warn'|'error'} level
 * @param {string} event  Short dot-namespaced identifier, e.g. "auth.callback.success"
 * @param {object} [data] Any extra context (user_id, courseId, error message, etc.)
 */
export async function logEvent(level = 'info', event, data = {}) {
  try {
    const admin = getAdminClient()
    const { user_id, ...rest } = data
    await admin.from('app_logs').insert({
      level,
      event,
      user_id: user_id ?? null,
      data: Object.keys(rest).length > 0 ? rest : null,
    })
  } catch (err) {
    // Logging must never crash the app
    console.error('[logger] failed to write app_log:', err?.message ?? err)
  }
}

export const log  = (event, data) => logEvent('info',  event, data)
export const warn = (event, data) => logEvent('warn',  event, data)
export const err  = (event, data) => logEvent('error', event, data)
