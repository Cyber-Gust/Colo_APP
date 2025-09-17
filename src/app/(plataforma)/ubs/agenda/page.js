'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { CalendarDays, Filter, PlusCircle } from 'lucide-react'

const TIPOS = ['pré-natal', 'ultrassom', 'vacina', 'puericultura', 'pós-parto']

export default function AgendaPage() {
  const supabase = createClientComponentClient()

  const [refDate, setRefDate] = useState(() => new Date())
  const [agenda, setAgenda] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroACS, setFiltroACS] = useState('')
  const [filtroBairro, setFiltroBairro] = useState('')

  // semana corrente (seg a dom)
  const weekStart = useMemo(() => {
    const d = new Date(refDate)
    const day = d.getDay() // 0=dom
    const diff = (day === 0 ? -6 : 1) - day // volta até segunda
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }, [refDate])

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    return d
  }, [weekStart])

  // helper: formata data
  const fmt = (iso) =>
    new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  // helper: "YYYY-MM-DD HH:MM" → ISO local
  function toLocalISO(ymdHm) {
    const m = String(ymdHm || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/)
    if (!m) return null
    const [_, y, mo, d, h, mi] = m.map(Number)
    const dt = new Date(y, mo - 1, d, h, mi, 0)
    return dt.toISOString()
  }

  // busca agenda (com fallback se a view não existir)
  async function fetchAgenda() {
    setLoading(true)
    setErrorMsg('')
    try {
      let query = supabase
        .from('agenda_view') // preferencial: view com joins
        .select('id, tipo, data_hora, local, status, gestante_nome, acs_nome, bairro')
        .gte('data_hora', weekStart.toISOString())
        .lt('data_hora', weekEnd.toISOString())
        .order('data_hora')

      if (filtroTipo) query = query.eq('tipo', filtroTipo)
      if (filtroACS) query = query.ilike('acs_nome', `%${filtroACS}%`)
      if (filtroBairro) query = query.ilike('bairro', `%${filtroBairro}%`)

      let { data, error } = await query

      // Fallback: se a view não existir, usa tabela agenda (sem colunas extras)
      if (error) {
        const msg = (error?.message || '').toLowerCase()
        if (msg.includes('agenda_view') || msg.includes('relation') || msg.includes('does not exist')) {
          let q2 = supabase
            .from('agenda')
            .select('id, tipo, data_hora, local, status')
            .gte('data_hora', weekStart.toISOString())
            .lt('data_hora', weekEnd.toISOString())
            .order('data_hora')
          if (filtroTipo) q2 = q2.eq('tipo', filtroTipo)
          const f2 = await q2
          data = (f2.data || []).map((r) => ({
            ...r,
            gestante_nome: null,
            acs_nome: null,
            bairro: null,
          }))
          error = f2.error
        }
      }

      if (error) throw error
      setAgenda(data || [])
    } catch (_e) {
      setErrorMsg('Falha ao carregar a agenda.')
      setAgenda([])
    } finally {
      setLoading(false)
    }
  }

  // carrega ao mudar filtros/semana (com debounce p/ filtros de texto)
  const filtrosRef = useRef({ filtroACS, filtroBairro })
  useEffect(() => {
    filtrosRef.current = { filtroACS, filtroBairro }
  }, [filtroACS, filtroBairro])

  useEffect(() => {
    const t = setTimeout(fetchAgenda, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, weekEnd, filtroTipo, filtroACS, filtroBairro])

  const moverSemana = (delta) => {
    const d = new Date(refDate)
    d.setDate(d.getDate() + delta * 7)
    setRefDate(d)
  }

  async function criarItem() {
    const tipo = prompt(`Tipo (${TIPOS.join(', ')})`) || 'pré-natal'
    const data = prompt('Data e hora (YYYY-MM-DD HH:MM)')
    if (!data) return
    const iso = toLocalISO(data)
    if (!iso) { setErrorMsg('Formato de data inválido. Use YYYY-MM-DD HH:MM'); return }
    const local = prompt('Local (sala/UBS)') || 'UBS'
    const gestante_id = prompt('ID da gestante (opcional)') || null

    try {
      const res = await fetch('/api/ubs/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ❗ não enviar ubs_id — DB/Triggers preenchem via sessão
        body: JSON.stringify({ tipo, data_hora: iso, local, gestante_id }),
      })
      if (!res.ok) throw new Error(await res.text())
      // reload
      fetchAgenda()
    } catch (_e) {
      setErrorMsg('Erro ao criar item de agenda.')
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Agenda da UBS</h1>
          <p className="text-sm text-zinc-600">
            Criar/editar consultas, exames, vacinas e puericultura; filtros por equipe/ACS/bairro.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => moverSemana(-1)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            ◀ Semana
          </button>
          <button
            onClick={() => setRefDate(new Date())}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Hoje
          </button>
          <button
            onClick={() => moverSemana(1)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Semana ▶
          </button>
          <button
            onClick={criarItem}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            <PlusCircle className="h-4 w-4" /> Novo
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {/* Filtros */}
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs font-medium uppercase text-zinc-500 flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </div>
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-xs text-zinc-600">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm"
              >
                <option value="">Todos</option>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-600">ACS</label>
              <input
                value={filtroACS}
                onChange={(e) => setFiltroACS(e.target.value)}
                placeholder="Nome do ACS"
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Bairro</label>
              <input
                value={filtroBairro}
                onChange={(e) => setFiltroBairro(e.target.value)}
                placeholder="Bairro"
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 border-b border-zinc-100 p-3 text-sm text-zinc-600">
            <CalendarDays className="h-4 w-4" />
            Semana de {weekStart.toLocaleDateString('pt-BR')} a{' '}
            {new Date(weekEnd.getTime() - 86400000).toLocaleDateString('pt-BR')}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left text-zinc-600">
                <th className="p-3">Data/Hora</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Gestante</th>
                <th className="p-3">ACS</th>
                <th className="p-3">Bairro</th>
                <th className="p-3">Local</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3" colSpan={7}>
                    Carregando...
                  </td>
                </tr>
              ) : agenda.length === 0 ? (
                <tr>
                  <td className="p-3" colSpan={7}>
                    Sem itens nesta semana.
                  </td>
                </tr>
              ) : (
                agenda.map((ev) => (
                  <tr key={ev.id} className="border-t border-zinc-100">
                    <td className="p-3">{fmt(ev.data_hora)}</td>
                    <td className="p-3 capitalize">{ev.tipo}</td>
                    <td className="p-3">{ev.gestante_nome || '—'}</td>
                    <td className="p-3">{ev.acs_nome || '—'}</td>
                    <td className="p-3">{ev.bairro || '—'}</td>
                    <td className="p-3">{ev.local || '—'}</td>
                    <td className="p-3">{ev.status || 'agendado'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
