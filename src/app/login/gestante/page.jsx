'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import LoginCard from '@/components/ui/LoginCard'
import { isValidCPF, isValidCNS, cpfAliasEmail, onlyDigits } from '@/lib/br-validators'
import { supabaseBrowser } from '@/lib/supabaseClient'

export default function GestanteLoginPage() {
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [sus, setSus] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState(null)
  const [isPending, startTransition] = useTransition()

  async function onSubmit(e) {
    e.preventDefault()
    setErr(null)
    const cpfOk = isValidCPF(cpf)
    const susOk = isValidCNS(sus) || onlyDigits(sus).length >= 6
    if (!cpfOk) return setErr('CPF inválido.')
    if (!susOk) return setErr('Informe um CNS válido (15 dígitos) ou o nº de prontuário.')

    const email = cpfAliasEmail(cpf)

    startTransition(async () => {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password: onlyDigits(sus),
      })
      if (error) return setErr('Não foi possível entrar. Verifique os dados.')

      const user = data.user
      const mustReset = user?.user_metadata?.must_reset === true
      if (mustReset) router.replace('/first-access')
      else router.replace('/app')
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <LoginCard title="Acesso Gestante">
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="\\d*"
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
              placeholder="Cartão SUS (CNS) ou Prontuário"
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

          <a href="/forgot" className="block text-center text-sm text-accent/90 hover:opacity-80">
            Esqueci minha senha
          </a>
        </form>
      </LoginCard>
    </main>
  )
}
