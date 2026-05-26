export default function NewPromoCodeLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 w-40 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 max-w-lg">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700/50 rounded mb-2" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-700/50 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="h-10 w-full bg-slate-200 dark:bg-slate-700/50 rounded-xl mt-6" />
      </div>
    </div>
  )
}
