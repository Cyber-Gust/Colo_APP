'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

// Se seu client exporta "supabaseBrowser", troque a linha abaixo:
// import { supabaseBrowser as supabase } from '@/lib/supabaseClient'
import { supabase } from '@/lib/supabaseClient'

import LoginCard from '@/components/ui/LoginCard'

export default function UbsLoginPage() {
  const router = useRouter()
  const search = useSearchParams()

  const fallback = '/ubs/dashboard'
  const redirectTo = search.get('redirectTo') || fallback

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [show, setShow] = useState(false)

  // Se já houver sessão no client, tenta ir pro painel;
  // com o bridge abaixo, o middleware já deve aceitar.
  useEffect(() => {
    let on = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!on || !session) return
      router.replace(redirectTo)
    })()
    return () => { on = false }
  }, [router, redirectTo])

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrorMsg(error.message || 'Falha no login.')
        return
      }

      const session = data?.session
      if (!session?.access_token || !session?.refresh_token) {
        setErrorMsg('Sessão inválida. Tente novamente.')
        return
      }

      // 🔑 PASSO CRÍTICO: grava sessão no servidor (cookies httpOnly)
      const resp = await fetch('/api/auth/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      })
      if (!resp.ok) {
        setErrorMsg('Não consegui estabelecer a sessão no servidor.')
        return
      }

      // (opcional) must_reset / MFA
      const mustReset = data.user?.user_metadata?.must_reset === true
      if (mustReset) { router.replace('/first-access'); return }
      if (session?.mfa?.factor_type === 'totp') { router.replace('/mfa'); return }

      // Agora o middleware/layout conseguem ver a sessão e decidir:
      // - se Admin sem UBS → /first-access/ubs
      // - senão → /ubs/dashboard (ou o redirectTo original)
      router.replace(redirectTo)
    } catch (err) {
      setErrorMsg(err?.message || 'Erro inesperado no login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#fefdfb] p-4">
      <div className="w-full max-w-md space-y-6">
        <LoginCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <input
                type="email"
                className="w-full rounded-lg border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ubs@exemplo.com"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Senha</label>
              <div className="flex gap-2">
                <input
                  type={show ? 'text' : 'password'}
                  className="w-full rounded-lg border px-3 py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="rounded-lg border px-3"
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4e0a26] text-white px-4 py-2 disabled:opacity-60"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>

            <a
              href="/forgot"
              className="block text-center text-sm text-[#4e0a26]/90 hover:opacity-80"
            >
              Esqueci minha senha
            </a>
          </form>
        </LoginCard>
      </div>
    </div>
  )
}
