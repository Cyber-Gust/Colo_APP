"use client";
import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Megaphone, PlusCircle, Send, Filter } from "lucide-react";

export default function MensageriaPage() {
    const supabase = createClientComponentClient();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState(""); // rascunho|agendado|enviado

    // UBS atual (mock → troque pelo seu contexto)
    const currentUBS = useMemo(() => ({ id: 1 }), []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                let query = supabase
                    .from("mensagens")
                    .select("id, titulo, corpo, publico_alvo, enviados, status, created_at")
                    .eq("ubs_id", currentUBS.id)
                    .order("created_at", { ascending: false });
                if (q) query = query.ilike("titulo", `%${q}%`);
                if (status) query = query.eq("status", status);
                const { data, error } = await query;
                if (error) throw error;
                if (mounted) setItems(data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => (mounted = false);
    }, [supabase, currentUBS.id, q, status]);

    const criarEnvioRapido = async () => {
        const titulo = prompt("Título da campanha (ex.: Campanha DTPa)");
        if (!titulo) return;
        const corpo = prompt("Mensagem (texto)");
        if (!corpo) return;
        const publico_alvo = prompt("Público-alvo (ex.: gestantes|todas|sem-vacina-DTPa|grupo-gestantes)") || "gestantes";
        try {
            const res = await fetch("/api/ubs/mensageria/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ubs_id: currentUBS.id, titulo, corpo, publico_alvo }),
            });
            if (!res.ok) throw new Error(await res.text());
            alert("Campanha criada e disparo iniciado (fila).");
            setQ("");
        } catch (e) {
            alert("Falha ao criar/disparar mensagem.");
            console.error(e);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Mensageria</h1>
                    <p className="text-sm text-zinc-600">Disparos manuais/automáticos para grupos ou perfis-alvo.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={criarEnvioRapido} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">
                        <PlusCircle className="h-4 w-4" /> Novo disparo rápido
                    </button>
                    <a href="/(plataforma)/ubs/mensageria/novo" className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">
                        <Megaphone className="h-4 w-4" /> Campanha avançada
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="text-xs font-medium uppercase text-zinc-500 flex items-center gap-2"><Filter className="h-4 w-4" /> Filtros</div>
                    <div className="mt-2 space-y-2">
                        <div>
                            <label className="text-xs text-zinc-600">Buscar</label>
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Título" className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-600">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm">
                                <option value="">Todos</option>
                                <option value="rascunho">Rascunho</option>
                                <option value="agendado">Agendado</option>
                                <option value="enviado">Enviado</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-50">
                            <tr className="text-left text-zinc-600">
                                <th className="p-3">Criada em</th>
                                <th className="p-3">Título</th>
                                <th className="p-3">Público</th>
                                <th className="p-3">Enviados</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td className="p-3" colSpan={6}>Carregando...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td className="p-3" colSpan={6}>Nenhuma campanha encontrada.</td></tr>
                            ) : (
                                items.map((m) => (
                                    <tr key={m.id} className="border-t border-zinc-100">
                                        <td className="p-3">{new Date(m.created_at).toLocaleString("pt-BR")}</td>
                                        <td className="p-3">{m.titulo}</td>
                                        <td className="p-3">{m.publico_alvo}</td>
                                        <td className="p-3">{m.enviados ?? 0}</td>
                                        <td className="p-3 capitalize">{m.status}</td>
                                        <td className="p-3">
                                            <a href={`/(plataforma)/ubs/mensageria/${m.id}`} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-50">
                                                <Send className="h-4 w-4" /> Detalhes
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}