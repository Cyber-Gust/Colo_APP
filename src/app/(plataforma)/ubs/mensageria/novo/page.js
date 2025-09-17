"use client";
import { useMemo, useState } from "react";

export default function NovaCampanhaPage() {
  const currentUBS = useMemo(() => ({ id: 1 }), []);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [publico, setPublico] = useState("gestantes");
  const [agendar, setAgendar] = useState(false);
  const [dataHora, setDataHora] = useState("");

  const enviar = async () => {
    if (!titulo || !corpo) return alert("Preencha título e mensagem.");
    try {
      const res = await fetch("/api/ubs/mensageria/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ubs_id: currentUBS.id, titulo, corpo, publico_alvo: publico, agendar, data_hora: dataHora || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Campanha criada.");
      window.location.href = "/(plataforma)/ubs/mensageria";
    } catch (e) {
      alert("Falha ao criar campanha.");
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova campanha</h1>
        <p className="text-sm text-zinc-600">Defina título, público, mensagem e (opcional) agendamento.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
          <div>
            <label className="text-xs text-zinc-600">Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-zinc-600">Mensagem</label>
            <textarea value={corpo} onChange={(e) => setCorpo(e.target.value)} rows={8} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
          <div>
            <label className="text-xs text-zinc-600">Público</label>
            <select value={publico} onChange={(e) => setPublico(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
              <option value="gestantes">Gestantes</option>
              <option value="todas">Todas as pacientes</option>
              <option value="grupo-gestantes">Grupo de gestantes</option>
              <option value="sem-vacina-DTPa">Sem DTPa</option>
              <option value="pos-parto">Pós-parto</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="agendar" type="checkbox" checked={agendar} onChange={(e) => setAgendar(e.target.checked)} />
            <label htmlFor="agendar" className="text-sm">Agendar envio</label>
          </div>
          {agendar && (
            <div>
              <label className="text-xs text-zinc-600">Data/Hora (YYYY-MM-DD HH:MM)</label>
              <input value={dataHora} onChange={(e) => setDataHora(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
            </div>
          )}
          <button onClick={enviar} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">Salvar</button>
        </div>
      </div>
    </div>
  );
}