'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LoginCard from '@/components/LoginCard'

const onlyDigits = (v) => String(v || '').replace(/\D/g, '')
const isCPF = (cpf) => onlyDigits(cpf).length === 11

export default function GestanteLoginForm() {
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [sus, setSus] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState(null)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e) => {
    e.preventDefault()
    setErr(null)

    if (!isCPF(cpf)) {
      setErr('Informe um CPF válido (11 dígitos).')
      return
    }
    if (!sus) {
      setErr('Informe o Cartão SUS ou número de prontuário.')
      return
    }

    startTransition(async () => {
      const emailTecnico = `${onlyDigits(cpf)}@gestante.local`
      const { error } = await supabase.auth.signInWithPassword({
        email: emailTecnico,
        password: String(sus),
      })
      if (error) return setErr(error.message || 'Falha ao entrar. Verifique seus dados.')
      router.push('/gestante')
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <LoginCard title="Acesso Gestante">
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            placeholder="CPF"
            className="w-full px-4 py-2 border border-border rounded-xl bg-card"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            aria-label="CPF"
            autoComplete="username"
            required
          />

          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              placeholder="Cartão SUS ou Prontuário"
              className="w-full px-4 py-2 pr-20 border border-border rounded-xl bg-card"
              value={sus}
              onChange={(e) => setSus(e.target.value)}
              aria-label="Cartão SUS ou Prontuário"
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
