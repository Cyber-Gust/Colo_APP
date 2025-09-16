'use client'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabaseClient'

export default function SignOutButton({ to = '/login-ubs' }) {
  const router = useRouter()
  const onOut = async () => {
    await supabase.auth.signOut()
    router.push(to)
  }
  return <button onClick={onOut}>Sair</button>
}
