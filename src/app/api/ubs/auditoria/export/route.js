import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

function parseDates(from, to) {
  const f = from ? new Date(`${from}T00:00:00`) : null
  const t = to ? new Date(`${to}T23:59:59`) : null
  return { f, t }
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

async function findActorIdsByName(supabase, actorName) {
  if (!actorName) return null
  const { data } = await supabase
    .from('profiles')
    .select('id, nome')
    .ilike('nome', `%${actorName}%`)
    .limit(1000)
  return data?.map(d => d.id) ?? []
}

export async function GET(req) {
  const supabase = createSupabaseServer()
  const { searchParams } = new URL(req.url)

  const action = searchParams.get('acao') || ''
  const table = searchParams.get('tabela') || ''
  const from = searchParams.get('de') || ''
  const to = searchParams.get('ate') || ''
  const actorName = searchParams.get('ator') || ''
  const targetId = searchParams.get('alvo_id') || ''

  const actorIds = await findActorIdsByName(supabase, actorName)
  if (actorName && Array.isArray(actorIds) && actorIds.length === 0) {
    const empty = 'created_at,actor,acao,alvo_tabela,alvo_id,ip,payload\n'
    return new NextResponse(empty, { headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="auditoria.csv"'
    }})
  }

  let base = supabase
    .from('logs_auditoria')
    .select('id, created_at, acao, alvo_tabela, alvo_id, ip, payload, actor_profile_id')
    .order('created_at', { ascending: false })
    .limit(10000)

  base = applyLogFilters(base, { action, table, from, to, targetId, actorIds })

  const { data: rows, error } = await base
  if (error) return new NextResponse('Erro ao exportar', { status: 400 })

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

  const header = 'created_at,actor,acao,alvo_tabela,alvo_id,ip,payload\n'
  const lines = rows.map(r => {
    const actorNameCsv = (actorMap[r.actor_profile_id] ?? r.actor_profile_id ?? '').replaceAll('"', '""')
    const payloadStr = JSON.stringify(r.payload ?? {}).replaceAll('"', '""')
    return `"${r.created_at}","${actorNameCsv}","${r.acao}","${r.alvo_tabela}","${r.alvo_id || ''}","${r.ip || ''}","${payloadStr}"`
  })
  const csv = header + lines.join('\n')

  return new NextResponse(csv, { headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="auditoria.csv"'
  }})
}