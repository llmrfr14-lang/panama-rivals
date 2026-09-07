export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer ${className}`} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3 rounded-full" />
          <Skeleton className="h-3 w-1/2 rounded-full" />
        </div>
      </div>
      <div className="space-y-2 pl-12">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-5/6 rounded-full" />
        <Skeleton className="h-3 w-4/6 rounded-full" />
      </div>
    </div>
  );
}

export function BracketSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="mx-auto h-16 w-40 rounded-3xl" />
    </div>
  );
}