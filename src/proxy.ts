import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
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

  const pathname = request.nextUrl.pathname

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role, organization_id')
    .eq('user_id', user.id)
    .single()

  const role = orgMember?.role
  const isStaff = role === 'staff'
  const isEmpleado = role === 'empleado'

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

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}