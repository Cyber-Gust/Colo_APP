import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.json();
    const { cpf, cns, nome, telefone = "", ubs_id } = body || {};
    if (!cpf || !cns || !nome || !ubs_id) return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Email sintético baseado no CPF (login por CPF no front fará o mapping para este email)
    const email = `${cpf}@colo.local`;
    const password = cns; // senha inicial = CNS/prontuário (forçar troca no 1º acesso)

    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: { cpf, role: "GESTANTE", ubs_id },
    });
    if (userErr) throw userErr;

    const userId = userData.user.id;

    // Cria profile
    const { error: profErr } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      nome,
      telefone,
      cpf,
      role: "GESTANTE",
      ubs_id,
      ativo: true,
    });
    if (profErr) throw profErr;

    // Cria registro gestante
    const { error: gesErr } = await supabaseAdmin.from("gestantes").insert({
      ubs_id,
      profile_id: userId,
      cpf,
      cns_sus: cns,
      prontuario: null,
    });
    if (gesErr) throw gesErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}