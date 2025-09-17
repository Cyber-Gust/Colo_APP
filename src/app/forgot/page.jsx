'use client'
import { useState } from 'react'
import LoginCard from '@/components/ui/LoginCard'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setMsg(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/first-access`,
    })
    setMsg(error ? 'Não foi possível enviar o e-mail.' : 'Se existir uma conta, enviaremos instruções.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <LoginCard title="Redefinir senha">
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full px-4 py-2 border border-border rounded-xl bg-card"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {msg && <p className="text-sm">{msg}</p>}
          <button className="w-full py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90">Enviar</button>
        </form>
      </LoginCard>
    </main>
  )
}
