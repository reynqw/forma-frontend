interface SkeletonProps {
  className?: string
}

/** Base skeleton block with shimmer animation */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

/** Skeleton for ResourceCard — matches real card layout */
export function ResourceCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

/** Grid of ResourceCard skeletons */
export function ResourceGridSkeleton({ count = 8, cols = 4 }: { count?: number; cols?: number }) {
  const colsClass =
    cols === 3
      ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  return (
    <div className={`grid ${colsClass} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <ResourceCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton for a stat card */
export function StatCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

/** Skeleton for a profile page header */
export function ProfileSkeleton() {
  return (
    <div className="card p-8 mb-8">
      <div className="flex items-start gap-6">
        <Skeleton className="w-20 h-20 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  )
}

/** Skeleton for a table row */
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-surface-200">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-32' : 'flex-1'}`} />
      ))}
    </div>
  )
}

/** Skeleton for a list of items (orders, notifications, etc.) */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="card divide-y divide-surface-200">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
