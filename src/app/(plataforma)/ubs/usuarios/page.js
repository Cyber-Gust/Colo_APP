'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Link2, ToggleLeft, ToggleRight, Search, UserPlus, Stethoscope, RotateCcw } from 'lucide-react'

export default function UsuariosPage() {
  const supabase = createClientComponentClient()

  // estado UI
  const [tab, setTab] = useState('gestantes') // 'gestantes' | 'acs'
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // debounce simples p/ busca
  const qRef = useRef(q)
  useEffect(() => { qRef.current = q }, [q])

  async function fetchRows() {
    setLoading(true)
    setErrorMsg('')
    try {
      if (tab === 'gestantes') {
        // View com join em profiles; RLS limita por UBS automaticamente
        const { data, error } = await supabase
          .from('gestantes_view')
          .select('id, cpf, cns_sus, prontuario, profile_id, nome, telefone, ativo')
          .ilike('nome', `%${qRef.current}%`)
          .order('nome', { ascending: true })
        if (error) throw error
        setRows(data || [])
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nome, telefone, cpf, role, ativo')
          .eq('role', 'ACS')
          .ilike('nome', `%${qRef.current}%`)
          .order('nome', { ascending: true })
        if (error) throw error
        setRows(data || [])
      }
    } catch (_e) {
      setErrorMsg('Falha ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  // carrega na troca de aba + debounce 300ms para busca
  useEffect(() => {
    const t = setTimeout(fetchRows, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q])

  // alterna ativo no profile (gestante usa profile_id)
  async function handleAtivarToggle(row) {
    try {
      const profileId = tab === 'gestantes' ? row.profile_id : row.id
      const { error } = await supabase.from('profiles').update({ ativo: !row.ativo }).eq('id', profileId)
      if (error) throw error
      setRows(prev =>
        prev.map(r => ((tab === 'gestantes' ? r.profile_id : r.id) === profileId ? { ...r, ativo: !r.ativo } : r)),
      )
    } catch (_e) {
      setErrorMsg('Falha ao alternar status.')
    }
  }

  // ações
  async function provisionarGestante() {
    const cpf = prompt('CPF da gestante (somente dígitos)')?.replace(/\D/g, '')
    if (!cpf) return
    const cns = prompt('CNS do SUS OU Nº de prontuário (usado como senha inicial)')
    if (!cns) return
    const nome = prompt('Nome completo da gestante')
    if (!nome) return
    const telefone = prompt('Telefone (opcional)') || ''
    try {
      const res = await fetch('/api/ubs/usuarios/provisionar-gestante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ❗ não enviar ubs_id — server/DB preenche via sessão (current_ubs_id)
        body: JSON.stringify({ cpf, cns, nome, telefone }),
      })
      if (!res.ok) throw new Error(await res.text())
      alert('Gestante provisionada com sucesso.')
      setQ('')
      fetchRows()
    } catch (_e) {
      setErrorMsg('Erro ao provisionar gestante.')
    }
  }

  async function provisionarACS() {
    const nome = prompt('Nome completo do ACS')
    if (!nome) return
    const cpf = prompt('CPF do ACS (somente dígitos)')?.replace(/\D/g, '')
    if (!cpf) return
    const email = prompt('E-mail institucional do ACS')
    if (!email) return
    const telefone = prompt('Telefone (opcional)') || ''
    try {
      const res = await fetch('/api/ubs/usuarios/provisionar-acs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ❗ não enviar ubs_id — será herdado da sessão
        body: JSON.stringify({ nome, cpf, email, telefone }),
      })
      if (!res.ok) throw new Error(await res.text())
      alert('ACS provisionado com sucesso.')
      setTab('acs')
      setQ('')
      fetchRows()
    } catch (_e) {
      setErrorMsg('Erro ao provisionar ACS.')
    }
  }

  async function vincularACS() {
    const acs_profile_id = prompt('ID do profile do ACS (copie da listagem de ACS)')
    if (!acs_profile_id) return
    const gestante_id = prompt('ID da gestante (copie da listagem de Gestantes)')
    if (!gestante_id) return
    try {
      const res = await fetch('/api/ubs/usuarios/vinculo-acs-gestante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acs_profile_id, gestante_id }),
      })
      if (!res.ok) throw new Error(await res.text())
      alert('Vínculo criado com sucesso.')
    } catch (_e) {
      setErrorMsg('Erro ao criar vínculo.')
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Gestão de Usuários</h1>
          <p className="text-sm text-zinc-600">Criar gestantes, criar ACS, vincular ACS↔gestante, ativar/desativar.</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'gestantes' ? (
            <button
              onClick={provisionarGestante}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              disabled={loading}
            >
              <UserPlus className="h-4 w-4" /> Nova Gestante
            </button>
          ) : (
            <button
              onClick={provisionarACS}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              disabled={loading}
            >
              <Stethoscope className="h-4 w-4" /> Novo ACS
            </button>
          )}
          <button
            onClick={vincularACS}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            <Link2 className="h-4 w-4" /> Vincular ACS↔Gestante
          </button>
          <button
            onClick={fetchRows}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
            disabled={loading}
            title="Recarregar"
          >
            <RotateCcw className="h-4 w-4" />
            Recarregar
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{errorMsg}</div>
      )}

      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-xl border border-zinc-200 overflow-hidden">
          <button
            onClick={() => setTab('gestantes')}
            className={`px-3 py-2 text-sm ${tab === 'gestantes' ? 'bg-[#4e0a26]/10 text-[#4e0a26]' : 'bg-white'}`}
          >
            Gestantes
          </button>
          <button
            onClick={() => setTab('acs')}
            className={`px-3 py-2 text-sm ${tab === 'acs' ? 'bg-[#4e0a26]/10 text-[#4e0a26]' : 'bg-white'}`}
          >
            ACS
          </button>
        </div>
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4e0a26]/30"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left text-zinc-600">
              {tab === 'gestantes' ? (
                <>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nome</th>
                  <th className="p-3">CPF</th>
                  <th className="p-3">CNS/Prontuário</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Ações</th>
                </>
              ) : (
                <>
                  <th className="p-3">Profile ID</th>
                  <th className="p-3">Nome</th>
                  <th className="p-3">CPF</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Ações</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={7}>
                  Carregando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={7}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={tab === 'gestantes' ? row.id : row.id} className="border-t border-zinc-100">
                  {tab === 'gestantes' ? (
                    <>
                      <td className="p-3 align-top">{row.id}</td>
                      <td className="p-3 align-top">{row.nome}</td>
                      <td className="p-3 align-top">{row.cpf}</td>
                      <td className="p-3 align-top">{row.cns_sus || row.prontuario || '—'}</td>
                      <td className="p-3 align-top">{row.telefone || '—'}</td>
                      <td className="p-3 align-top">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                            row.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {row.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3 align-top">
                        <button
                          onClick={() => handleAtivarToggle(row)}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-50"
                        >
                          {row.ativo ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />} Alternar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 align-top">{row.id}</td>
                      <td className="p-3 align-top">{row.nome}</td>
                      <td className="p-3 align-top">{row.cpf || '—'}</td>
                      <td className="p-3 align-top">{row.telefone || '—'}</td>
                      <td className="p-3 align-top">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                            row.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {row.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3 align-top">
                        <button
                          onClick={() => handleAtivarToggle(row)}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-50"
                        >
                          {row.ativo ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />} Alternar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
