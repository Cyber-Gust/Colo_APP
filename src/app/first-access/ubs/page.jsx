'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseClient'

export default function FirstAccessUbs() {
  const router = useRouter()
  const [form, setForm] = useState({
    nome: '',
    municipio: '',
    cnes: '',
    telefone: '',
    email: '',
    admin_nome: '',
    admin_telefone: '',
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setErr(null); setLoading(true)
    try {
      const { data, error } = await supabaseBrowser.rpc('provisionar_ubs', {
        p_nome: form.nome,
        p_municipio: form.municipio,
        p_cnes: form.cnes || null,
        p_telefone: form.telefone || null,
        p_email: form.email || null,
        p_admin_nome: form.admin_nome || null,
        p_admin_telefone: form.admin_telefone || null,
      })
      if (error) throw error
      // provisionado → painel
      router.replace('/ubs/dashboard')
    } catch (e2) {
      setErr(e2?.message ?? 'Falha ao provisionar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-[#fefdfb] p-6">
      <div className="w-full max-w-xl bg-white border rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold">Configurar UBS — Primeiro Acesso</h1>
        <p className="text-sm text-zinc-600">
          Preencha os dados da UBS e do responsável. Você poderá editar depois.
        </p>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Nome da UBS</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.nome} onChange={e=>setForm(f=>({...f, nome:e.target.value}))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Município</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.municipio} onChange={e=>setForm(f=>({...f, municipio:e.target.value}))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">CNES (opcional)</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.cnes} onChange={e=>setForm(f=>({...f, cnes:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Telefone UBS (opcional)</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.telefone} onChange={e=>setForm(f=>({...f, telefone:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">E-mail UBS (opcional)</label>
            <input type="email" className="w-full border rounded-lg px-3 py-2"
              value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} />
          </div>

          <div className="md:col-span-2 pt-2">
            <h2 className="text-sm font-medium text-zinc-700">Responsável (ADM)</h2>
          </div>
          <div>
            <label className="block text-sm mb-1">Nome do ADM</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.admin_nome} onChange={e=>setForm(f=>({...f, admin_nome:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Telefone do ADM</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.admin_telefone} onChange={e=>setForm(f=>({...f, admin_telefone:e.target.value}))} />
          </div>

          {err && <p className="md:col-span-2 text-sm text-red-600">{err}</p>}

          <div className="md:col-span-2">
            <button disabled={loading}
              className="w-full rounded-lg bg-[#4e0a26] text-white py-2 disabled:opacity-60">
              {loading ? 'Salvando…' : 'Concluir e entrar no painel'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
