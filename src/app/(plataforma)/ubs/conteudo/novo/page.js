"use client";
import { useMemo, useState } from "react";

export default function NovoConteudoPage() {
    const currentUBS = useMemo(() => ({ id: 1, user_id: "00000000-0000-0000-0000-000000000000" }), []);
    const [titulo, setTitulo] = useState("");
    const [categoria, setCategoria] = useState("Pré-natal");
    const [corpo, setCorpo] = useState("");
    const [ini, setIni] = useState("");
    const [fim, setFim] = useState("");
    const [status, setStatus] = useState("rascunho");

    const salvar = async () => {
        if (!titulo || !corpo) return alert("Informe título e corpo.");
        try {
            const res = await fetch("/api/ubs/conteudo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ubs_id: currentUBS.id, titulo, corpo, categoria, alvo_semana_ini: ini || null, alvo_semana_fim: fim || null, status, criado_por: currentUBS.user_id }),
            });
            if (!res.ok) throw new Error(await res.text());
            alert("Conteúdo criado.");
            window.location.href = "/(plataforma)/ubs/conteudo";
        } catch (e) {
            alert("Falha ao salvar.");
            console.error(e);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Novo conteúdo</h1>
                <p className="text-sm text-zinc-600">Defina título, categoria, corpo e semanas de gestação alvo.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                    <div>
                        <label className="text-xs text-zinc-600">Título</label>
                        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-600">Corpo</label>
                        <textarea value={corpo} onChange={(e) => setCorpo(e.target.value)} rows={10} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
                    </div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                    <div>
                        <label className="text-xs text-zinc-600">Categoria</label>
                        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
                            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-zinc-600">Semana inicial</label>
                            <input value={ini} onChange={(e) => setIni(e.target.value)} placeholder="ex.: 12" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-600">Semana final</label>
                            <input value={fim} onChange={(e) => setFim(e.target.value)} placeholder="ex.: 20" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-600">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
                            {statusOpts.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button onClick={salvar} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">Salvar</button>
                </div>
            </div>
        </div>
    );
}