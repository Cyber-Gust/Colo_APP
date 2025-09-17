import { NextResponse as NR1 } from "next/server";
import { createClient as CC1 } from "@supabase/supabase-js";

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const supabase = CC1(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase
      .from("alertas")
      .update({ status: "em_atendimento", contato_realizado_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return NR1.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NR1.json({ error: String(e.message || e) }, { status: 500 });
  }
}
