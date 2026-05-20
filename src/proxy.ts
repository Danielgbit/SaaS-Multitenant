import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hostname = request.nextUrl.hostname

  if (pathname.startsWith('/api/cron/') || pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next()
  }

  const supabaseResponse = await updateSession(request)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    if (!BYPASS_ADMIN_AUTH) {
      if (role !== 'owner_saas') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  if (isEmpleado && pathname.startsWith('/payroll') && !pathname.startsWith('/payroll/mi')) {
    const url = request.nextUrl.clone()
    url.pathname = '/payroll/mi'
    return NextResponse.redirect(url)
  }

  if (isStaff || isEmpleado) {
    const restrictedForStaffAndEmpleado = [
      '/payroll',
      '/employees',
      '/whatsapp',
      '/email',
      '/settings',
      '/billing',
    ]

    if (restrictedForStaffAndEmpleado.some(path => pathname.startsWith(path))) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  if (isEmpleado) {
    const restrictedForEmpleado = [
      '/clients',
      '/services',
      '/inventory',
    ]

    if (restrictedForEmpleado.some(path => pathname.startsWith(path))) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
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