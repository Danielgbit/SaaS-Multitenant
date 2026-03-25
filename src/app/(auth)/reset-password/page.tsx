import { ResetPasswordForm } from './ResetPasswordForm'
import Link from 'next/link'

export const metadata = {
  title: 'Nueva contraseña - Prugressy',
  description: 'Establece tu nueva contraseña de Prugressy',
}

export default function ResetPasswordPage() {
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
            Nueva contraseña
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Ingresa tu nueva contraseña para acceder a tu cuenta.
          </p>
        </div>

        <ResetPasswordForm />

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
