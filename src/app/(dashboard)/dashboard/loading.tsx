const METRIC_CARDS = Array.from({ length: 4 })

export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-md mb-2" />
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700/50 rounded-xl" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRIC_CARDS.map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700/50 rounded" />
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700/50" />
            </div>
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700/50 rounded mb-2" />
            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-700/30 rounded" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700/50 rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
          </div>
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-700/30 rounded-xl" />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700/30 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700/30 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
