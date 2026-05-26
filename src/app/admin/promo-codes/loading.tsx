const ROWS = Array.from({ length: 5 })

export default function PromoCodesLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700/50 rounded-xl" />
      </div>
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="h-12 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50" />
        <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {ROWS.map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700/50 rounded" />
                <div className="h-3 w-1/6 bg-slate-100 dark:bg-slate-700/30 rounded" />
              </div>
              <div className="h-6 w-24 bg-slate-100 dark:bg-slate-700/30 rounded-full" />
              <div className="h-6 w-20 bg-slate-100 dark:bg-slate-700/30 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
