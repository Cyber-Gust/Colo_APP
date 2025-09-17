import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
    try {
        const body = await req.json();
        const { ubs_id, titulo, corpo, categoria, alvo_semana_ini, alvo_semana_fim, status = "rascunho", criado_por } = body || {};
        if (!ubs_id || !titulo || !corpo || !categoria) return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { error } = await sb.from("conteudo").insert({ ubs_id, titulo, corpo, categoria, alvo_semana_ini, alvo_semana_fim, status, criado_por });
        if (error) throw error;
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
    }
}