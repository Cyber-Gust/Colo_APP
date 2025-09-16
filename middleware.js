// middleware.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => req.cookies.get(key)?.value,
        set: (key, value, options) => res.cookies.set({ name: key, value, ...options }),
        remove: (key, options) => res.cookies.set({ name: key, value: '', ...options }),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = req.nextUrl.pathname

  const isUBSArea = pathname.startsWith('/ubs')
  const isGestanteArea = pathname.startsWith('/gestante')

  // deixa passar tudo que não for área privada
  if (!isUBSArea && !isGestanteArea) return res

  // se não logado, manda para o login correspondente
  if (!user) {
    const to = isUBSArea ? '/login/ubs' : '/login/gestante'
    return NextResponse.redirect(new URL(to, req.url))
  }

  // checa o profile/role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // se tentar acessar a área errada, manda para a área certa
  if (isUBSArea && profile?.role !== 'UBS') {
    return NextResponse.redirect(new URL('/gestante', req.url))
  }
  if (isGestanteArea && profile?.role !== 'GESTANTE') {
    return NextResponse.redirect(new URL('/ubs', req.url))
  }

  return res
}

export const config = {
  // protege apenas as áreas privadas
  matcher: ['/ubs/:path*', '/gestante/:path*'],
}
