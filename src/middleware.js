// src/middleware.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const config = {
  matcher: ['/login/ubs', '/ubs/:path*', '/first-access/ubs'],
}

export async function middleware(req) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set(name, value, options),
        remove: (name, options) => res.cookies.set(name, '', { ...options, maxAge: 0 }),
      },
    }
  )

  // ✅ mais seguro que getSession()
  const { data: { user } } = await supabase.auth.getUser()

  const url = new URL(req.url)
  const path = url.pathname

  const isUbsPanel  = path.startsWith('/ubs')
  const isUbsLogin  = path === '/login/ubs'
  const isFirstUbs  = path === '/first-access/ubs'

  // protege painel
  if (isUbsPanel && !user) {
    const loginUrl = new URL('/login/ubs', req.url)
    loginUrl.searchParams.set('redirectTo', path + (url.search || ''))
    return NextResponse.redirect(loginUrl)
  }

  // já logado acessando /login/ubs → decide destino
  if (isUbsLogin && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, ubs_id, onboarding_done')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'UBS_ADMIN' && !profile?.ubs_id && !profile?.onboarding_done) {
      return NextResponse.redirect(new URL('/first-access/ubs', req.url))
    }
    return NextResponse.redirect(new URL('/ubs/dashboard', req.url))
  }

  // wizard exige login; se já provisionou, manda ao painel
  if (isFirstUbs) {
    if (!user) return NextResponse.redirect(new URL('/login/ubs', req.url))

    const { data: profile } = await supabase
      .from('profiles')
      .select('ubs_id')
      .eq('id', user.id)
      .single()

    if (profile?.ubs_id) return NextResponse.redirect(new URL('/ubs/dashboard', req.url))
  }

  return res
}
