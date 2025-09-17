import { createSupabaseServer } from '@/lib/supabaseServer'
import AuditFilters from '@/components/auditoria/AuditFilters'
import AuditTable from '@/components/auditoria/AuditTable'

const PAGE_SIZE = 20

function parseDates(from, to) {
    const f = from ? new Date(`${from}T00:00:00`) : null
    const t = to ? new Date(`${to}T23:59:59`) : null
    return { f, t }
}

async function findActorIdsByName(supabase, actorName) {
    if (!actorName) return null
    const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .ilike('nome', `%${actorName}%`)
        .limit(1000)
    if (error) return null
    return data?.map(d => d.id) ?? []
}

function applyLogFilters(query, { action, table, from, to, targetId, actorIds }) {
    if (action) query = query.eq('acao', action)
    if (table) query = query.eq('alvo_tabela', table)
    if (targetId) query = query.eq('alvo_id', targetId)
    const { f, t } = parseDates(from, to)
    if (f) query = query.gte('created_at', f.toISOString())
    if (t) query = query.lte('created_at', t.toISOString())
    if (Array.isArray(actorIds) && actorIds.length > 0) query = query.in('actor_profile_id', actorIds)
    return query
}

export default async function Page({ searchParams }) {
    const supabase = createSupabaseServer()

    const page = Number(searchParams.page ?? 1)
    const action = searchParams.acao ?? ''
    const table = searchParams.tabela ?? ''
    const from = searchParams.de ?? ''
    const to = searchParams.ate ?? ''
    const targetId = searchParams.alvo_id ?? ''
    const actorName = searchParams.ator ?? ''

    const actorIds = await findActorIdsByName(supabase, actorName)
    if (actorName && Array.isArray(actorIds) && actorIds.length === 0) {
        return (
            <div className="p-6 space-y-6">
                <header className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>
                    <a className="pointer-events-none opacity-50 inline-flex items-center rounded-xl border px-3 py-2 text-sm">Exportar CSV</a>
                </header>
                <AuditFilters initialValues={{ acao: action, tabela: table, de: from, ate: to, ator: actorName, alvo_id: targetId }} />
                <div className="rounded-2xl border bg-white p-8 text-center text-zinc-500">Nenhum resultado para os filtros informados.</div>
            </div>
        )
    }

    const fromIdx = (page - 1) * PAGE_SIZE
    const toIdx = fromIdx + PAGE_SIZE - 1

    let base = supabase
        .from('logs_auditoria')
        .select('id, created_at, acao, alvo_tabela, alvo_id, ip, payload, actor_profile_id', { count: 'exact' })
        .order('created_at', { ascending: false })

    base = applyLogFilters(base, { action, table, from, to, targetId, actorIds })

    const { data: rows, error, count } = await base.range(fromIdx, toIdx)
    if (error) {
        return (
            <div className="p-6 space-y-4">
                <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>
                <div className="rounded-xl border bg-white p-6 text-sm text-red-700">
                    Não foi possível carregar os logs de auditoria (verifique permissões).<br />
                    Detalhe: {error.message}
                </div>
            </div>
        )
    }

    const actorSet = Array.from(new Set(rows.map(r => r.actor_profile_id).filter(Boolean)))
    let actorMap = {}
    if (actorSet.length) {
        const { data: actors } = await supabase
            .from('profiles')
            .select('id, nome')
            .in('id', actorSet)
            .limit(actorSet.length)
        actorMap = Object.fromEntries((actors ?? []).map(a => [a.id, a.nome ?? '']))
    }

    const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
    const queryString = new URLSearchParams({
        ...(action ? { acao: action } : {}),
        ...(table ? { tabela: table } : {}),
        ...(from ? { de: from } : {}),
        ...(to ? { ate: to } : {}),
        ...(actorName ? { ator: actorName } : {}),
        ...(targetId ? { alvo_id: targetId } : {}),
    }).toString()

    return (
        <div className="p-6 space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>
                <a href={`/api/ubs/auditoria/export?${queryString}`} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-50">
                    Exportar CSV
                </a>
            </header>

            <AuditFilters initialValues={{ acao: action, tabela: table, de: from, ate: to, ator: actorName, alvo_id: targetId }} />

            <AuditTable rows={rows} actorMap={actorMap} page={page} totalPages={totalPages} baseQuery={queryString} />
        </div>
    )
}

// =====================================================
// 2) Componente — /src/components/auditoria/AuditFilters.js (client)
// =====================================================
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TABLES = ['', 'profiles', 'gestantes', 'gestacoes', 'vinculos_acs', 'agenda', 'vacinas', 'exames', 'conteudo', 'mensagens', 'alertas']
const ACTIONS = ['', 'INSERT', 'UPDATE', 'DELETE']

export default function AuditFilters({ initialValues = {} }) {
    const [acao, setAcao] = useState(initialValues.acao ?? '')
    const [tabela, setTabela] = useState(initialValues.tabela ?? '')
    const [de, setDe] = useState(initialValues.de ?? '')
    const [ate, setAte] = useState(initialValues.ate ?? '')
    const [ator, setAtor] = useState(initialValues.ator ?? '')
    const [alvoId, setAlvoId] = useState(initialValues.alvo_id ?? '')
    const router = useRouter()

    function submit(e) {
        e.preventDefault()
        const q = new URLSearchParams()
        if (acao) q.set('acao', acao)
        if (tabela) q.set('tabela', tabela)
        if (de) q.set('de', de)
        if (ate) q.set('ate', ate)
        if (ator) q.set('ator', ator)
        if (alvoId) q.set('alvo_id', alvoId)
        q.set('page', '1')
        router.push(`/((plataforma))/ubs/auditoria?${q.toString()}`.replace('/((plataforma))', '(plataforma)'))
    }

    function clearAll() { router.push('/(plataforma)/ubs/auditoria') }

    return (
        <form onSubmit={submit} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                    <label className="block text-xs text-zinc-600 mb-1">Ação</label>
                    <select value={acao} onChange={e => setAcao(e.target.value)} className="w-full rounded-xl border px-3 py-2">
                        {ACTIONS.map(a => <option key={a} value={a}>{a || 'Todas'}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs text-zinc-600 mb-1">Tabela</label>
                    <select value={tabela} onChange={e => setTabela(e.target.value)} className="w-full rounded-xl border px-3 py-2">
                        {TABLES.map(t => <option key={t} value={t}>{t || 'Todas'}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-zinc-600 mb-1">De</label>
                    <input type="date" value={de} onChange={e => setDe(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
                </div>
                <div>
                    <label className="block text-xs text-zinc-600 mb-1">Até</label>
                    <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs text-zinc-600 mb-1">Ator (nome)</label>
                    <input value={ator} onChange={e => setAtor(e.target.value)} placeholder="Ex.: Ana, João..." className="w-full rounded-xl border px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs text-zinc-600 mb-1">Alvo ID (UUID)</label>
                    <input value={alvoId} onChange={e => setAlvoId(e.target.value)} placeholder="UUID" className="w-full rounded-xl border px-3 py-2" />
                </div>
                <div className="md:col-span-2 flex items-end gap-2">
                    <button type="submit" className="rounded-xl bg-[#4e0a26] text-white px-4 py-2">Filtrar</button>
                    <button type="button" onClick={clearAll} className="rounded-xl border px-4 py-2">Limpar</button>
                </div>
            </div>
        </form>
    )
}