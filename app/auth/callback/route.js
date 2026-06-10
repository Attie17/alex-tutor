import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { log, warn, err } from '@/lib/logger'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const user = data?.user
      await log('auth.callback.success', {
        user_id: user?.id,
        email: user?.email,
        next,
        has_first_name: !!user?.user_metadata?.first_name,
        has_recommended_course: !!user?.user_metadata?.recommended_course,
        recommended_course: user?.user_metadata?.recommended_course ?? null,
      })
      return NextResponse.redirect(`${origin}${next}`)
    }
    await err('auth.callback.exchange_failed', { error: error.message, next })
  } else {
    await warn('auth.callback.no_code', { next, url: request.url })
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
