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