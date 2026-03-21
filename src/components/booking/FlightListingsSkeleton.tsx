import React, { FC } from "react";

const pulse =
  "animate-pulse rounded-md bg-neutral-200/90 dark:bg-neutral-700/80";

const SkeletonBar: FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`${pulse} ${className}`} aria-hidden />
);

const FilterSidebarSkeleton: FC = () => (
  <div className="space-y-0">
    <div className="relative mb-6">
      <SkeletonBar className="h-11 w-full rounded-xl" />
    </div>

    <div className="space-y-4">
      <SkeletonBar className="h-3 w-16" />
      <ul className="space-y-4">
        {[1, 2, 3].map((i) => (
          <li key={i} className="flex items-start gap-3">
            <SkeletonBar className="mt-1 h-5 w-5 shrink-0 rounded" />
            <div className="min-w-0 flex-1 flex justify-between gap-2">
              <div className="space-y-2 flex-1">
                <SkeletonBar className="h-4 w-28" />
                <SkeletonBar className="h-3 w-36" />
              </div>
              <SkeletonBar className="h-4 w-16 shrink-0" />
            </div>
          </li>
        ))}
      </ul>
    </div>

    {(["Baggage", "Airlines", "Layover airport"] as const).map((label) => (
      <div
        key={label}
        className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-700"
      >
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-4 w-full max-w-[200px]" />
      </div>
    ))}
  </div>
);

const FlightCardSkeleton: FC = () => (
  <div
    className="relative space-y-6 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6"
    aria-hidden
  >
    <div className="relative sm:pr-20">
      <div className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
        <SkeletonBar className="h-4 w-4 rounded-sm opacity-50" />
      </div>

      <div className="flex flex-col space-y-6 sm:flex-row sm:items-center sm:space-y-0">
        <div className="w-24 shrink-0 lg:w-32">
          <SkeletonBar className="h-10 w-10 rounded-lg" />
        </div>

        {/* Mobile */}
        <div className="block min-w-0 flex-1 space-y-2 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-5 w-20" />
              <SkeletonBar className="h-3 w-12" />
            </div>
            <SkeletonBar className="h-6 w-6 shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-5 w-20" />
              <SkeletonBar className="h-3 w-12" />
            </div>
          </div>
          <SkeletonBar className="h-3 w-48 max-w-full" />
        </div>

        {/* Desktop columns — match FlightCard lg grid */}
        <div className="hidden min-w-[150px] flex-[4] lg:block">
          <SkeletonBar className="h-6 w-36" />
          <SkeletonBar className="mt-2 h-4 w-28" />
        </div>
        <div className="hidden flex-[4] lg:block">
          <SkeletonBar className="h-6 w-32" />
          <SkeletonBar className="mt-2 h-4 w-20" />
        </div>
        <div className="hidden min-w-0 flex-[4] lg:block">
          <SkeletonBar className="h-6 w-24" />
          <SkeletonBar className="mt-2 h-4 w-16" />
        </div>

        <div className="flex-[4] sm:text-right">
          <SkeletonBar className="inline-block h-7 w-28 sm:ml-auto rounded-md bg-secondary-6000/25 dark:bg-secondary-500/20" />
          <SkeletonBar className="mt-2 inline-block h-3 w-16 sm:ml-auto" />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-end">
      <SkeletonBar className="h-11 w-full rounded-full sm:w-48 sm:max-w-[220px]" />
    </div>
  </div>
);

export interface FlightListingsSkeletonProps {
  className?: string;
  /** Number of placeholder flight rows */
  cardCount?: number;
}

/**
 * Loading placeholder matching `FlightListingWithFilters` + `FlightCard` layout.
 */
const FlightListingsSkeleton: FC<FlightListingsSkeletonProps> = ({
  className = "",
  cardCount = 5,
}) => {
  return (
    <div className={`nc-FlightListingsSkeleton ${className}`}>
      <div className="mb-4 flex flex-col gap-3 lg:hidden">
        <SkeletonBar className="h-12 w-full rounded-xl" />
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:gap-10 xl:gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <FilterSidebarSkeleton />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SkeletonBar className="h-4 w-56 max-w-full" />
            <div className="flex items-center gap-2">
              <SkeletonBar className="h-4 w-10" />
              <SkeletonBar className="h-10 w-44 rounded-lg" />
            </div>
          </div>
          <SkeletonBar className="mb-4 h-3 w-full max-w-2xl" />

          <div className="space-y-4">
            {Array.from({ length: cardCount }, (_, i) => (
              <FlightCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightListingsSkeleton;
