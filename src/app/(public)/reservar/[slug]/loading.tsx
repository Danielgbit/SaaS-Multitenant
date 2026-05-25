const FEATURES_SKELETON = Array.from({ length: 3 })

export default function PublicBookingLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 animate-pulse">
      {/* Header branding */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700/50" />
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700/50 rounded" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700/50" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700/50 rounded hidden sm:block" />
                </div>
              ))}
            </div>

            {/* Service cards */}
            <div className="space-y-3">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700/50 rounded" />
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700/50 rounded" />
                      <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700/30 rounded" />
                    </div>
                    <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar summary */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 h-fit">
            <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700/50 rounded mb-4" />
            <div className="space-y-4">
              {FEATURES_SKELETON.map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700/50" />
                  <div className="h-4 flex-1 bg-slate-200 dark:bg-slate-700/50 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
