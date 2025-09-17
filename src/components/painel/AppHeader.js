// File: /src/components/painel/AppHeader.js
"use client";
import { Menu } from "lucide-react";
import LogoMark from "@/components/painel/LogoMark";
import Badge from "@/components/ui/Badge";

export default function AppHeader({ user, onToggleSidebar, collapsed }) {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-zinc-200/70 bg-[#d8c8c8] backdrop-blur">
            <div className=" px-4 py-3 flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#642b43] active:scale-[0.98] transition"
                    aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3">
                    <LogoMark />
                    <div className="leading-tight">
                        <div className="font-semibold text-lg tracking-tight"> Painel UBS</div>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-4">
                    {user?.ubs && (
                        <Badge tone="neutral" className="hidden sm:inline-flex">{user.ubs}</Badge>
                    )}
                    
                    <div className="flex items-center gap-3">
                        <div className="text-right leading-tight hidden sm:block">
                            <div className="text-sm font-medium">{user?.name ?? "Usuário"}</div>
                            <div className="text-xs text-zinc-500">{user?.email ?? "email@dominio"}</div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-[#4e0a26]/10 text-[#4e0a26] grid place-items-center font-semibold">
                            {user?.name ? user.name.split(" ").map(p => p[0]).slice(0, 2).join("") : "UB"}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}