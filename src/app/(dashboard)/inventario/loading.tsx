const STAT_CARDS = Array.from({ length: 3 })
const TABLE_ROWS = Array.from({ length: 5 })

export default function InventoryLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-md mb-2" />
          <div className="h-8 w-36 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
        </div>
        <div className="h-10 w-44 bg-slate-200 dark:bg-slate-700/50 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {STAT_CARDS.map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4"
          >
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700/50 rounded mb-2" />
            <div className="h-7 w-12 bg-slate-200 dark:bg-slate-700/50 rounded" />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <div className="h-11 w-full bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="h-12 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50" />
        <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {TABLE_ROWS.map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700/50 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700/50 rounded" />
                <div className="h-3 w-1/6 bg-slate-100 dark:bg-slate-700/30 rounded" />
              </div>
              <div className="h-6 w-16 bg-slate-100 dark:bg-slate-700/30 rounded-full" />
              <div className="h-6 w-20 bg-slate-100 dark:bg-slate-700/30 rounded-full" />
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
