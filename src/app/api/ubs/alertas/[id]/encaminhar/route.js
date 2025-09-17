import { NextResponse as NR2 } from "next/server";
import { createClient as CC2 } from "@supabase/supabase-js";

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { responsavel_profile_id } = body || {};
    if (!responsavel_profile_id) return NR2.json({ error: "responsavel_profile_id é obrigatório" }, { status: 400 });

    const supabase = CC2(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase
      .from("alertas")
      .update({ status: "em_atendimento", responsavel_profile_id })
      .eq("id", id);
    if (error) throw error;

    return NR2.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NR2.json({ error: String(e.message || e) }, { status: 500 });
  }
}