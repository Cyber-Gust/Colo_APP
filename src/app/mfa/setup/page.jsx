'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import LoginCard from '@/components/ui/LoginCard'

export default function MfaSetup() {
  const [uri, setUri] = useState(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error) setMsg('Falha ao iniciar TOTP')
      else setUri(data?.totp?.uri || null)
    })()
  }, [])

  async function verify(e) {
    e.preventDefault()
    const { error } = await supabase.auth.mfa.verify({ factorType: 'totp', code })
    setMsg(error ? 'Código inválido' : 'TOTP ativado!')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <LoginCard title="Ativar 2FA (TOTP)">
        {uri && (
          <img
            alt="QR"
            className="mx-auto mb-4"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(uri)}`}
          />
        )}
        <form onSubmit={verify} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-border rounded-xl bg-card"
            placeholder="Código do app autenticador"
            value={code}
            onChange={(e)=>setCode(e.target.value)}
          />
          {msg && <p className="text-sm">{msg}</p>}
          <button className="w-full py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90">Confirmar</button>
        </form>
      </LoginCard>
    </main>
  )
}
