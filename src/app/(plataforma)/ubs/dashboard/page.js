// File: /src/app/(plataforma)/ubs/dashboard/page.js
"use client";
import { Activity, Bell, CalendarCheck2, Syringe } from "lucide-react";

export default function DashboardHome() {
    // Cards de exemplo — depois substitua por dados reais do Supabase via RLS
    const KPIS = [
        { label: "Gestantes Ativas", value: 128, icon: Activity },
        { label: "Consultas na Semana", value: 54, icon: CalendarCheck2 },
        { label: "Alertas Pendentes", value: 7, icon: Bell },
        { label: "Doses de Vacina (mês)", value: 213, icon: Syringe },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Visão Geral</h1>
                <p className="text-sm text-zinc-600">Métricas rápidas da UBS e atalhos úteis</p>
            </div>

            {/* KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {KPIS.map((k) => {
                    const Icon = k.icon;
                    return (
                        <div key={k.label} className="rounded-2xl border border-zinc-200 bg-white p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-[#4e0a26]/10 grid place-items-center">
                                    <Icon className="h-5 w-5 text-[#4e0a26]" />
                                </div>
                                <div className="ml-auto text-2xl font-semibold">{k.value}</div>
                            </div>
                            <div className="mt-2 text-sm text-zinc-600">{k.label}</div>
                        </div>
                    );
                })}
            </section>

            {/* Tarefas rápidas / atalhos */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <h2 className="text-base font-semibold">Ações Rápidas</h2>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {[
                            { label: "Nova Gestante", href: "/(plataforma)/ubs/gestantes/nova" },
                            { label: "Agendar Consulta", href: "/(plataforma)/ubs/agenda/novo" },
                            { label: "Disparar Mensagem", href: "/(plataforma)/ubs/mensageria/novo" },
                            { label: "Registrar Alerta", href: "/(plataforma)/ubs/alertas/novo" },
                        ].map((a) => (
                            <a
                                key={a.label}
                                href={a.href}
                                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 active:scale-[0.99]"
                            >
                                {a.label}
                            </a>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <h2 className="text-base font-semibold">Próximos Compromissos</h2>
                    <ul className="mt-3 space-y-2 text-sm">
                        {[
                            { data: "16/09 14:30", nome: "Ana Paula (Pré-natal)" },
                            { data: "17/09 09:00", nome: "Marina (Ultrassom)" },
                            { data: "17/09 13:30", nome: "Carla (DTPa)" },
                        ].map((ev, i) => (
                            <li key={i} className="flex items-center justify-between rounded-xl border border-zinc-200 p-2.5">
                                <span className="text-zinc-700">{ev.nome}</span>
                                <span className="text-xs text-zinc-500">{ev.data}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
}