import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase-server'
import { COURSE_PRICES_ZAR, COURSE_ITEM_NAMES, isValidCourseId } from '@/lib/payfast-products'

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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    if (!merchantId || !siteUrl) {
      console.error('Payfast initiate: missing env config')
      return Response.json({ error: 'Payment gateway not configured' }, { status: 500 })
    }

    const amountZAR = COURSE_PRICES_ZAR[courseId]
    const itemName = COURSE_ITEM_NAMES[courseId]
    const mPaymentId = crypto.randomUUID()

    // _paynow — no signature required, works with payment.payfast.io
    const fields = {
      cmd: '_paynow',
      receiver: merchantId,
      item_name: itemName,
      item_description: `Alex Tutor — ${itemName}`,
      amount: amountZAR.toFixed(2),
      return_url: `${siteUrl}/payment/success?course=${courseId}`,
      cancel_url: `${siteUrl}/payment/cancel?course=${courseId}`,
      notify_url: `${siteUrl}/api/payfast/itn`,
      m_payment_id: mPaymentId,
      email_address: user.email || '',
      custom_str1: user.id,
      custom_str2: courseId,
      email_confirmation: '1',
      confirmation_address: user.email || '',
    }

    console.log('[payfast] _paynow fields:', fields)

    return Response.json({
      payfastUrl: 'https://payment.payfast.io/eng/process',
      fields,
    })
  } catch (error) {
    console.error('Payfast initiate error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
