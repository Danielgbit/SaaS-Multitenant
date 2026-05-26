import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/../types/supabase'

const RESTRICTED_FOR_STAFF_EMPLEADO = [
  '/payroll', '/employees', '/whatsapp', '/email', '/settings', '/billing',
] as const

const RESTRICTED_FOR_EMPLEADO = [
  '/clients', '/services', '/inventory',
] as const

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hostname = request.nextUrl.hostname

  if (pathname.startsWith('/api/cron/') || pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/invite')

  const isPublicRoute =
    pathname.startsWith('/confirmar') ||
    pathname.startsWith('/help') ||
    pathname.startsWith('/reservar')

  if (!user && !isAuthRoute && !isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/calendar'
    return NextResponse.redirect(url)
  }

  if (!user) {
    return supabaseResponse
  }

  const BYPASS_SUBSCRIPTION_CHECK =
    process.env.BYPASS_SUBSCRIPTION_CHECK === 'true' && hostname === 'localhost'

  const BYPASS_ADMIN_AUTH =
    process.env.BYPASS_ADMIN_AUTH === 'true' && hostname === 'localhost'

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role, organization_id')
    .eq('user_id', user.id)
    .single()

  const role = orgMember?.role
  const isStaff = role === 'staff'
  const isEmpleado = role === 'empleado'

  if (pathname.startsWith('/admin')) {
    if (!BYPASS_ADMIN_AUTH && role !== 'owner_saas') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  if (isEmpleado && pathname.startsWith('/payroll') && !pathname.startsWith('/payroll/mi')) {
    const url = request.nextUrl.clone()
    url.pathname = '/payroll/mi'
    return NextResponse.redirect(url)
  }

  if (isEmpleado && pathname === '/dashboard' || (pathname === '/' && isEmpleado)) {
    const url = request.nextUrl.clone()
    url.pathname = '/mi'
    return NextResponse.redirect(url)
  }

  if (isStaff || isEmpleado) {
    if (RESTRICTED_FOR_STAFF_EMPLEADO.some(path => pathname.startsWith(path))) {
      const url = request.nextUrl.clone()
      url.pathname = isEmpleado ? '/mi' : '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  if (isEmpleado) {
    if (RESTRICTED_FOR_EMPLEADO.some(path => pathname.startsWith(path))) {
      const url = request.nextUrl.clone()
      url.pathname = '/mi'
      return NextResponse.redirect(url)
    }
  }

  if (!BYPASS_SUBSCRIPTION_CHECK && orgMember?.organization_id) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at')
      .eq('organization_id', orgMember.organization_id)
      .single()

    if (subscription?.status === 'trial' && subscription.trial_ends_at) {
      const trialEnds = new Date(subscription.trial_ends_at)
      const now = new Date()
      if (trialEnds < now) {
        if (
          !pathname.startsWith('/dashboard/billing') &&
          !pathname.startsWith('/login') &&
          !pathname.startsWith('/admin')
        ) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard/billing'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
