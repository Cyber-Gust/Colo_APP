'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginCard from '@/components/ui/LoginCard'
import { supabaseBrowser } from '@/lib/supabaseClient'

function strong(p) {
  return p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p)
}

export default function FirstAccess() {
  const router = useRouter()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [err, setErr] = useState(null)
  const [ok, setOk] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setErr(null); setOk(null)
    if (p1 !== p2) return setErr('As senhas não coincidem.')
    if (!strong(p1)) return setErr('Use 8+ caracteres, maiúscula, minúscula e número.')

    const { data: { user } } = await supabaseBrowser.auth.getUser()
    if (!user) return setErr('Sessão expirada.')

    const { error } = await supabaseBrowser.auth.updateUser({
      password: p1,
      data: { ...user.user_metadata, must_reset: false },
    })
    if (error) return setErr('Falha ao atualizar a senha.')
    setOk('Senha atualizada com sucesso!')
    const role = user.user_metadata?.role
    router.replace(role && role.startsWith('UBS_') ? '/admin' : '/app')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <LoginCard title="Primeiro acesso — Defina uma nova senha">
        <form onSubmit={submit} className="space-y-4">
          <input type="password" placeholder="Nova senha" className="w-full px-4 py-2 border border-border rounded-xl bg-card" value={p1} onChange={(e) => setP1(e.target.value)} required />
          <input type="password" placeholder="Repita a nova senha" className="w-full px-4 py-2 border border-border rounded-xl bg-card" value={p2} onChange={(e) => setP2(e.target.value)} required />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          {ok && <p className="text-green-600 text-sm">{ok}</p>}
          <button className="w-full py-2 rounded-xl bg-accent text-white font-medium hover:opacity-90">Salvar</button>
        </form>
      </LoginCard>
    </main>
  )
}
