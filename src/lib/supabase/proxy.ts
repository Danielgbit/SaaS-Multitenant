import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/../types/supabase'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: No ejecutar código entre createServerClient y supabase.auth.getUser()
  // Un error simple puede causar que los usuarios sean deslogueados aleatoriamente.

  // CRÍTICO: No usar supabase.auth.getSession() aquí — no es seguro (usa localStorage).
  // Siempre usar getUser() para verificar autenticación en el servidor.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register')

  // Usuario no autenticado intentando acceder a rutas protegidas → redirigir a login
  if (!user && !isAuthRoute && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Usuario autenticado intentando acceder a rutas de auth → redirigir al calendario
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/calendar'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
