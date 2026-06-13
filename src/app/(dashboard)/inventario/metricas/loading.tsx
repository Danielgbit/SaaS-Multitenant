const STAT_CARDS = Array.from({ length: 8 })
const TABLE_ROWS = Array.from({ length: 3 })

export default function MetricsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700/50 rounded" />
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.slice(0, 8).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700/50 rounded" />
            </div>
            <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700/50 rounded" />
            {i < 2 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <div className="h-3 w-32 bg-slate-100 dark:bg-slate-700/30 rounded" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-6 w-44 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
        {TABLE_ROWS.map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700/50 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/5 bg-slate-200 dark:bg-slate-700/50 rounded" />
              <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-700/30 rounded" />
            </div>
            <div className="h-6 w-20 bg-slate-100 dark:bg-slate-700/30 rounded-full" />
            <div className="h-6 w-16 bg-slate-100 dark:bg-slate-700/30 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
