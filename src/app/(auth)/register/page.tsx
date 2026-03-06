import { RegisterForm } from '@/components/auth/RegisterForm'
import Link from 'next/link'

export const metadata = {
  title: 'Comienza tu viaje - SpaConnect',
}

export default function RegisterPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6 sm:p-12 relative min-h-screen overflow-hidden">
      
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-5">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/30 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"></div>
      </div>

      <div className="z-10 w-full max-w-[540px]">
        <header className="flex flex-col items-center justify-center mb-8 gap-3">
          <div className="flex items-center gap-2 text-primary dark:text-primary">
            <span className="material-symbols-outlined text-3xl">spa</span>
            <h2 className="text-xl font-bold tracking-wide uppercase text-text-main dark:text-slate-100 font-display">Wellness SaaS</h2>
          </div>
        </header>

        <div className="bg-white/85 dark:bg-background-dark/80 backdrop-blur-[12px] border border-white/30 dark:border-slate-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] rounded-xl p-8 sm:p-12 w-full flex flex-col relative z-10">
          <div className="mb-10 text-center">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold leading-tight tracking-tight text-text-main dark:text-slate-100 mb-3">
              Comienza tu viaje
            </h1>
            <p className="text-text-muted dark:text-slate-400 text-base font-display">
              Registra tu negocio y eleva la experiencia de tus clientes.
            </p>
          </div>

          <RegisterForm />

          <div className="mt-8 text-center">
            <p className="text-sm text-text-muted dark:text-slate-400 font-display">
              ¿Ya tienes una cuenta? {' '}
              <Link href="/login" className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 font-semibold transition-colors border-b border-transparent hover:border-primary pb-0.5">
                Iniciar Sesión
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-text-muted/70 dark:text-slate-500 font-display">
              Al registrarte, aceptas nuestros <a href="#" className="underline hover:text-text-main dark:hover:text-slate-300">Términos de Servicio</a> y <a href="#" className="underline hover:text-text-main dark:hover:text-slate-300">Política de Privacidad</a>.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
