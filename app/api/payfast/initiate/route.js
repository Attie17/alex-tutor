import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase-server'
import { COURSE_PRICES_ZAR, COURSE_ITEM_NAMES, isValidCourseId } from '@/lib/payfast-products'

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

// Builds the Payfast MD5 signature.
// Order of fields in the input object MUST match the order Payfast expects
// (the order they appear in the payment form, not alphabetical).
function buildSignature(fields, passphrase) {
  const parts = []
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue
    parts.push(`${key}=${pfEncode(value)}`)
  }
  let signatureBase = parts.join('&')
  if (passphrase) {
    signatureBase += `&passphrase=${pfEncode(passphrase)}`
  }
  console.log('[payfast] signature base string:', signatureBase)
  return crypto.createHash('md5').update(signatureBase).digest('hex')
}

function resolveFirstName(user) {
  const fromMeta = user?.user_metadata?.first_name
  const raw = (typeof fromMeta === 'string' && fromMeta.trim())
    ? fromMeta.trim()
    : (user?.email?.split('@')[0] || 'Learner')
  const cleaned = raw.replace(/[^A-Za-z]/g, '').slice(0, 100)
  return cleaned || 'Learner'
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { courseId } = body

    if (!isValidCourseId(courseId)) {
      return Response.json(
        { error: 'Invalid courseId. Must be one of: beginner, work, advanced, bundle' },
        { status: 400 },
      )
    }

    const merchantId = process.env.PAYFAST_MERCHANT_ID
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY
    const passphrase = process.env.PAYFAST_PASSPHRASE || ''
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    if (!merchantId || !merchantKey || !siteUrl) {
      console.error('Payfast initiate: missing env config')
      return Response.json({ error: 'Payment gateway not configured' }, { status: 500 })
    }

    const amountZAR = COURSE_PRICES_ZAR[courseId]
    const itemName = COURSE_ITEM_NAMES[courseId]
    const mPaymentId = crypto.randomUUID()

    // Field order matters for signature — keep it consistent with Payfast docs.
    const fields = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${siteUrl}/payment/success?course=${courseId}`,
      cancel_url: `${siteUrl}/payment/cancel?course=${courseId}`,
      notify_url: `${siteUrl}/api/payfast/itn`,
      name_first: resolveFirstName(user),
      email_address: user.email || '',
      m_payment_id: mPaymentId,
      amount: amountZAR.toFixed(2),
      item_name: itemName,
      custom_str1: user.id,
      custom_str2: courseId,
    }

    console.log('[payfast] fields:', fields)
    const signature = buildSignature(fields, passphrase)
    console.log('[payfast] signature:', signature)

    const sandbox = process.env.PAYFAST_SANDBOX !== 'false'
    const payfastUrl = sandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process'

    return Response.json({
      payfastUrl,
      fields: { ...fields, signature },
    })
  } catch (error) {
    console.error('Payfast initiate error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
