import { NextResponse as NextResponse2 } from "next/server";
import { createClient as createClient2 } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.json();
    const { nome, cpf, email, telefone = "", ubs_id } = body || {};
    if (!nome || !cpf || !email || !ubs_id) return NextResponse2.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });

    const supabaseAdmin = createClient2(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Gera senha temporária simples (oriente a trocar no primeiro acesso)
    const tempPass = `Acs#${cpf.slice(-4)}`;

    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: tempPass,
      user_metadata: { cpf, role: "ACS", ubs_id },
    });
    if (userErr) throw userErr;

    const userId = userData.user.id;

    const { error: profErr } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      nome,
      telefone,
      cpf,
      role: "ACS",
      ubs_id,
      ativo: true,
    });
    if (profErr) throw profErr;

    return NextResponse2.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse2.json({ error: String(err.message || err) }, { status: 500 });
  }
}