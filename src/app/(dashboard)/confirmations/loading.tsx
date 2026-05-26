const SKELETON_ROWS = Array.from({ length: 5 })

export default function ConfirmationsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700/50 rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 w-28 bg-slate-200 dark:bg-slate-700/50 rounded-xl" />
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5">
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700/50 rounded mb-2" />
            <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700/50 rounded" />
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {SKELETON_ROWS.map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700/50 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700/50 rounded" />
                <div className="h-3 w-1/4 bg-slate-100 dark:bg-slate-700/30 rounded" />
              </div>
              <div className="h-8 w-24 bg-slate-100 dark:bg-slate-700/30 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
