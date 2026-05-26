const TABLE_ROWS = Array.from({ length: 5 })
const ALERT_ROWS = Array.from({ length: 3 })

export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-8 p-6">
      {/* Header */}
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5">
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700/50 rounded mb-2" />
            <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700/50 rounded" />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="h-24 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5" />
        ))}
      </div>

      {/* Workers table */}
      <div>
        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
          <div className="h-10 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50" />
          <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {TABLE_ROWS.map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700/50 rounded" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700/50 rounded-full" />
                <div className="h-3 w-12 bg-slate-100 dark:bg-slate-700/30 rounded" />
                <div className="h-3 w-10 bg-slate-100 dark:bg-slate-700/30 rounded ml-auto" />
                <div className="h-3 w-8 bg-slate-100 dark:bg-slate-700/30 rounded" />
                <div className="h-3 w-8 bg-slate-100 dark:bg-slate-700/30 rounded" />
                <div className="h-3 w-8 bg-slate-100 dark:bg-slate-700/30 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div>
        <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {ALERT_ROWS.map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700/50 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700/50 rounded" />
                  <div className="h-2 w-64 bg-slate-100 dark:bg-slate-700/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
