"use client";
import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { BellRing, PhoneCall, Share2, Filter } from "lucide-react";

const severidades = ["crítico", "alto", "moderado", "baixo"]; // sugerido
const statusOpts = ["novo", "em_atendimento", "resolvido"];

export default function AlertasPage() {
  const supabase = createClientComponentClient();
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sev, setSev] = useState("");
  const [stat, setStat] = useState("novo");

  // UBS atual (mock)
  const currentUBS = useMemo(() => ({ id: 1 }), []);

  // Carrega e assina Realtime
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("alertas_view") // dica: join com gestantes + profiles (responsável) + bairro
          .select("id, created_at, tipo, severidade, mensagem, status, gestante_nome, bairro, responsavel_nome")
          .eq("ubs_id", currentUBS.id)
          .order("created_at", { ascending: false });
        if (sev) query = query.eq("severidade", sev);
        if (stat) query = query.eq("status", stat);
        const { data, error } = await query;
        if (error) throw error;
        if (mounted) setItens(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel("alertas-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alertas", filter: `ubs_id=eq.${currentUBS.id}` },
        (payload) => {
          setItens((prev) => [{ ...payload.new, gestante_nome: payload.new.gestante_nome }, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "alertas", filter: `ubs_id=eq.${currentUBS.id}` },
        (payload) => {
          setItens((prev) => prev.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r)));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUBS.id, sev, stat]);

  const marcarContato = async (id) => {
    try {
      const res = await fetch(`/api/ubs/alertas/${id}/contato`, { method: "PATCH" });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      alert("Falha ao marcar contato.");
      console.error(e);
    }
  };

  const encaminhar = async (id) => {
    const responsavel_profile_id = prompt("Profile ID do responsável (enfermeiro/médico)");
    if (!responsavel_profile_id) return;
    try {
      const res = await fetch(`/api/ubs/alertas/${id}/encaminhar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsavel_profile_id }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Alerta encaminhado.");
    } catch (e) {
      alert("Falha ao encaminhar.");
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alertas</h1>
          <p className="text-sm text-zinc-600">Fila de relatos críticos em tempo real (Realtime).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs font-medium uppercase text-zinc-500 flex items-center gap-2"><Filter className="h-4 w-4" /> Filtros</div>
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-xs text-zinc-600">Severidade</label>
              <select value={sev} onChange={(e) => setSev(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm">
                <option value="">Todas</option>
                {severidades.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-600">Status</label>
              <select value={stat} onChange={(e) => setStat(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm">
                {statusOpts.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left text-zinc-600">
                <th className="p-3">Recebido</th>
                <th className="p-3">Gestante</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Severidade</th>
                <th className="p-3">Mensagem</th>
                <th className="p-3">Responsável</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-3" colSpan={7}>Carregando...</td></tr>
              ) : itens.length === 0 ? (
                <tr><td className="p-3" colSpan={7}>Sem alertas para esse filtro.</td></tr>
              ) : (
                itens.map((a) => (
                  <tr key={a.id} className="border-t border-zinc-100">
                    <td className="p-3">{new Date(a.created_at).toLocaleString("pt-BR")}</td>
                    <td className="p-3">{a.gestante_nome || "—"}{a.bairro ? ` • ${a.bairro}` : ""}</td>
                    <td className="p-3 capitalize">{a.tipo}</td>
                    <td className="p-3 capitalize">{a.severidade}</td>
                    <td className="p-3 max-w-[320px] truncate" title={a.mensagem}>{a.mensagem}</td>
                    <td className="p-3">{a.responsavel_nome || "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => marcarContato(a.id)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-50">
                          <PhoneCall className="h-4 w-4" /> Marcar contato
                        </button>
                        <button onClick={() => encaminhar(a.id)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-50">
                          <Share2 className="h-4 w-4" /> Encaminhar
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
