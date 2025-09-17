import { NextResponse as R } from "next/server";
import { createClient as SB } from "@supabase/supabase-js";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const ubs_id = Number(searchParams.get("ubs_id"));
        const start = searchParams.get("start");
        const end = searchParams.get("end");
        if (!ubs_id || !start || !end) return R.json({ error: "ubs_id, start, end obrigatórios" }, { status: 400 });

        const sb = SB(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

        // Gestantes ativas
        const { count: gestantesAtivas } = await sb
            .from("gestantes")
            .select("id", { count: "exact", head: true })
            .eq("ubs_id", ubs_id)
            .eq("ativo", true);

        // Agenda no período
        const agendaStatus = ["agendado", "realizado", "faltou", "remarcado"];
        const tabelaAgenda = [];
        let totalAgendados = 0, totalRealizados = 0;
        for (const s of agendaStatus) {
            const { count } = await sb
                .from("agenda")
                .select("id", { count: "exact", head: true })
                .eq("ubs_id", ubs_id)
                .gte("data_hora", start)
                .lt("data_hora", end)
                .eq("status", s);
            tabelaAgenda.push({ status: s, qtd: count || 0 });
            if (s === "agendado" || s === "realizado" || s === "faltou" || s === "remarcado") totalAgendados += count || 0;
            if (s === "realizado") totalRealizados = count || 0;
        }

        // Adesão = realizados / (realizados + faltou)
        const faltasRec = tabelaAgenda.find((r) => r.status === "faltou")?.qtd || 0;
        const realizados = tabelaAgenda.find((r) => r.status === "realizado")?.qtd || 0;
        const adesao = (realizados + faltasRec) > 0 ? realizados / (realizados + faltasRec) : 0;

        // Alertas abertos (não resolvidos)
        const { count: alertasAbertos } = await sb
            .from("alertas")
            .select("id", { count: "exact", head: true })
            .eq("ubs_id", ubs_id)
            .neq("status", "resolvido")
            .gte("created_at", start)
            .lt("created_at", end);

        // Cobertura DTPa = gestantes com 1+ vacina DTPa / gestantes ativas
        let coberturaDTPa = 0;
        if ((gestantesAtivas || 0) > 0) {
            const { data: vac } = await sb
                .from("vacinas")
                .select("gestante_id")
                .eq("ubs_id", ubs_id)
                .eq("tipo", "DTPa")
                .gte("data", start)
                .lt("data", end);
            const unique = new Set((vac || []).map((v) => v.gestante_id));
            coberturaDTPa = unique.size / (gestantesAtivas || 1);
        }

        // Top alertas recentes (5)
        const { data: topAlertas } = await sb
            .from("alertas")
            .select("id, severidade, status, created_at")
            .eq("ubs_id", ubs_id)
            .order("created_at", { ascending: false })
            .limit(5);

        return R.json({
            adesao,
            faltas: faltasRec,
            alertasAbertos: alertasAbertos || 0,
            coberturaDTPa,
            gestantesAtivas: gestantesAtivas || 0,
            tabelaAgenda,
            topAlertas: topAlertas || [],
        });
    } catch (e) {
        console.error(e);
        return R.json({ error: String(e.message || e) }, { status: 500 });
    }
}
ß