'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
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

  // Decide o destino com base no profile
  async function routeByProfile(userId, prefer = null) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, ubs_id, onboarding_done, ativo')
      .eq('id', userId)
      .single()

    const isUbsRole = ['UBS_ADMIN', 'UBS_STAFF', 'ACS'].includes(profile?.role)

    if (!profile?.ativo) {
      setErrorMsg('Seu perfil está inativo. Fale com o administrador.')
      return
    }

    // Admin sem UBS provisionada → wizard de primeiro acesso
    if (profile?.role === 'UBS_ADMIN' && !profile?.ubs_id && !profile?.onboarding_done) {
      router.replace('/first-access/ubs')
      return
    }

    // Perfis UBS com UBS vinculada → painel
    if (isUbsRole && profile?.ubs_id) {
      router.replace(prefer || redirectTo)
      return
    }

    // Outros perfis (ex.: GESTANTE) → fluxo próprio
    router.replace('/first-access')
  }

  // Se já houver sessão, pula o login e decide rota
  useEffect(() => {
    let on = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!on || !session) return
      await routeByProfile(session.user.id, redirectTo)
    })()
    return () => { on = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectTo])

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

      // must_reset opcional via user_metadata
      const mustReset = data.user?.user_metadata?.must_reset === true
      if (mustReset) {
        router.replace('/first-access')
        return
      }

      // (opcional) MFA TOTP
      if (data?.session?.mfa?.factor_type === 'totp') {
        router.replace('/mfa')
        return
      }

      // Decide rota conforme profile/UBS
      await routeByProfile(data.user.id, redirectTo)
    } catch (err) {
      setErrorMsg(err?.message || 'Erro inesperado no login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#fefdfb] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Image src="/brand/logo.png" width={72} height={72} alt="Colo" />
          <h1 className="text-xl font-semibold">Acesso UBS</h1>
        </div>

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
