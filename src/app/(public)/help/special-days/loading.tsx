'use client'

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {/* Back button skeleton */}
        <div className="h-4 w-32 bg-slate-800 rounded animate-pulse mb-6" />

        {/* Header skeleton */}
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-slate-800 rounded animate-pulse mb-6" />

        {/* Content skeletons */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-5 space-y-3">
            <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
            {i === 4 && (
              <div className="h-4 w-3/4 bg-slate-700 rounded animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}