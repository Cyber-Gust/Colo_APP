import { supabaseServer } from '@/src/lib/supabaseServer'

export default async function UBSDashboardLayout({ children }) {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  // você pode também buscar profile aqui se quiser
  return <div>{children}</div>
}
