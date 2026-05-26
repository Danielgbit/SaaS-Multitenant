const DAY_CELLS = Array.from({ length: 35 })

export default function CalendarLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700/50">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => (
            <div key={i} className="py-3 text-center">
              <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700/50 rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {DAY_CELLS.map((_, i) => (
            <div key={i} className="p-2 border-r border-b border-slate-100 dark:border-slate-700/30 min-h-[100px]">
              <div className="h-4 w-6 bg-slate-200 dark:bg-slate-700/50 rounded mb-2" />
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-700/30 rounded" />
                <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-700/30 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
