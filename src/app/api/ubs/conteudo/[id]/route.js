import { NextResponse as NR } from "next/server";
import { createClient as CC } from "@supabase/supabase-js";

export async function PATCH(req, { params }) {
    try {
        const id = params.id;
        const body = await req.json();
        const { titulo, corpo, categoria, alvo_semana_ini, alvo_semana_fim, status } = body || {};
        const sb = CC(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { error } = await sb.from("conteudo").update({ titulo, corpo, categoria, alvo_semana_ini, alvo_semana_fim, status, updated_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
        return NR.json({ ok: true });
    } catch (e) {
        console.error(e);
        return NR.json({ error: String(e.message || e) }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const id = params.id;
        const sb = CC(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { error } = await sb.from("conteudo").delete().eq("id", id);
        if (error) throw error;
        return NR.json({ ok: true });
    } catch (e) {
        console.error(e);
        return NR.json({ error: String(e.message || e) }, { status: 500 });
    }
}
