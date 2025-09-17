// File: /src/components/painel/AppShell.js
"use client";
import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/painel/AppHeader";
import AppSidebar from "@/components/painel/AppSidebar";
import AppFooter from "@/components/painel/AppFooter";

export default function AppShell({ children }) {
    // Persiste preferencia da sidebar no localStorage
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("colo.sidebar.collapsed");
        if (saved !== null) setCollapsed(saved === "1");
    }, []);

    const toggleSidebar = () => {
        setCollapsed((c) => {
            const next = !c;
            localStorage.setItem("colo.sidebar.collapsed", next ? "1" : "0");
            return next;
        });
    };

    // Exemplo de usuário logado — Substitua pelo hook real de auth Supabase
    // Dica: use `useEffect` + `createClientComponentClient` ou um contexto que você já tenha
    const user = useMemo(
        () => ({
            name: "Enf. Juliana Souza",
            email: "juliana.souza@ubs.gov.br",
            role: "UBS_ADMIN",
            ubs: "UBS São João del-Rei",
        }),
        []
    );

    return (
        <div className="min-h-dvh bg-[#fefdfb] text-zinc-900 flex flex-col">
            {/* Header fixo no topo */}
            <AppHeader user={user} onToggleSidebar={toggleSidebar} collapsed={collapsed} />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <AppSidebar collapsed={collapsed} onToggle={toggleSidebar} />

                {/* Conteúdo principal */}
                <main className="flex-1 overflow-auto">
                    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>

            {/* Footer */}
            <AppFooter />
        </div>
    );
}