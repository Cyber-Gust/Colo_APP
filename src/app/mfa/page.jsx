'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseClient'
import LoginCard from '@/components/ui/LoginCard'

export default function MfaVerify() {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)
  const router = useRouter()

  async function submit(e) {
    e.preventDefault()
    const { error } = await supabaseBrowser.auth.mfa.verify({ factorType: 'totp', code })
    if (error) setMsg('Código inválido')
    else router.replace('/admin')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <LoginCard title="Confirme o 2FA">
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-border rounded-xl bg-card"
            placeholder="Código TOTP"
            value={code}
            onChange={(e)=>setCode(e.target.value)}
          />
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <button className="w-full py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90">Entrar</button>
        </form>
      </LoginCard>
    </main>
  )
}
