import { Plus, Search, Scissors } from 'lucide-react'

export default function ServicesLoading() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700/50 rounded-md mb-2" />
          <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
        </div>

        <button
          disabled
          type="button"
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700/50 text-transparent"
        >
          <Plus className="w-4 h-4" />
          Nuevo servicio
        </button>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/30 rounded-xl p-4 text-center"
          >
            <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700/50 rounded mx-auto mb-1.5" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700/50 rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
        <div className="w-full h-[46px] rounded-xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/30" />
      </div>

      {/* List Skeleton */}
      <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/30 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <Scissors className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700/50 rounded" />
          </div>
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-center gap-4 px-6 py-5">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700/50 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700/50 rounded" />
                <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700/50 rounded" />
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="w-[44px] h-[44px] rounded-lg bg-slate-200 dark:bg-slate-700/50" />
                <div className="w-[44px] h-[44px] rounded-lg bg-slate-200 dark:bg-slate-700/50" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
