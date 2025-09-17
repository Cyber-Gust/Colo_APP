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
