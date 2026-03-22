"use client";

import BookingSteps from "@/components/booking/BookingSteps";
import FlightListingsSkeleton from "@/components/booking/FlightListingsSkeleton";
import {
  FlightFlowPageShell,
  FlowFeedbackCard,
} from "@/components/layout";
import SectionSliderNewCategories from "@/components/SectionSliderNewCategories";
import SectionSubscribe2 from "@/components/SectionSubscribe2";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SectionGridFilterCard from "../SectionGridFilterCard";
import FlightSearchSummaryBar from "../FlightSearchSummaryBar";
import type { Offer } from "@/api/models";
import { parseFlightSearchFromUrl } from "@/utils/flightSearchUrlState";

const ListingFlightsPageClient: React.FC = () => {
  const searchParams = useSearchParams();
  const parsed = useMemo(
    () => parseFlightSearchFromUrl(searchParams),
    [searchParams]
  );

  const [offers, setOffers] = useState<Offer[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const searchQueryKey = searchParams.toString();

  useEffect(() => {
    const p = parseFlightSearchFromUrl(searchParams);

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
    <FlightFlowPageShell pageClassName="nc-ListingFlightsPage">
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
          <FlowFeedbackCard
            variant="error"
            title="Something went wrong"
            description={errorMessage}
            role="alert"
          />
        </div>
      ) : !hasSearchParams ? (
        <div className="py-8">
          <FlowFeedbackCard
            variant="empty"
            title="Search for flights to see results"
            description="Use the search form to find available flights."
          />
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
    </FlightFlowPageShell>
  );
};

export default ListingFlightsPageClient;
