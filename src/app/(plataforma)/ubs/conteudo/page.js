"use client";
import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { BookOpen, Filter, PlusCircle, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";

const categorias = ["Pré-natal", "Pós-parto", "Vacinas", "Amamentação", "Nutrição", "Direitos"];
const statusOpts = ["rascunho", "publicado"];

export default function ConteudoPage() {
    const supabase = createClientComponentClient();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [cat, setCat] = useState("");
    const [status, setStatus] = useState("");

    // UBS atual (mock)
    const currentUBS = useMemo(() => ({ id: 1 }), []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                let query = supabase
                    .from("conteudo")
                    .select("id, titulo, categoria, alvo_semana_ini, alvo_semana_fim, status, created_at")
                    .eq("ubs_id", currentUBS.id)
                    .order("created_at", { ascending: false });
                if (q) query = query.ilike("titulo", `%${q}%`);
                if (cat) query = query.eq("categoria", cat);
                if (status) query = query.eq("status", status);
                const { data, error } = await query;
                if (error) throw error;
                if (mounted) setRows(data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => (mounted = false);
    }, [supabase, currentUBS.id, q, cat, status]);

    const toggleStatus = async (id, old) => {
        try {
            const novo = old === "publicado" ? "rascunho" : "publicado";
            const { error } = await supabase.from("conteudo").update({ status: novo }).eq("id", id);
            if (error) throw error;
            setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: novo } : r)));
        } catch (e) {
            alert("Falha ao alternar status");
            console.error(e);
        }
    };

    const excluir = async (id) => {
        if (!confirm("Excluir este conteúdo?")) return;
        try {
            const res = await fetch(`/api/ubs/conteudo/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
            setRows((prev) => prev.filter((r) => r.id !== id));
        } catch (e) {
            alert("Falha ao excluir");
            console.error(e);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Conteúdo</h1>
                    <p className="text-sm text-zinc-600">CMS simples para materiais validados por categoria e semanas-alvo.</p>
                </div>
                <a href="/(plataforma)/ubs/conteudo/novo" className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">
                    <PlusCircle className="h-4 w-4" /> Novo conteúdo
                </a>
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
                            <label className="text-xs text-zinc-600">Categoria</label>
                            <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm">
                                <option value="">Todas</option>
                                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-600">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm">
                                <option value="">Todos</option>
                                {statusOpts.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-50">
                            <tr className="text-left text-zinc-600">
                                <th className="p-3">Criado</th>
                                <th className="p-3">Título</th>
                                <th className="p-3">Categoria</th>
                                <th className="p-3">Semanas-alvo</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td className="p-3" colSpan={6}>Carregando...</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td className="p-3" colSpan={6}>Sem conteúdos.</td></tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={r.id} className="border-t border-zinc-100">
                                        <td className="p-3">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                                        <td className="p-3">{r.titulo}</td>
                                        <td className="p-3">{r.categoria}</td>
                                        <td className="p-3">{r.alvo_semana_ini ?? "—"}–{r.alvo_semana_fim ?? "—"}</td>
                                        <td className="p-3 capitalize">{r.status}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <a href={`/(plataforma)/ubs/conteudo/${r.id}`} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-50">
                                                    <Pencil className="h-4 w-4" /> Editar
                                                </a>
                                                <button onClick={() => toggleStatus(r.id, r.status)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-50">
                                                    {r.status === "publicado" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {r.status === "publicado" ? "Ocultar" : "Publicar"}
                                                </button>
                                                <button onClick={() => excluir(r.id)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-50 text-red-700">
                                                    <Trash2 className="h-4 w-4" /> Excluir
                                                </button>
                                            </div>
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