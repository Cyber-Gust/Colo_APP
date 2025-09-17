// File: /src/app/(plataforma)/ubs/layout.js
import AppShell from "@/components/painel/AppShell";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const metadata = { title: "Colo — Painel UBS" };

export default async function UbsLayout({ children }) {
  const supabase = createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login/ubs?redirectTo=/ubs/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, ubs_id, onboarding_done, ativo')
    .eq('id', session.user.id)
    .single();

  const isUbsRole = ['UBS_ADMIN','UBS_STAFF','ACS'].includes(profile?.role);
  if (!profile?.ativo) redirect('/login/ubs');

  // Se ainda não provisionou, manda para o wizard
  if (profile?.role === 'UBS_ADMIN' && !profile?.ubs_id && !profile?.onboarding_done) {
    redirect('/first-access/ubs');
  }

  // Só entra no painel se tiver ubs_id
  if (!isUbsRole || !profile?.ubs_id) {
    redirect('/login/ubs');
  }

  return <AppShell>{children}</AppShell>;
}
