"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { FC, useEffect, useMemo, useState } from "react";
import type { Offer } from "@/api/models";
import { Route } from "@/routers/types";
import BookingSteps from "@/components/booking/BookingSteps";
import PassengerBookingForm, {
  type CheckoutPhase,
} from "@/components/booking/PassengerBookingForm";
import BgGlassmorphism from "@/components/BgGlassmorphism";
import { friendlyOrderErrorMessage } from "@/utils/offerPassengerDob";
import { buildListingFlightsSearchHref } from "@/utils/flightListingSearchParams";

const PassengerBookingClient: FC = () => {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("offerId");
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(!!idParam?.trim());
  const [error, setError] = useState<string | null>(null);
  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>("travelers");

  const stepperIndex =
    checkoutPhase === "travelers" ? 1 : 2;

  useEffect(() => {
    const id = idParam?.trim() ?? "";
    if (!id) {
      setLoading(false);
      setOffer(null);
      setError("Missing offer. Go back to search results and choose a flight.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/offers/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Could not load offer");
        }
        return json.data as Offer;
      })
      .then((data) => {
        if (!cancelled) {
          setOffer(data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load offer");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idParam]);

  const passengerUrlKey = searchParams.toString();
  const backToResultsHref = useMemo(
    () => buildListingFlightsSearchHref(searchParams) as Route,
    [passengerUrlKey, searchParams]
  );

  return (
    <div className="nc-PassengerBookingPage relative overflow-hidden">
      <BgGlassmorphism />
      <div className="container relative py-6 lg:py-10">
        <BookingSteps currentStepIndex={stepperIndex} className="mb-10" />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={backToResultsHref}
              className="text-sm font-medium text-primary-6000 hover:underline"
            >
              ← Back to search results
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {checkoutPhase === "complete"
                ? "Booking confirmed"
                : "Passenger details"}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {checkoutPhase === "complete"
                ? "Your flight is booked. You can review the confirmation below."
                : "Prices below are from the latest offer response (refreshed when you opened this page). If the airline allows pay later, you’ll continue to payment / confirmation; otherwise you’ll see confirmation here."}
            </p>
          </div>
          {offer && (
            <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-right shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <div className="text-xs uppercase tracking-wide text-neutral-500">
                Total (refreshed)
              </div>
              <div className="text-2xl font-bold text-secondary-6000">
                {offer.total_currency} {offer.total_amount}
              </div>
              {offer.expires_at && (
                <div className="mt-1 text-xs text-neutral-400">
                  Offer expires:{" "}
                  {new Date(offer.expires_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <i className="las la-spinner la-spin text-4xl text-primary-6000" />
            <p className="mt-4 text-neutral-600 dark:text-neutral-300">
              Refreshing offer…
            </p>
          </div>
        )}

        {!loading && error && (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm dark:border-red-900 dark:bg-red-950/35"
            role="alert"
          >
            <p className="text-center text-sm font-semibold text-red-900 dark:text-red-100">
              Something went wrong
            </p>
            <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-red-800 dark:text-red-200">
              {friendlyOrderErrorMessage(error)}
            </p>
            {idParam && (
              <p className="mt-4 text-center text-xs text-red-600/70 dark:text-red-400/70">
                Reference: <span className="font-mono">{idParam}</span>
              </p>
            )}
            <p className="mt-4 text-center">
              <Link
                href={backToResultsHref}
                className="text-sm font-medium text-primary-6000 hover:underline"
              >
                Back to search results
              </Link>
            </p>
          </div>
        )}

        {!loading && offer && (
          <PassengerBookingForm
            key={offer.id}
            offer={offer}
            onCheckoutPhaseChange={setCheckoutPhase}
          />
        )}
      </div>
    </div>
  );
};

export default PassengerBookingClient;
