export default function ProductionLoading() {
  return (
    <div className="space-y-6 pb-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="h-10 w-10 bg-slate-200 rounded-xl" />
        <div className="space-y-2">
          <div className="h-8 w-60 bg-slate-200 rounded-lg" />
          <div className="h-4 w-40 bg-slate-100 rounded-md" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex space-x-8 border-b border-gray-200 pb-4">
        <div className="h-6 w-24 bg-slate-200 rounded-lg" />
        <div className="h-6 w-24 bg-slate-200 rounded-lg" />
        <div className="h-6 w-24 bg-slate-200 rounded-lg" />
        <div className="h-6 w-24 bg-slate-200 rounded-lg" />
      </div>

      {/* Action / Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 rounded-2xl border border-gray-200 bg-white p-6" />
        <div className="h-32 rounded-2xl border border-gray-200 bg-white p-6" />
        <div className="h-32 rounded-2xl border border-gray-200 bg-white p-6" />
      </div>

      {/* Main Table Skeleton */}
      <div className="h-96 rounded-2xl border border-gray-200 bg-white p-6" />
    </div>
  )
}
