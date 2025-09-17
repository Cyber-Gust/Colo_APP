"use client";
import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Search, PlusCircle, ShieldAlert, User2, ArrowLeft, ArrowRight } from "lucide-react";

const PAGE_SIZE = 20;

export default function GestantesPage() {
  const supabase = createClientComponentClient();

  // TODO: substituir pelo seu contexto/claims (ubs_id do usuário logado)
  const currentUBS = useMemo(() => ({ id: "00000000-0000-0000-0000-000000000001" }), []); // UUID fictício

  const [q, setQ] = useState("");
  const [risco, setRisco] = useState("\u2713"); // "✓" = todas, "true", "false"
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const isDigits = (s) => /\d{3,}/.test((s||"").replace(/\D/g, ""));

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Base: busca gestantes por UBS com paginação
        let base = supabase
          .from("gestantes")
          .select("id, ubs_id, profile_id, cpf, cns_sus, prontuario, data_ultima_menstruacao, dpp_estimado, semana_gestacional_atual, risco_flag, created_at", { count: "exact" })
          .eq("ubs_id", currentUBS.id)
          .order("created_at", { ascending: false });

        // Filtro risco
        if (risco === "true") base = base.eq("risco_flag", true);
        if (risco === "false") base = base.eq("risco_flag", false);

        // Filtro de busca: se for dígitos ➜ CPF/Prontuário; senão ➜ nome (profiles)
        let profileFilterIds = null;
        if (q && q.trim().length >= 2) {
          if (isDigits(q)) {
            const token = `%${q.replace(/\D/g, "")}%`;
            base = base.or(`cpf.ilike.${token},prontuario.ilike.%${q}%`);
          } else {
            // Busca nos profiles da MESMA UBS pelo nome e usa IN nos gestantes.profile_id
            const { data: profs } = await supabase
              .from("profiles")
              .select("id")
              .eq("ubs_id", currentUBS.id)
              .ilike("nome", `%${q}%`)
              .limit(500);
            profileFilterIds = (profs || []).map((p) => p.id);
            if (profileFilterIds.length > 0) {
              base = base.in("profile_id", profileFilterIds);
            } else {
              // Nenhum nome encontrado ➜ retorna vazio rápido
              if (mounted) { setRows([]); setCount(0); setLoading(false); }
              return;
            }
          }
        }

        // Paginação
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error, count: total } = await base.range(from, to);
        if (error) throw error;

        // Enriquecer com nomes do profile e ACS (batch query, sem N+1)
        const profIds = Array.from(new Set((data || []).map(r => r.profile_id).filter(Boolean)));
        let profMap = {};
        if (profIds.length) {
          const { data: profs2 } = await supabase
            .from("profiles")
            .select("id, nome, telefone")
            .in("id", profIds);
          profMap = Object.fromEntries((profs2||[]).map(p => [p.id, p]));
        }

        const gestIds = Array.from(new Set((data || []).map(r => r.id)));
        let acsMap = {}; // gestante_id → [nomes ACS]
        if (gestIds.length) {
          const { data: vincs } = await supabase
            .from("vinculos_acs")
            .select("gestante_id, acs_profile_id")
            .in("gestante_id", gestIds);
          const acsIds = Array.from(new Set((vincs||[]).map(v => v.acs_profile_id)));
          let acsNameMap = {};
          if (acsIds.length) {
            const { data: acsProfiles } = await supabase
              .from("profiles")
              .select("id, nome")
              .in("id", acsIds);
            acsNameMap = Object.fromEntries((acsProfiles||[]).map(a => [a.id, a.nome]));
          }
          (vincs||[]).forEach(v => {
            acsMap[v.gestante_id] = acsMap[v.gestante_id] || [];
            acsMap[v.gestante_id].push(acsNameMap[v.acs_profile_id] || v.acs_profile_id);
          });
        }

        const enriched = (data||[]).map(r => ({
          ...r,
          profile: r.profile_id ? profMap[r.profile_id] || null : null,
          acs_list: acsMap[r.id] || [],
        }));

        if (mounted) { setRows(enriched); setCount(total||0); }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false };
  }, [supabase, currentUBS.id, q, risco, page]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestantes</h1>
          <p className="text-sm text-zinc-600">Lista completa, busca por CPF/Prontuário ou Nome, filtro de risco e paginação.</p>
        </div>
        <a href="/(plataforma)/ubs/gestantes/novo" className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">
          <PlusCircle className="h-4 w-4" /> Nova gestante
        </a>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2 flex items-center gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="Buscar por CPF, Prontuário ou Nome…" className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4e0a26]/20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-600">Risco</label>
          <select value={risco} onChange={(e)=>{ setPage(1); setRisco(e.target.value); }} className="rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm">
            <option value="\u2713">Todos</option>
            <option value="true">Apenas risco</option>
            <option value="false">Sem risco</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left text-zinc-600">
              <th className="p-3">Criado</th>
              <th className="p-3">Nome</th>
              <th className="p-3">CPF</th>
              <th className="p-3">CNS/Prontuário</th>
              <th className="p-3">DPP</th>
              <th className="p-3">Semana</th>
              <th className="p-3">ACS</th>
              <th className="p-3">Risco</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={8}>Carregando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3" colSpan={8}>Nenhuma gestante encontrada.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-zinc-100">
                  <td className="p-3">{fmtDate(r.created_at)}</td>
                  <td className="p-3">{r.profile?.nome || <span className="inline-flex items-center gap-1 text-zinc-500"><User2 className="h-4 w-4" /> Sem perfil</span>}</td>
                  <td className="p-3">{r.cpf || "—"}</td>
                  <td className="p-3">{r.cns_sus || r.prontuario || "—"}</td>
                  <td className="p-3">{fmtDate(r.dpp_estimado)}</td>
                  <td className="p-3">{r.semana_gestacional_atual ?? "—"}</td>
                  <td className="p-3 truncate max-w-[220px]" title={(r.acs_list||[]).join(", ")}>{(r.acs_list||[]).join(", ") || "—"}</td>
                  <td className="p-3">
                    {r.risco_flag ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-1 text-xs"><ShieldAlert className="h-3.5 w-3.5"/> Risco</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 text-zinc-700 px-2.5 py-1 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600">{count} registro(s)</div>
        <div className="flex items-center gap-2">
          <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))} className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 disabled:opacity-50"><ArrowLeft className="h-4 w-4"/> Anterior</button>
          <span className="text-sm">Página {page} de {totalPages}</span>
          <button disabled={page>=totalPages} onClick={() => setPage(p => p+1)} className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 disabled:opacity-50">Próxima <ArrowRight className="h-4 w-4"/></button>
        </div>
      </div>
    </div>
  );
}