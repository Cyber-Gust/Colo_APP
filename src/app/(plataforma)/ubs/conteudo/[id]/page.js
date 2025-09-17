"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function EditarConteudoPage() {
    const params = useParams();
    const id = params.id;
    const supabase = createClientComponentClient();
    const currentUBS = useMemo(() => ({ id: 1 }), []);

    const [loading, setLoading] = useState(true);
    const [titulo, setTitulo] = useState("");
    const [categoria, setCategoria] = useState("Pré-natal");
    const [corpo, setCorpo] = useState("");
    const [ini, setIni] = useState("");
    const [fim, setFim] = useState("");
    const [status, setStatus] = useState("rascunho");

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("conteudo")
                    .select("titulo, categoria, corpo, alvo_semana_ini, alvo_semana_fim, status, ubs_id")
                    .eq("id", id)
                    .single();
                if (error) throw error;
                if (data.ubs_id !== currentUBS.id) throw new Error("Sem permissão");
                if (mounted) {
                    setTitulo(data.titulo);
                    setCategoria(data.categoria);
                    setCorpo(data.corpo);
                    setIni(data.alvo_semana_ini ?? "");
                    setFim(data.alvo_semana_fim ?? "");
                    setStatus(data.status);
                }
            } catch (e) {
                console.error(e);
                alert("Falha ao carregar conteúdo");
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => (mounted = false);
    }, [supabase, id, currentUBS.id]);

    const salvar = async () => {
        try {
            const res = await fetch(`/api/ubs/conteudo/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ titulo, corpo, categoria, alvo_semana_ini: ini || null, alvo_semana_fim: fim || null, status }),
            });
            if (!res.ok) throw new Error(await res.text());
            alert("Salvo.");
            window.location.href = "/(plataforma)/ubs/conteudo";
        } catch (e) {
            alert("Falha ao salvar");
            console.error(e);
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Editar conteúdo</h1>
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
                            <input value={ini} onChange={(e) => setIni(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-600">Semana final</label>
                            <input value={fim} onChange={(e) => setFim(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
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