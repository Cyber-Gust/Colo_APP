import { NextResponse } from 'next/server'
import { supabaseServer } from '@/src/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function hash(valor) {
  return crypto.createHash('sha256').update(valor).digest('hex')
}

export async function POST(req) {
  const body = await req.json()
  const { cpf, susOuProntuario, nome, dataNascimento } = body || {}

  if (!cpf || !susOuProntuario) {
    return NextResponse.json({ error: 'cpf e susOuProntuario são obrigatórios' }, { status: 400 })
  }

  // sessão e papel
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'não autenticado' }, { status: 401 })

  const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (!prof || prof.role !== 'UBS') {
    return NextResponse.json({ error: 'apenas UBS' }, { status: 403 })
  }

  // client admin (service role) - server only
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const cpfDigits = String(cpf).replace(/\D/g, '')
  const emailTecnico = `${cpfDigits}@gestante.local`

  const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
    email: emailTecnico,
    password: String(susOuProntuario),
    email_confirm: true,
    user_metadata: { cpf: cpfDigits }
  })
  if (createErr) {
    return NextResponse.json({ error: createErr.message }, { status: 400 })
  }

  await admin.from('profiles').insert({ id: createdUser.user.id, role: 'GESTANTE' })
  await admin.from('gestantes').insert({
    cpf: cpfDigits,
    sus_ou_prontuario: hash(String(susOuProntuario)),
    user_id: createdUser.user.id,
    nome: nome ?? null,
    data_nascimento: dataNascimento ?? null
  })

  return NextResponse.json({ ok: true })
}
