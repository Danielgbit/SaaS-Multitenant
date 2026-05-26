export default function NotificacionesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700/50 rounded" />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="h-10 flex-1 max-w-md bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700/50 rounded" />
            </div>
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700/50 rounded" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700/50 rounded" />
          </div>
        ))}
      </div>

      {/* Chart + Timeline */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
          <div className="h-[200px] bg-slate-100 dark:bg-slate-700/30 rounded-xl" />
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 p-4 space-y-3">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700/50 rounded" />
          <div className="flex flex-wrap gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-7 w-16 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
            ))}
          </div>
          <div className="h-9 w-full bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-8 w-full bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 w-full bg-slate-100 dark:bg-slate-700/30 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
