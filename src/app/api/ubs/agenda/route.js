import { NextResponse as NextResponse4 } from "next/server";
import { createClient as createClient4 } from "@supabase/supabase-js";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const ubs_id = Number(searchParams.get("ubs_id"));
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    if (!ubs_id || !start || !end) return NextResponse4.json({ error: "ubs_id, start, end obrigatórios" }, { status: 400 });

    const supabase = createClient4(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from("agenda")
      .select("*")
      .eq("ubs_id", ubs_id)
      .gte("data_hora", start)
      .lt("data_hora", end)
      .order("data_hora");
    if (error) throw error;

    return NextResponse4.json({ items: data || [] });
  } catch (err) {
    console.error(err);
    return NextResponse4.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { tipo, data_hora, local, ubs_id, gestante_id = null, status = "agendado" } = body || {};
    if (!tipo || !data_hora || !ubs_id) return NextResponse4.json({ error: "tipo, data_hora, ubs_id obrigatórios" }, { status: 400 });

    const supabase = createClient4(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.from("agenda").insert({ tipo, data_hora, local, ubs_id, gestante_id, status });
    if (error) throw error;

    return NextResponse4.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse4.json({ error: String(err.message || err) }, { status: 500 });
  }
}