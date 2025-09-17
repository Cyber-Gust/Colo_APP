import { NextResponse as NextResponse3 } from "next/server";
import { createClient as createClient3 } from "@supabase/supabase-js";

export async function POST(req) {
    try {
        const body = await req.json();
        const { acs_profile_id, gestante_id } = body || {};
        if (!acs_profile_id || !gestante_id) return NextResponse3.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });

        const supabaseAdmin = createClient3(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

        const { error } = await supabaseAdmin.from("vinculos_acs").insert({
            acs_profile_id,
            gestante_id,
            desde: new Date().toISOString(),
        });
        if (error) throw error;

        return NextResponse3.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse3.json({ error: String(err.message || err) }, { status: 500 });
    }
}