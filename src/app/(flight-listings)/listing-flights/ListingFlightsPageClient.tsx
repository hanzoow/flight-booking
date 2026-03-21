"use client";

import BgGlassmorphism from "@/components/BgGlassmorphism";
import BookingSteps from "@/components/booking/BookingSteps";
import FlightListingsSkeleton from "@/components/booking/FlightListingsSkeleton";
import SectionSliderNewCategories from "@/components/SectionSliderNewCategories";
import SectionSubscribe2 from "@/components/SectionSubscribe2";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SectionGridFilterCard from "../SectionGridFilterCard";
import FlightSearchSummaryBar from "../FlightSearchSummaryBar";
import type { CabinClass, Offer } from "@/api/models";

const CABIN_LABEL: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First",
};

function parseFlightSearch(sp: { get: (name: string) => string | null }) {
  const origin = sp.get("origin")?.trim() ?? "";
  const destination = sp.get("destination")?.trim() ?? "";
  const fromLabel = sp.get("from")?.trim() || origin;
  const toLabel = sp.get("to")?.trim() || destination;
  const tripType = sp.get("tripType") || "roundTrip";
  const cabinClass = (sp.get("cabin_class") as CabinClass) || "economy";
  const departDate = sp.get("departDate")?.trim() ?? "";
  const returnDate = sp.get("returnDate")?.trim() ?? "";
  const adults = sp.get("adults") ? parseInt(sp.get("adults")!, 10) : 1;
  const children = sp.get("children") ? parseInt(sp.get("children")!, 10) : 0;
  const infants = sp.get("infants") ? parseInt(sp.get("infants")!, 10) : 0;
  const totalGuests = adults + children + infants;
  const cabinLabel = CABIN_LABEL[cabinClass] ?? cabinClass;

  const today = new Date().toISOString().split("T")[0];
  const isDateValid = !departDate || departDate >= today;

  const hasSearchParams = Boolean(origin && destination && departDate);

  return {
    origin,
    destination,
    fromLabel,
    toLabel,
    tripType,
    cabinClass,
    departDate,
    returnDate,
    adults,
    children,
    infants,
    totalGuests,
    cabinLabel,
    hasSearchParams,
    isDateValid,
    dateErrorMessage:
      "Departure date must be today or in the future. Please search again.",
  };
}

const ListingFlightsPageClient: React.FC = () => {
  const searchParams = useSearchParams();
  const parsed = useMemo(
    () => parseFlightSearch(searchParams),
    [searchParams]
  );

  const [offers, setOffers] = useState<Offer[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const searchQueryKey = searchParams.toString();

  useEffect(() => {
    const p = parseFlightSearch(searchParams);

    if (!p.hasSearchParams) {
      setOffers([]);
      setErrorMessage("");
      setLoading(false);
      return;
    }

    if (!p.isDateValid) {
      setOffers([]);
      setErrorMessage(p.dateErrorMessage);
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setErrorMessage("");

    const qs = new URLSearchParams();
    qs.set("origin", p.origin);
    qs.set("destination", p.destination);
    qs.set("departDate", p.departDate);
    qs.set("adults", String(p.adults));
    qs.set("children", String(p.children));
    qs.set("infants", String(p.infants));
    qs.set("cabin_class", p.cabinClass);
    if (p.tripType !== "oneWay" && p.returnDate) {
      qs.set("returnDate", p.returnDate);
    }

    fetch(`/api/offer-requests?${qs.toString()}`, { signal: ac.signal })
      .then(async (res) => {
        const json = (await res.json()) as {
          error?: string;
          data?: { offers?: Offer[] };
        };
        if (!res.ok) {
          throw new Error(json.error || "Failed to search flights");
        }
        setOffers(json.data?.offers ?? []);
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return;
        const msg =
          e instanceof Error ? e.message : "Failed to search flights";
        setErrorMessage(msg);
        setOffers([]);
        console.error("Flight search error:", msg);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [searchQueryKey, searchParams]);

  const {
    fromLabel,
    toLabel,
    origin,
    destination,
    departDate,
    returnDate,
    tripType,
    cabinLabel,
    cabinClass,
    adults,
    children,
    infants,
    totalGuests,
    hasSearchParams,
  } = parsed;

  const resultsCount =
    hasSearchParams && !loading && !errorMessage
      ? offers.length
      : undefined;

  return (
    <div className="nc-ListingFlightsPage relative overflow-hidden">
      <BgGlassmorphism />

      <div className="container relative">
        <FlightSearchSummaryBar
          className="pt-6 pb-4 lg:pt-8"
          from={fromLabel}
          to={toLabel}
          origin={origin}
          destination={destination}
          departDate={departDate}
          returnDate={returnDate}
          tripType={tripType}
          cabinLabel={cabinLabel}
          cabin_class={cabinClass}
          adults={adults}
          children={children}
          infants={infants}
          totalGuests={totalGuests}
          resultsCount={resultsCount}
        />

        {hasSearchParams && (
          <BookingSteps currentStepIndex={0} className="py-6" />
        )}

        {errorMessage ? (
          <div className="py-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
              <i className="las la-exclamation-circle mb-3 block text-4xl text-red-500"></i>
              <p className="font-medium text-red-600 dark:text-red-400">
                Something went wrong
              </p>
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
          </div>
        ) : !hasSearchParams ? (
          <div className="py-8">
            <div className="rounded-2xl bg-neutral-50 p-8 text-center dark:bg-neutral-800">
              <i className="las la-search mb-3 block text-4xl text-neutral-300 dark:text-neutral-600"></i>
              <p className="text-lg text-neutral-500 dark:text-neutral-400">
                Search for flights to see results
              </p>
              <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
                Use the search form to find available flights.
              </p>
            </div>
          </div>
        ) : loading ? (
          <FlightListingsSkeleton className="pb-16 pt-4 lg:pb-24" cardCount={5} />
        ) : (
          <SectionGridFilterCard
            className="pt-4 pb-16 lg:pb-24"
            offers={offers}
            tripType={tripType === "oneWay" ? "oneWay" : "roundTrip"}
          />
        )}

        <SectionSliderNewCategories
          heading="Explore top destinations"
          subHeading="Explore thousands of destinations around the world"
          categoryCardType="card4"
          itemPerRow={4}
        />

        <SectionSubscribe2 className="py-24 lg:py-28" />
      </div>
    </div>
  );
};

export default ListingFlightsPageClient;
