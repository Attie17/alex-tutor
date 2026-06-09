import crypto from 'node:crypto'
import { getAdminClient } from '@/lib/supabase-admin'
import { COURSE_PRICES_ZAR, BUNDLE_COURSES, isValidCourseId } from '@/lib/payfast-products'

// PayFast retries non-200 responses for up to 24h. We always return 200 after
// recording the ITN so we don't get retry storms — diagnostics live in logs.
function ok() {
  return new Response('OK', { status: 200 })
}

function pfEncode(value) {
  return encodeURIComponent(String(value))
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/'/g, '%27')
    .replace(/~/g, '%7E')
}

// Rebuild the signature from the posted fields (in their original wire order,
// excluding `signature`), append `&passphrase=...` if configured, MD5.
function verifySignature(orderedPairs, passphrase, posted) {
  const parts = []
  for (const [k, v] of orderedPairs) {
    if (k === 'signature') continue
    if (v === '' || v === undefined || v === null) continue
    parts.push(`${k}=${pfEncode(v)}`)
  }
  let base = parts.join('&')
  if (passphrase) base += `&passphrase=${pfEncode(passphrase)}`
  const computed = crypto.createHash('md5').update(base).digest('hex')
  return computed.toLowerCase() === String(posted || '').toLowerCase()
}

// Server-to-server validation. PayFast replies with a body starting with
// "VALID" if the ITN is genuine.
async function validateWithPayfast(rawBody, sandbox) {
  const host = sandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za'
  const res = await fetch(`https://${host}/eng/query/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: rawBody,
  })
  const text = (await res.text()).trim()
  return text.startsWith('VALID')
}

export async function POST(request) {
  let rawBody = ''
  try {
    rawBody = await request.text()
    const params = new URLSearchParams(rawBody)
    const orderedPairs = [...params.entries()]
    const fields = Object.fromEntries(orderedPairs)

    const passphrase = process.env.PAYFAST_PASSPHRASE || ''
    const sandbox = process.env.PAYFAST_SANDBOX !== 'false'

    // (1) Signature
    if (!verifySignature(orderedPairs, passphrase, fields.signature)) {
      console.error('[itn] signature mismatch', { m_payment_id: fields.m_payment_id })
      return ok()
    }

    // (2) Server-to-server validation
    const valid = await validateWithPayfast(rawBody, sandbox).catch(err => {
      console.error('[itn] validate request failed:', err)
      return false
    })
    if (!valid) {
      console.error('[itn] payfast validate returned non-VALID', { m_payment_id: fields.m_payment_id })
      return ok()
    }

    // (3) Merchant id matches
    if (fields.merchant_id !== process.env.PAYFAST_MERCHANT_ID) {
      console.error('[itn] merchant_id mismatch')
      return ok()
    }

    // (4) Shape checks on the fields we rely on
    const mPaymentId = fields.m_payment_id
    const userId = fields.custom_str1
    const courseId = fields.custom_str2
    const amountGross = parseFloat(fields.amount_gross)
    const paymentStatus = fields.payment_status

    if (!mPaymentId || !userId || !isValidCourseId(courseId) || !Number.isFinite(amountGross)) {
      console.error('[itn] missing or invalid fields', { mPaymentId, userId, courseId, amountGross })
      return ok()
    }

    // (5) Amount matches our price list (defends against tampering)
    const expected = COURSE_PRICES_ZAR[courseId]
    if (Math.abs(amountGross - expected) > 0.01) {
      console.error('[itn] amount mismatch', { courseId, expected, amountGross })
      return ok()
    }

    const admin = getAdminClient()
    const status =
      paymentStatus === 'COMPLETE' ? 'complete' :
      paymentStatus === 'CANCELLED' ? 'cancelled' :
      paymentStatus === 'FAILED' ? 'failed' : 'pending'

    // (6) Idempotent upsert of the order row keyed on m_payment_id
    const { error: orderErr } = await admin.from('orders').upsert(
      {
        m_payment_id: mPaymentId,
        user_id: userId,
        course_id: courseId,
        amount_zar: amountGross,
        status,
        pf_payment_id: fields.pf_payment_id || null,
        raw_itn: fields,
        paid_at: status === 'complete' ? new Date().toISOString() : null,
      },
      { onConflict: 'm_payment_id' },
    )
    if (orderErr) {
      console.error('[itn] orders upsert error:', orderErr)
      return ok()
    }

    // (7) Grant entitlement. Bundle expands to all three courses.
    if (status === 'complete') {
      const courses = courseId === 'bundle' ? BUNDLE_COURSES : [courseId]
      const rows = courses.map(cid => ({
        user_id: userId,
        course_id: cid,
        source: 'payfast',
        order_id: mPaymentId,
      }))
      const { error: grantErr } = await admin.from('user_purchases').upsert(rows, {
        onConflict: 'user_id,course_id',
        ignoreDuplicates: true,
      })
      if (grantErr) {
        console.error('[itn] user_purchases upsert error:', grantErr)
        return ok()
      }
      console.log('[itn] granted', { userId, courseId, mPaymentId })
    } else {
      console.log('[itn] recorded non-complete status', { mPaymentId, status })
    }

    return ok()
  } catch (err) {
    console.error('[itn] unhandled error:', err, { rawBodyLen: rawBody.length })
    return ok()
  }
}
