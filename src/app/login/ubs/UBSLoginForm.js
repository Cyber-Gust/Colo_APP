'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from  '@/lib/supabaseClient'
import LoginCard from '@/components/LoginCard'

export default function UBSLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState(null)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e) => {
    e.preventDefault()
    setErr(null)
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return setErr(error.message || 'Falha ao entrar. Verifique seus dados.')
      router.push('/ubs')
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <LoginCard title="Acesso UBS">
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            className="w-full px-4 py-2 border border-border rounded-xl bg-card"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="E-mail"
            autoComplete="username"
            required
          />

          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              placeholder="Senha"
              className="w-full px-4 py-2 pr-12 border border-border rounded-xl bg-card"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Senha"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-2 my-auto px-2 text-sm text-accent/90 hover:opacity-80"
              aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {show ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {err && <p className="text-red-600 text-sm">{err}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </LoginCard>
    </main>
  )
}
