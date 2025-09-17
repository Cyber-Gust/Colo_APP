import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.json();
    const { ubs_id, titulo, corpo, publico_alvo, agendar = false, data_hora = null } = body || {};
    if (!ubs_id || !titulo || !corpo || !publico_alvo) return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Cria campanha
    const status = agendar ? "agendado" : "enviado";
    const { data: msg, error: msgErr } = await supabase
      .from("mensagens")
      .insert({ ubs_id, titulo, corpo, publico_alvo, status, enviados: 0 })
      .select("id")
      .single();
    if (msgErr) throw msgErr;

    const mensagem_id = msg.id;

    // Define público (exemplos simples; ajuste os filtros conforme suas views)
    let targetQuery = supabase.from("gestantes").select("id").eq("ubs_id", ubs_id);
    if (publico_alvo === "pos-parto") targetQuery = targetQuery.eq("status", "pos-parto");
    // TODO: criar filtros reais (sem-vacina-DTPa, grupo-gestantes, etc.)

    const { data: targets, error: tErr } = await targetQuery;
    if (tErr) throw tErr;

    if (agendar && data_hora) {
      // Apenas registra alvos; um CRON (Edge Function/Schedule) fará o envio em data_hora
      const rows = (targets || []).map((t) => ({ mensagem_id, gestante_id: t.id, status: "agendado" }));
      if (rows.length) {
        const { error } = await supabase.from("mensagens_alvos").insert(rows);
        if (error) throw error;
      }
    } else {
      // Disparo imediato (simulação: apenas grava alvos como "enviado")
      const rows = (targets || []).map((t) => ({ mensagem_id, gestante_id: t.id, status: "enviado", enviado_at: new Date().toISOString() }));
      if (rows.length) {
        const { error } = await supabase.from("mensagens_alvos").insert(rows);
        if (error) throw error;
      }
      await supabase.from("mensagens").update({ enviados: rows.length }).eq("id", mensagem_id);
    }

    return NextResponse.json({ ok: true, mensagem_id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
