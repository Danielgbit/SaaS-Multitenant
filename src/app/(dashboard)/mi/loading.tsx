export default function MiLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Page header */}
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />

      {/* 2-column grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Profile card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 bg-white dark:bg-slate-800/50">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 w-full bg-slate-100 dark:bg-slate-700/30 rounded-lg" />
              <div className="h-10 w-full bg-slate-100 dark:bg-slate-700/30 rounded-lg" />
            </div>
          </div>

          {/* Availability card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 bg-white dark:bg-slate-800/50">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-700/30 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Agenda card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 bg-white dark:bg-slate-800/50">
            <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 w-full bg-slate-100 dark:bg-slate-700/30 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Services card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 bg-white dark:bg-slate-800/50">
            <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-14 w-full bg-slate-100 dark:bg-slate-700/30 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
