// src/app/api/auth/set/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req) {
  const { access_token, refresh_token } = await req.json()
  const res = NextResponse.json({ ok: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          res.cookies.set(name, value, options)
        },
        remove(name, options) {
          res.cookies.set(name, '', { ...options, maxAge: 0 })
        }
      }
    }
  )

  // grava os cookies httpOnly do Supabase no response
  await supabase.auth.setSession({ access_token, refresh_token })

  return res
}
