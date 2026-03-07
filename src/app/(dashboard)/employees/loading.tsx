export default function EmployeesLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>

      {/* Lista skeleton */}
      <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Header skeleton */}
        <div className="h-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700" />

        {/* Filas skeleton */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 last:border-0"
          >
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded mt-1.5" />
            </div>
            <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
