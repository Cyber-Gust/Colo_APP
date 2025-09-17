"use client";
import { useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

function addDays(date, days){ const d = new Date(date); d.setDate(d.getDate()+days); return d; }
function weeksBetween(start){ if(!start) return null; const ms = Date.now() - new Date(start).getTime(); return Math.floor(ms / (1000*60*60*24*7)); }

export default function NovaGestantePage(){
  const supabase = createClientComponentClient();
  // TODO: substituir pelo contexto real
  const currentUBS = useMemo(() => ({ id: "00000000-0000-0000-0000-000000000001" }), []);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cns, setCns] = useState("");
  const [prontuario, setProntuario] = useState("");
  const [dum, setDum] = useState(""); // data_ultima_menstruacao
  const [dpp, setDpp] = useState("");
  const [semana, setSemana] = useState("");
  const [risco, setRisco] = useState(false);
  const [criarConta, setCriarConta] = useState(true);
  const [saving, setSaving] = useState(false);

  const recomputa = (dumStr) => {
    if (!dumStr) { setSemana(""); setDpp(""); return; }
    const dppLocal = addDays(dumStr, 280);
    setDpp(dppLocal.toISOString().slice(0,10));
    setSemana(String(weeksBetween(dumStr)));
  };

  const salvar = async () => {
    if (criarConta && (!nome || !cpf || !(cns || prontuario))) return alert("Preencha Nome, CPF e CNS/Prontuário.");
    if (!criarConta && (!cpf && !prontuario && !cns)) return alert("Informe ao menos CPF ou CNS/Prontuário.");

    setSaving(true);
    try {
      let gestanteId = null;
      let profileId = null;

      if (criarConta) {
        // Usa a rota de provisionamento (já criada por você)
        const res = await fetch("/api/ubs/usuarios/provisionar-gestante", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: cpf?.replace(/\D/g, ""), cns: cns || prontuario, nome, telefone, ubs_id: currentUBS.id }),
        });
        if (!res.ok) throw new Error(await res.text());
        // Recuperar a gestante recém-criada pelo CPF
        const { data: gRow } = await supabase
          .from("gestantes")
          .select("id, profile_id")
          .eq("ubs_id", currentUBS.id)
          .eq("cpf", cpf?.replace(/\D/g, ""))
          .single();
        if (gRow) { gestanteId = gRow.id; profileId = gRow.profile_id; }
      }

      // Se não criou conta (ou para completar campos), insere/atualiza tabela gestantes
      if (!criarConta) {
        const payload = {
          ubs_id: currentUBS.id,
          cpf: cpf ? cpf.replace(/\D/g, "") : null,
          cns_sus: cns || null,
          prontuario: prontuario || null,
          data_ultima_menstruacao: dum || null,
          dpp_estimado: dpp || null,
          semana_gestacional_atual: semana ? Number(semana) : null,
          risco_flag: !!risco,
        };
        const { data, error } = await supabase.from("gestantes").insert(payload).select("id").single();
        if (error) throw error;
        gestanteId = data.id;
      } else {
        // atualizar campos obstétricos caso tenha criado via provisionamento
        const updates = {
          data_ultima_menstruacao: dum || null,
          dpp_estimado: dpp || null,
          semana_gestacional_atual: semana ? Number(semana) : null,
          risco_flag: !!risco,
          prontuario: prontuario || null,
          cns_sus: cns || null,
        };
        if (gestanteId) {
          const { error: upErr } = await supabase.from("gestantes").update(updates).eq("id", gestanteId);
          if (upErr) throw upErr;
        }
        // opcional: atualizar profile com nome/telefone padronizado
        if (profileId && nome) {
          await supabase.from("profiles").update({ nome, telefone: telefone || null }).eq("id", profileId);
        }
      }

      alert("Gestante salva com sucesso.");
      window.location.href = "/(plataforma)/ubs/gestantes";
    } catch (e) {
      console.error(e);
      alert("Falha ao salvar gestante.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova gestante</h1>
        <p className="text-sm text-zinc-600">Cadastre os dados básicos e, se desejar, crie a conta de acesso com CPF/CNS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input id="criarConta" type="checkbox" checked={criarConta} onChange={(e)=>setCriarConta(e.target.checked)} />
            <label htmlFor="criarConta" className="text-sm">Criar conta de acesso (auth + profile)</label>
          </div>

          {criarConta && (
            <>
              <div>
                <label className="text-xs text-zinc-600">Nome completo</label>
                <input value={nome} onChange={(e)=>setNome(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-600">Telefone</label>
                  <input value={telefone} onChange={(e)=>setTelefone(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-600">CPF</label>
                  <input value={cpf} onChange={(e)=>setCpf(e.target.value)} placeholder="apenas números" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
                </div>
              </div>
            </>
          )}

          {!criarConta && (
            <div>
              <label className="text-xs text-zinc-600">CPF (opcional se tiver Prontuário/CNS)</label>
              <input value={cpf} onChange={(e)=>setCpf(e.target.value)} placeholder="apenas números" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-600">CNS do SUS</label>
              <input value={cns} onChange={(e)=>setCns(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Prontuário</label>
              <input value={prontuario} onChange={(e)=>setProntuario(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2 mt-5">
                <input id="risco" type="checkbox" checked={risco} onChange={(e)=>setRisco(e.target.checked)} />
                <label htmlFor="risco" className="text-sm">Marcar como risco</label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-600">DUM (YYYY-MM-DD)</label>
              <input type="date" value={dum} onChange={(e)=>{ setDum(e.target.value); recomputa(e.target.value); }} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-600">DPP estimado</label>
              <input type="date" value={dpp} onChange={(e)=>setDpp(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-600">Semana gestacional</label>
              <input value={semana} onChange={(e)=>setSemana(e.target.value)} placeholder="calculada pela DUM" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
          <div className="text-sm text-zinc-700">Revisão</div>
          <ul className="text-sm text-zinc-600 space-y-1">
            <li><b>UBS:</b> {currentUBS.id}</li>
            <li><b>CPF:</b> {cpf || "—"}</li>
            <li><b>CNS/Prontuário:</b> {cns || prontuario || "—"}</li>
            <li><b>DUM:</b> {dum || "—"}</li>
            <li><b>DPP:</b> {dpp || "—"}</li>
            <li><b>Semana:</b> {semana || "—"}</li>
            <li><b>Risco:</b> {risco ? "Sim" : "Não"}</li>
          </ul>
          <button disabled={saving} onClick={salvar} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50">{saving?"Salvando…":"Salvar"}</button>
          <a href="/(plataforma)/ubs/gestantes" className="block text-center text-sm text-[#4e0a26] hover:underline">Cancelar</a>
        </div>
      </div>
    </div>
  );
}