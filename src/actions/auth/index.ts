'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { authLimiter, registerLimiter } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/network/get-client-ip'

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'El email y la contraseña son requeridos' }
  }

  const headerStore = await headers()
  const ip = getClientIp(headerStore)

  const rateKey = `login:${ip}`
  const rateCheck = authLimiter.check(rateKey)
  if (!rateCheck.allowed) {
    authLimiter.hit(rateKey, { ip, route: 'login' })
    return { error: 'Demasiados intentos. Intenta de nuevo en unos segundos.' }
  }
  authLimiter.hit(rateKey, { ip, route: 'login' })

  const supabase = await createClient()

  // Use signInWithPassword for credentials
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Credenciales inválidas. Por favor intenta de nuevo.' }
  }

  const redirectTo = formData.get('redirect_to') as string
  redirect(redirectTo || '/calendar')
}

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const businessName = formData.get('businessName') as string
  const fullName = formData.get('fullName') as string

  if (!email || !password || !businessName || !fullName) {
    return { error: 'Todos los campos son requeridos' }
  }

  const headerStore = await headers()
  const ip = getClientIp(headerStore)

  const rateKey = `register:${ip}`
  const rateCheck = registerLimiter.check(rateKey)
  if (!rateCheck.allowed) {
    registerLimiter.hit(rateKey, { ip, route: 'register' })
    return { error: 'Demasiados registros desde esta IP. Intenta más tarde.' }
  }
  registerLimiter.hit(rateKey, { ip, route: 'register' })

  const supabase = await createClient()

  // During signup, we pass metadata.
  // The PostgreSQL trigger `handle_new_user` will extract `business_name` and create the organization.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        business_name: businessName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Auth flow might require email verification depending on project config.
  // For now we redirect to login indicating they should check their email or just login.
  redirect('/login?message=check_email')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  redirect('/login')
}
