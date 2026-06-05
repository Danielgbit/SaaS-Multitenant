import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
        <Search className="w-10 h-10 text-slate-400 dark:text-slate-500" />
      </div>
      
      <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
        404
      </h1>
      
      <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
        Página no encontrada
      </h2>
      
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
        La página que buscas no existe o fue movida a otra ubicación.
      </p>
      
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F4C5C] dark:bg-[#38BDF8] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Home className="w-4 h-4" />
          Ir al Dashboard
        </Link>
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
