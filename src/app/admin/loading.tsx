export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5">
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700/50 rounded mb-2" />
            <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700/50 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700/30 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
