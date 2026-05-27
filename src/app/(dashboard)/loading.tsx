export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      {/* Top bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700/50 rounded-xl" />
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 bg-white dark:bg-slate-800/50"
          >
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-700/30 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-700/30 rounded" />
              <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-700/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
