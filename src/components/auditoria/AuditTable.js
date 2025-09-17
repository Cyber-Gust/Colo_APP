'use client'
import { useState } from 'react'

function Paginator({ page, totalPages, baseQuery }) {
    function go(p) { window.location.href = `/(plataforma)/ubs/auditoria?${new URLSearchParams(baseQuery + `&page=${p}`).toString()}` }
    return (
        <div className="flex items-center justify-between text-sm mt-4">
            <div className="text-zinc-500">Página {page} de {totalPages}</div>
            <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => go(page - 1)} className="rounded-xl border px-3 py-1 disabled:opacity-50">Anterior</button>
                <button disabled={page >= totalPages} onClick={() => go(page + 1)} className="rounded-xl border px-3 py-1 disabled:opacity-50">Próxima</button>
            </div>
        </div>
    )
}

function PayloadModal({ open, onClose, payload }) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
            <div className="max-w-3xl w-full rounded-2xl bg-white p-4 border" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Payload</h3>
                    <button onClick={onClose} className="rounded-lg border px-2 py-1 text-sm">Fechar</button>
                </div>
                <pre className="text-xs overflow-auto max-h-[60vh] p-3 bg-zinc-50 rounded-xl border">
                    {JSON.stringify(payload, null, 2)}
                </pre>
            </div>
        </div>
    )
}

export default function AuditTable({ rows, actorMap, page, totalPages, baseQuery }) {
    const [open, setOpen] = useState(false)
    const [payload, setPayload] = useState(null)
    function showPayload(p) { setPayload(p); setOpen(true) }

    if (!rows?.length) {
        return <div className="rounded-2xl border bg-white p-8 text-center text-zinc-500">Nenhum resultado encontrado.</div>
    }

    return (
        <>
            <div className="overflow-x-auto rounded-2xl border bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-zinc-50">
                        <tr className="text-left text-zinc-600">
                            <th className="px-4 py-3">Quando</th>
                            <th className="px-4 py-3">Ator</th>
                            <th className="px-4 py-3">Ação</th>
                            <th className="px-4 py-3">Tabela</th>
                            <th className="px-4 py-3">Alvo ID</th>
                            <th className="px-4 py-3">IP</th>
                            <th className="px-4 py-3">Payload</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => {
                            const actorName = r.actor_profile_id ? (actorMap[r.actor_profile_id] ?? r.actor_profile_id) : '—'
                            const when = new Date(r.created_at).toLocaleString('pt-BR')
                            return (
                                <tr key={r.id} className="border-t">
                                    <td className="px-4 py-3 whitespace-nowrap">{when}</td>
                                    <td className="px-4 py-3">{actorName}</td>
                                    <td className="px-4 py-3">{r.acao}</td>
                                    <td className="px-4 py-3">{r.alvo_tabela}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{r.alvo_id || '—'}</td>
                                    <td className="px-4 py-3">{r.ip || '—'}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => showPayload(r.payload)} className="rounded-lg border px-3 py-1 hover:bg-zinc-50">Ver</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <Paginator page={page} totalPages={totalPages} baseQuery={baseQuery} />
            <PayloadModal open={open} onClose={() => setOpen(false)} payload={payload} />
        </>
    )
}
