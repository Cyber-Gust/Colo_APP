// /src/middleware.js (trecho principal)
export const config = {
  matcher: ['/login/ubs', '/ubs/:path*', '/first-access/ubs'],
}

export async function middleware(req) {
  // ... sua criação do supabase aqui ...
  const { data: { session } } = await supabase.auth.getSession()
  const url = new URL(req.url)
  const path = url.pathname

  const isUbsPanel = path.startsWith('/ubs')
  const isUbsLogin = path === '/login/ubs'
  const isFirstUbs = path === '/first-access/ubs'

  if (isUbsPanel && !session) {
    const loginUrl = new URL('/login/ubs', req.url)
    loginUrl.searchParams.set('redirectTo', path + (url.search || ''))
    return NextResponse.redirect(loginUrl)
  }

  if (isUbsLogin && session) {
    // checa profile para decidir entre wizard x dashboard
    const { data: profile } = await supabase
      .from('profiles').select('role, ubs_id, onboarding_done').eq('id', session.user.id).single()

    if (profile?.role === 'UBS_ADMIN' && !profile?.ubs_id && !profile?.onboarding_done) {
      return NextResponse.redirect(new URL('/first-access/ubs', req.url))
    }
    return NextResponse.redirect(new URL('/ubs/dashboard', req.url))
  }

  // o wizard exige estar logado (mas sem UBS ainda)
  if (isFirstUbs && !session) {
    return NextResponse.redirect(new URL('/login/ubs', req.url))
  }

  return NextResponse.next()
}
