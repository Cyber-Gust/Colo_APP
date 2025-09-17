"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  MessageSquare,
  BellRing,
  BookOpen,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
// se seu client exporta supabaseBrowser, troque a linha abaixo.
import { supabase } from "@/lib/supabaseClient";

const NAV = [
  { href: "/ubs/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/ubs/usuarios",   label: "Usuários",   icon: Users },
  { href: "/ubs/gestantes",  label: "Gestantes",  icon: Stethoscope },
  { href: "/ubs/agenda",     label: "Agenda",     icon: CalendarDays },
  { href: "/ubs/mensageria", label: "Mensageria", icon: MessageSquare },
  { href: "/ubs/alertas",    label: "Alertas",    icon: BellRing },
  { href: "/ubs/conteudo",   label: "Conteúdo",   icon: BookOpen },
  { href: "/ubs/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/ubs/auditoria",  label: "Auditoria",  icon: ShieldCheck },
];

export default function AppSidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      // limpa sessão no client (localStorage)
      await supabase?.auth?.signOut?.();
      // limpa cookies httpOnly no server
      await fetch("/api/auth/signout", { method: "POST" });
    } catch (_) { /* noop */ }
    router.replace("/login/ubs");
  }

  return (
    <aside
      className={`${collapsed ? "w-[56px]" : "w-[180px]"} ml-1 h-dvh sticky top-0 shrink-0 border-r border-zinc-200/70 bg-white transition-[width] duration-200 ease-out overflow-hidden flex flex-col`}
    >
      <nav className="flex-1 py-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mx-2 my-1 flex items-center gap-3 rounded-xl border transition p-2.5 hover:bg-zinc-50 active:scale-[0.99] ${
                active ? "border-[#4e0a26]/30 bg-[#4e0a26]/5" : "border-transparent"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`h-[20px] w-[20px] ${active ? "text-[#4e0a26]" : "text-zinc-700"}`} />
              {!collapsed && (
                <span className={`text-sm ${active ? "text-[#4e0a26] font-medium" : "text-zinc-800"}`}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pb-32 p-2 border-t border-zinc-200/70 space-y-2">
        <button
          onClick={handleSignOut}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 hover:bg-red-50 text-red-700"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
