export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-8" />

      <div className="space-y-6">
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  )
}