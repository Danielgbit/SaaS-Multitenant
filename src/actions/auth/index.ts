'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { authLimiter, registerLimiter } from '@/lib/rate-limiter'
import { getClientIp } from '@/lib/network/get-client-ip'
import { LoginSchema, RegisterSchema } from '@/schemas/auth/auth.schema'

export async function loginAction(prevState: any, formData: FormData) {
  const rawEmail = (formData.get('email') as string)?.trim().toLowerCase() ?? ''
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect_to') as string

  const parsed = LoginSchema.safeParse({ email: rawEmail, password, redirect_to: redirectTo || undefined })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
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

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Credenciales inválidas. Por favor intenta de nuevo.' }
  }

  redirect(parsed.data.redirect_to || '/calendar')
}

export async function registerAction(prevState: any, formData: FormData) {
  const rawEmail = (formData.get('email') as string)?.trim().toLowerCase() ?? ''
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const businessName = formData.get('businessName') as string
  const fullName = formData.get('fullName') as string

  const parsed = RegisterSchema.safeParse({
    email: rawEmail,
    password,
    confirmPassword,
    businessName,
    fullName,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
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

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        business_name: parsed.data.businessName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/login?message=check_email')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  redirect('/login')
}
