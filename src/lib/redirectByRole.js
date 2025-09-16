'use client'
import { supabase } from '@/src/lib/supabaseClient'

export async function redirectByRole(router) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return router.push('/login-ubs')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'UBS') return router.push('/ubs')
  if (profile?.role === 'GESTANTE') return router.push('/gestante')
  router.push('/login-ubs')
}
