export default function BillingLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="h-32 bg-slate-200 dark:bg-slate-700/50 rounded-2xl" />

      {/* Current plan skeleton */}
      <div className="h-40 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700/50" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700/50 rounded" />
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700/50 rounded" />
          </div>
        </div>
      </div>

      {/* Promo code skeleton */}
      <div className="h-24 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700/50" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700/50 rounded" />
            <div className="h-3 w-64 bg-slate-200 dark:bg-slate-700/50 rounded" />
          </div>
        </div>
      </div>

      {/* Plans grid skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-[480px] bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700/50" />
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700/50 rounded" />
              </div>
            </div>
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700/50 rounded mb-6" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div
                  key={j}
                  className="h-4 w-full bg-slate-200 dark:bg-slate-700/50 rounded"
                />
              ))}
            </div>
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-700/50 rounded-xl mt-8" />
          </div>
        ))}
      </div>
    </div>
  )
}
