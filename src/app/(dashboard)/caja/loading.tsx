export default function CajaLoading() {
  return (
    <div className="flex gap-6 animate-pulse p-6">
      <div className="flex-1 space-y-4">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
        ))}
      </div>
      <div className="w-80 space-y-4">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-32" />
        <div className="h-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    </div>
  )
}
