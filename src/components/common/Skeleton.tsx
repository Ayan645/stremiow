export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-shimmer rounded ${className}`} />
  );
}

export function PosterSkeleton() {
  return (
    <div className="flex-shrink-0 w-[140px] md:w-[185px] lg:w-[210px]">
      <div className="aspect-[2/3] rounded-md animate-shimmer" />
      <div className="h-3 w-3/4 mt-2 rounded animate-shimmer" />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[85vh] bg-[#141414]">
      <div className="absolute inset-0 animate-shimmer" />
      <div className="absolute bottom-[20%] left-12 space-y-4">
        <div className="h-12 w-80 rounded animate-shimmer" />
        <div className="h-4 w-48 rounded animate-shimmer" />
        <div className="h-16 w-96 rounded animate-shimmer" />
        <div className="flex gap-3">
          <div className="h-10 w-32 rounded animate-shimmer" />
          <div className="h-10 w-36 rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <section className="px-4 md:px-12 py-4">
      <div className="h-6 w-48 rounded animate-shimmer mb-4" />
      <div className="flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <PosterSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
