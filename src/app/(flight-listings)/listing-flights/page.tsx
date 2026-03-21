import { Suspense } from "react";
import ListingFlightsPageClient from "./ListingFlightsPageClient";
import BgGlassmorphism from "@/components/BgGlassmorphism";
import BookingSteps from "@/components/booking/BookingSteps";
import FlightListingsSkeleton from "@/components/booking/FlightListingsSkeleton";
import React from "react";

function ListingFlightsPageFallback() {
  return (
    <div className="nc-ListingFlightsPage relative overflow-hidden">
      <BgGlassmorphism />
      <div className="container relative">
        <div className="space-y-4 pt-6 pb-4 lg:pt-8">
          <div className="h-7 w-48 max-w-full animate-pulse rounded-lg bg-neutral-200/90 dark:bg-neutral-700/80" />
          <div className="h-14 w-full max-w-4xl animate-pulse rounded-lg bg-neutral-200/90 dark:bg-neutral-700/80" />
        </div>
        <BookingSteps currentStepIndex={0} className="py-6" />
        <FlightListingsSkeleton className="pb-16 pt-4 lg:pb-24" cardCount={5} />
      </div>
    </div>
  );
}

export default function ListingFlightsPage() {
  return (
    <Suspense fallback={<ListingFlightsPageFallback />}>
      <ListingFlightsPageClient />
    </Suspense>
  );
}
