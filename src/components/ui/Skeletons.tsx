export function CarCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="h-48 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 skeleton rounded w-1/3" />
        <div className="h-5 skeleton rounded w-2/3" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-3 skeleton rounded" />)}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-dark-700">
          <div className="h-6 skeleton rounded w-1/3" />
          <div className="h-4 skeleton rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function SparePartCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="h-32 skeleton rounded-xl" />
      <div className="h-4 skeleton rounded w-2/3" />
      <div className="h-3 skeleton rounded w-1/2" />
      <div className="flex justify-between">
        <div className="h-5 skeleton rounded w-1/3" />
        <div className="h-5 skeleton rounded w-1/4" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card p-6 space-y-3">
          <div className="h-8 w-8 skeleton rounded-xl mx-auto" />
          <div className="h-6 skeleton rounded w-1/2 mx-auto" />
          <div className="h-3 skeleton rounded w-2/3 mx-auto" />
        </div>
      ))}
    </div>
  );
}
