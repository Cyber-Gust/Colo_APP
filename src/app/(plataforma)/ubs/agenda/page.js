"use client";
import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient as createClientAgenda } from "@supabase/auth-helpers-nextjs";
import { CalendarDays, Filter, PlusCircle } from "lucide-react";

const tipos = ["pré-natal", "ultrassom", "vacina", "puericultura", "pós-parto"];

export default function AgendaPage() {
  const supabase = createClientAgenda();

  const [refDate, setRefDate] = useState(() => new Date());
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroACS, setFiltroACS] = useState("");
  const [filtroBairro, setFiltroBairro] = useState("");

  // Mock UBS
  const currentUBS = useMemo(() => ({ id: 1 }), []);

  const weekStart = useMemo(() => {
    const d = new Date(refDate);
    const day = d.getDay(); // 0=dom
    const diff = (day === 0 ? -6 : 1) - day; // segunda-feira
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [refDate]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  useEffect(() => {
    let mounted = true;
    const fetchAgenda = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("agenda_view") // dica: view com join gestantes + bairro + acs
          .select("id, tipo, data_hora, local, status, gestante_nome, acs_nome, bairro")
          .eq("ubs_id", currentUBS.id)
          .gte("data_hora", weekStart.toISOString())
          .lt("data_hora", weekEnd.toISOString())
          .order("data_hora");

        if (filtroTipo) query = query.eq("tipo", filtroTipo);
        if (filtroACS) query = query.ilike("acs_nome", `%${filtroACS}%`);
        if (filtroBairro) query = query.ilike("bairro", `%${filtroBairro}%`);

        const { data, error } = await query;
        if (error) throw error;
        if (mounted) setAgenda(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgenda();
    return () => { mounted = false };
  }, [supabase, currentUBS.id, weekStart, weekEnd, filtroTipo, filtroACS, filtroBairro]);

  const moverSemana = (delta) => {
    const d = new Date(refDate);
    d.setDate(d.getDate() + delta * 7);
    setRefDate(d);
  };

  const criarItem = async () => {
    const tipo = prompt(`Tipo (${tipos.join(", ")})`) || "pré-natal";
    const data = prompt("Data (YYYY-MM-DD HH:MM)");
    if (!data) return;
    const local = prompt("Local (sala/UBS)") || "UBS";
    const gestante_id = prompt("ID da gestante (opcional)") || null;
    try {
      const res = await fetch("/api/ubs/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, data_hora: data, local, ubs_id: currentUBS.id, gestante_id }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Evento criado.");
      // força reload
      setRefDate(new Date(refDate));
    } catch (err) {
      alert("Erro ao criar agenda.");
      console.error(err);
    }
  };

  const fmt = (iso) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda da UBS</h1>
          <p className="text-sm text-zinc-600">Criar/editar consultas, exames, vacinas e puericultura; filtros por equipe/ACS/bairro.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => moverSemana(-1)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">◀ Semana</button>
          <button onClick={() => setRefDate(new Date())} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">Hoje</button>
          <button onClick={() => moverSemana(1)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">Semana ▶</button>
          <button onClick={criarItem} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">
            <PlusCircle className="h-4 w-4" /> Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs font-medium uppercase text-zinc-500 flex items-center gap-2"><Filter className="h-4 w-4" /> Filtros</div>
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-xs text-zinc-600">Tipo</label>
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm">
                <option value="">Todos</option>
                {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-600">ACS</label>
              <input value={filtroACS} onChange={(e) => setFiltroACS(e.target.value)} placeholder="Nome do ACS" className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Bairro</label>
              <input value={filtroBairro} onChange={(e) => setFiltroBairro(e.target.value)} placeholder="Bairro" className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 border-b border-zinc-100 p-3 text-sm text-zinc-600">
            <CalendarDays className="h-4 w-4" /> Semana de {weekStart.toLocaleDateString("pt-BR")} a {new Date(weekEnd.getTime()-86400000).toLocaleDateString("pt-BR")}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left text-zinc-600">
                <th className="p-3">Data/Hora</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Gestante</th>
                <th className="p-3">ACS</th>
                <th className="p-3">Bairro</th>
                <th className="p-3">Local</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-3" colSpan={7}>Carregando...</td></tr>
              ) : agenda.length === 0 ? (
                <tr><td className="p-3" colSpan={7}>Sem itens nesta semana.</td></tr>
              ) : (
                agenda.map((ev) => (
                  <tr key={ev.id} className="border-t border-zinc-100">
                    <td className="p-3">{fmt(ev.data_hora)}</td>
                    <td className="p-3 capitalize">{ev.tipo}</td>
                    <td className="p-3">{ev.gestante_nome || "—"}</td>
                    <td className="p-3">{ev.acs_nome || "—"}</td>
                    <td className="p-3">{ev.bairro || "—"}</td>
                    <td className="p-3">{ev.local || "—"}</td>
                    <td className="p-3">{ev.status || "agendado"}</td>
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