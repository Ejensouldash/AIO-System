export default function SalesOrderingLoading() {
  return (
    <div className="space-y-6 pb-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex space-x-6 border-b border-slate-200 pb-3">
        <div className="h-6 w-24 bg-slate-200 rounded-lg" />
        <div className="h-6 w-24 bg-slate-200 rounded-lg" />
        <div className="h-6 w-24 bg-slate-200 rounded-lg" />
        <div className="h-6 w-24 bg-slate-200 rounded-lg" />
        <div className="h-6 w-24 bg-slate-200 rounded-lg" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-white p-5" />
        ))}
      </div>

      {/* Content Table / Card Skeleton */}
      <div className="h-96 rounded-2xl border border-slate-200 bg-white p-6" />
    </div>
  )
}
