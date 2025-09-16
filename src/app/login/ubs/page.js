import { supabaseServer } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import UBSLoginForm from './UBSLoginForm'

export default async function Page() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()

  if (user) {
    const { data: profile } = await sb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'UBS') redirect('/ubs')
    if (profile?.role === 'GESTANTE') redirect('/gestante')
  }

  return <UBSLoginForm />
}
