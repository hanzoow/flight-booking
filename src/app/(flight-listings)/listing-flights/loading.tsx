import BgGlassmorphism from "@/components/BgGlassmorphism";
import BookingSteps from "@/components/booking/BookingSteps";
import FlightListingsSkeleton from "@/components/booking/FlightListingsSkeleton";
import React from "react";

function SummaryBarSkeleton() {
  const pulse =
    "animate-pulse rounded-lg bg-neutral-200/90 dark:bg-neutral-700/80";
  return (
    <div className="space-y-4 pt-6 pb-4 lg:pt-8">
      <div className={`h-7 w-48 max-w-full ${pulse}`} aria-hidden />
      <div className={`h-14 w-full max-w-4xl ${pulse}`} aria-hidden />
      <div className="flex flex-wrap gap-2">
        <div className={`h-6 w-24 ${pulse}`} aria-hidden />
        <div className={`h-6 w-32 ${pulse}`} aria-hidden />
        <div className={`h-6 w-28 ${pulse}`} aria-hidden />
      </div>
    </div>
  );
}

/** Shown by Next.js while the flight listing page (server fetch) is loading. */
export default function ListingFlightsLoading() {
  return (
    <div className="nc-ListingFlightsPage relative overflow-hidden">
      <BgGlassmorphism />
      <div className="container relative">
        <SummaryBarSkeleton />
        <BookingSteps currentStepIndex={0} className="py-6" />
        <FlightListingsSkeleton className="pb-16 pt-4 lg:pb-24" cardCount={5} />
      </div>
    </div>
  );
}
