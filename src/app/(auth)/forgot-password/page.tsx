import { ForgotPasswordForm } from './ForgotPasswordForm'
import Link from 'next/link'

export const metadata = {
  title: 'Recuperar contraseña - Prugressy',
  description: 'Recupera el acceso a tu cuenta de Prugressy',
}

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#0F4C5C]/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#0F4C5C]/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-white/85 dark:bg-slate-800/85 backdrop-blur-xl rounded-xl border border-white/40 dark:border-slate-700/50 shadow-xl p-8 sm:p-10 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] shadow-lg shadow-[#0F4C5C]/20 mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        <ForgotPasswordForm />

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-[#0F4C5C] hover:text-[#0C3E4A] dark:text-[#38BDF8] dark:hover:text-[#38BDF8]/80 font-medium transition-colors"
          >
            ← Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  )
}
