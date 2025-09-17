"use client";
import { useEffect, useMemo, useState } from "react";

import { Activity, Bell, Syringe, CalendarCheck2, Users } from "lucide-react";

export default function RelatoriosPage() {
    const [loading, setLoading] = useState(false);
    const [range, setRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return { start: start.toISOString(), end: end.toISOString() };
    });
    const [data, setData] = useState({
        adesao: 0,
        faltas: 0,
        alertasAbertos: 0,
        coberturaDTPa: 0,
        gestantesAtivas: 0,
        tabelaAgenda: [],
        topAlertas: [],
    });

    const currentUBS = useMemo(() => ({ id: 1 }), []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/ubs/relatorios/overview?ubs_id=${currentUBS.id}&start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`);
                if (!res.ok) throw new Error(await res.text());
                const json = await res.json();
                if (mounted) setData(json);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => (mounted = false);
    }, [currentUBS.id, range.start, range.end]);

    const KPIS = [
        { label: "Adesão (%)", value: (data.adesao * 100).toFixed(0) + "%", icon: Activity },
        { label: "Faltas (30d)", value: data.faltas, icon: CalendarCheck2 },
        { label: "Alertas Abertos", value: data.alertasAbertos, icon: Bell },
        { label: "Cobertura DTPa", value: (data.coberturaDTPa * 100).toFixed(0) + "%", icon: Syringe },
        { label: "Gestantes Ativas", value: data.gestantesAtivas, icon: Users },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
                    <p className="text-sm text-zinc-600">Métricas: adesão, faltas, alertas, cobertura vacinal e visão da agenda.</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <input
                        type="datetime-local"
                        value={new Date(range.start).toISOString().slice(0, 16)}
                        onChange={(e) => setRange((r) => ({ ...r, start: new Date(e.target.value).toISOString() }))}
                        className="rounded-lg border border-zinc-200 px-2 py-2"
                    />
                    <span>—</span>
                    <input
                        type="datetime-local"
                        value={new Date(range.end).toISOString().slice(0, 16)}
                        onChange={(e) => setRange((r) => ({ ...r, end: new Date(e.target.value).toISOString() }))}
                        className="rounded-lg border border-zinc-200 px-2 py-2"
                    />
                </div>
            </div>

            {/* KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
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

            {/* Agenda por status */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <h2 className="text-base font-semibold">Agenda (últimos 30 dias)</h2>
                    <table className="w-full mt-3 text-sm">
                        <thead className="bg-zinc-50">
                            <tr className="text-left text-zinc-600">
                                <th className="p-2">Status</th>
                                <th className="p-2">Qtd</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.tabelaAgenda.map((r) => (
                                <tr key={r.status} className="border-t border-zinc-100">
                                    <td className="p-2 capitalize">{r.status}</td>
                                    <td className="p-2">{r.qtd}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <h2 className="text-base font-semibold">Alertas mais recentes</h2>
                    <ul className="mt-3 space-y-2 text-sm">
                        {data.topAlertas.map((a) => (
                            <li key={a.id} className="flex items-center justify-between rounded-xl border border-zinc-200 p-2.5">
                                <span className="text-zinc-700 capitalize">{a.severidade} • {a.status}</span>
                                <span className="text-xs text-zinc-500">{new Date(a.created_at).toLocaleString("pt-BR")}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
}
