const ROWS = Array.from({ length: 5 })

export default function OrganizationsLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 w-56 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="h-12 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50" />
        <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {ROWS.map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700/50 rounded" />
                <div className="h-3 w-1/5 bg-slate-100 dark:bg-slate-700/30 rounded" />
              </div>
              <div className="h-6 w-20 bg-slate-100 dark:bg-slate-700/30 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
