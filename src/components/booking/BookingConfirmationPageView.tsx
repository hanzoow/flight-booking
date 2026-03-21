"use client";

import Link from "next/link";
import React, { FC, useCallback, useMemo, useState } from "react";
import type { DuffelOrderRecord } from "@/api/models";
import { Route } from "@/routers/types";

function formatDateTimeShort(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatIsoDuration(iso?: string | null): string {
  if (!iso) return "—";
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (m) {
    const h = m[1] ? `${m[1]}h ` : "";
    const min = m[2] ? `${m[2]}m` : "";
    const s = m[3] && !m[1] && !m[2] ? `${m[3]}s` : "";
    return `${h}${min}${s}`.trim() || iso;
  }
  return iso;
}

function airportShort(a?: {
  iata_code?: string;
  name?: string;
  city_name?: string;
}) {
  if (!a) return "—";
  return a.iata_code || a.city_name || a.name || "—";
}

function airportLong(a?: {
  iata_code?: string;
  name?: string;
  city_name?: string;
}) {
  if (!a) return "—";
  const name = a.name || a.city_name || "";
  const code = a.iata_code;
  if (name && code) return `${name} (${code})`;
  return name || code || "—";
}

export type ConfirmationPaymentRow = {
  id: string;
  status: string;
  amount?: string;
  currency?: string | null;
};

export interface BookingConfirmationPageViewProps {
  order: DuffelOrderRecord;
  /** Whether Duffel reports a succeeded payment for this order */
  paid: boolean;
  payments: ConfirmationPaymentRow[];
  /** Show card + balance payment blocks (main column) */
  showPayment: boolean;
  /** Success state (booking locked in after pay or already paid) */
  showConfirmed: boolean;
  paymentColumn?: React.ReactNode;
  backHref: Route;
  backLabel: string;
}

const BookingConfirmationPageView: FC<BookingConfirmationPageViewProps> = ({
  order,
  paid,
  payments,
  showPayment,
  showConfirmed,
  paymentColumn,
  backHref,
  backLabel,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }, []);

  const headlineDestination = useMemo(() => {
    const slices = order.slices ?? [];
    const lastSlice = slices[slices.length - 1];
    const segs = lastSlice?.segments ?? [];
    const lastSeg = segs[segs.length - 1];
    const dest = lastSeg?.destination ?? lastSlice?.destination;
    return (
      dest?.name ||
      dest?.city_name ||
      dest?.iata_code ||
      "your trip"
    );
  }, [order.slices]);

  const primarySlice = order.slices?.[0];
  const primarySegments = primarySlice?.segments ?? [];
  const firstSeg = primarySegments[0];
  const lastSeg = primarySegments[primarySegments.length - 1];
  const stops = Math.max(0, primarySegments.length - 1);
  const sliceDuration =
    primarySlice?.duration != null
      ? formatIsoDuration(primarySlice.duration)
      : firstSeg && lastSeg
        ? "—"
        : "—";

  const carrierLabel =
    firstSeg?.marketing_carrier?.name ||
    firstSeg?.marketing_carrier?.iata_code ||
    "Airline";
  const cabin =
    primarySlice?.fare_brand_name?.toUpperCase() || "Economy";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href={backHref}
            className="text-sm font-medium text-primary-6000 hover:underline"
          >
            {backLabel}
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                showConfirmed || paid
                  ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
              }`}
            >
              <i
                className={`las text-base ${
                  showConfirmed || paid ? "la-check-circle" : "la-clock"
                }`}
                aria-hidden
              />
              {showConfirmed || paid
                ? "Booking confirmed"
                : "Payment required"}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
            {showConfirmed || paid ? (
              <>
                You&apos;re all set for{" "}
                <span className="text-primary-6000 dark:text-primary-400">
                  {headlineDestination}
                </span>
                .
              </>
            ) : (
              <>
                Complete payment for{" "}
                <span className="text-primary-6000 dark:text-primary-400">
                  {headlineDestination}
                </span>
              </>
            )}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {showConfirmed || paid
              ? "Duffel accepted the order — keep your booking reference and order id below for support and My Booking."
              : "Your seats are on hold. Pay before the deadline below to confirm — we charge the latest total from Duffel."}
          </p>
        </div>

        {order.booking_reference && (
          <div className="shrink-0 rounded-2xl border border-neutral-200 bg-white px-6 py-5 text-left shadow-sm dark:border-neutral-700 dark:bg-neutral-900 lg:text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Booking reference
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tracking-wide text-primary-6000 dark:text-primary-400">
              {order.booking_reference}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-6 lg:col-span-7">
          {primarySlice && firstSeg && lastSeg ? (
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-6000/10 text-primary-6000 dark:bg-primary-6000/20 dark:text-primary-400">
                  <i className="las la-plane text-xl" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Flight summary
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {carrierLabel}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                  {cabin}
                </span>
              </div>

              <div className="relative mt-8 px-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
                    {airportShort(firstSeg.origin)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col items-center px-2">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {sliceDuration}
                    </span>
                    <div className="relative mt-1 h-0.5 w-full bg-neutral-200 dark:bg-neutral-600">
                      <span className="absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 dark:border-neutral-600 dark:bg-neutral-800">
                        <i className="las la-plane text-sm" aria-hidden />
                      </span>
                    </div>
                    <span className="mt-1 text-xs font-semibold uppercase text-primary-6000 dark:text-primary-400">
                      {stops === 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`}
                    </span>
                  </div>
                  <span className="text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
                    {airportShort(lastSeg.destination)}
                  </span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-neutral-500">
                      Departure
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {airportLong(firstSeg.origin)}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                      {formatDateTimeShort(firstSeg.departing_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-neutral-500">
                      Arrival
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {airportLong(lastSeg.destination)}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                      {formatDateTimeShort(lastSeg.arriving_at)}
                    </p>
                  </div>
                </div>
              </div>

              {order.slices && order.slices.length > 1 && (
                <p className="mt-6 border-t border-neutral-100 pt-4 text-xs text-neutral-500 dark:border-neutral-800">
                  + {order.slices.length - 1} more slice
                  {order.slices.length > 2 ? "s" : ""} on this order — full
                  breakdown in My Booking.
                </p>
              )}
            </section>
          ) : (
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-8">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Flight summary
              </h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Segment details are not available in this response. Check My
                Booking or your Duffel dashboard for the full itinerary.
              </p>
            </section>
          )}

          {order.passengers && order.passengers.length > 0 && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-6000/10 text-secondary-6000 dark:bg-secondary-6000/20">
                  <i className="las la-user-friends text-xl" aria-hidden />
                </span>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Passengers
                </h2>
              </div>
              <ul className="mt-6 space-y-3">
                {order.passengers.map((p, i) => {
                  const name = [p.given_name, p.family_name]
                    .filter(Boolean)
                    .join(" ");
                  const initials = [p.given_name?.[0], p.family_name?.[0]]
                    .filter(Boolean)
                    .join("")
                    .toUpperCase();
                  return (
                    <li
                      key={p.id ?? i}
                      className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/40"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-6000/15 text-sm font-bold text-primary-700 dark:bg-primary-6000/25 dark:text-primary-300">
                        {initials || "?"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {[p.title, name].filter(Boolean).join(" ") || "—"}
                        </p>
                        {p.id && (
                          <p className="mt-0.5 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                            Passenger id: {p.id}
                          </p>
                        )}
                      </div>
                      {p.type && (
                        <span className="shrink-0 text-xs font-medium uppercase text-neutral-500">
                          {p.type.replace(/_/g, " ")}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {showPayment && paymentColumn}
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-7">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Order summary
              </h3>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Order id
                  </dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="break-all font-mono text-neutral-900 dark:text-neutral-100">
                      {order.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => void copy("id", order.id)}
                      className="shrink-0 rounded-lg border border-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      {copied === "id" ? "Copied" : "Copy"}
                    </button>
                  </dd>
                </div>
                {order.booking_reference && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Booking reference
                    </dt>
                    <dd className="mt-1 font-mono text-base font-semibold text-primary-6000 dark:text-primary-400">
                      {order.booking_reference}
                    </dd>
                  </div>
                )}
                <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {paid || showConfirmed ? "Total paid" : "Amount due"}
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-secondary-6000">
                    {order.total_currency} {order.total_amount}
                  </dd>
                </div>
                {order.payment_required_by && !paid && (
                  <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/25">
                    <dt className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-300">
                      Pay by
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-amber-950 dark:text-amber-100">
                      {formatDateTimeShort(order.payment_required_by)}
                    </dd>
                  </div>
                )}
                {(order.base_amount != null || order.tax_amount != null) && (
                  <div className="space-y-2 border-t border-neutral-100 pt-4 text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                    {order.base_amount != null && (
                      <div className="flex justify-between gap-2">
                        <span>Base fare</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {order.total_currency} {order.base_amount}
                        </span>
                      </div>
                    )}
                    {order.tax_amount != null && (
                      <div className="flex justify-between gap-2">
                        <span>Taxes &amp; fees</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {order.total_currency} {order.tax_amount}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {payments.length > 0 && (
                  <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Payments
                    </dt>
                    <dd className="mt-2 space-y-2">
                      {payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 px-3 py-2 text-xs dark:border-neutral-800"
                        >
                          <span className="font-mono text-neutral-500">
                            {p.id.slice(0, 14)}…
                          </span>
                          <span className="capitalize text-neutral-700 dark:text-neutral-300">
                            {p.status.replace(/_/g, " ")}
                          </span>
                          {p.amount != null && (
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {(p.currency ?? order.total_currency) ?? ""}{" "}
                              {p.amount}
                            </span>
                          )}
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 flex flex-col gap-3 border-t border-neutral-100 pt-6 dark:border-neutral-800">
                {showConfirmed || paid ? (
                  <>
                    <span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-100 py-3 text-sm font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                      <i className="las la-check-circle text-lg text-emerald-600 dark:text-emerald-400" />
                      Booking confirmed
                    </span>
                    <Link
                      href={"/listing-flights" as Route}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-neutral-200 py-3 text-center text-sm font-semibold text-neutral-800 hover:border-primary-6000/40 hover:text-primary-6000 dark:border-neutral-600 dark:text-neutral-200 dark:hover:border-primary-400/40"
                    >
                      <i className="las la-search text-lg" />
                      Start a new search
                    </Link>
                    <Link
                      href={"/my-bookings" as Route}
                      className="text-center text-sm font-medium text-primary-6000 hover:underline"
                    >
                      Open in My Booking
                    </Link>
                  </>
                ) : (
                  <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                    Use card or Duffel balance in the payment section — amount
                    matches Duffel&apos;s latest order total.
                  </p>
                )}
              </div>
            </div>

            <p className="flex items-center justify-center gap-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
              <i className="las la-headset text-base" aria-hidden />
              <span>
                Need help? Contact your airline with the booking reference
                above.
              </span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookingConfirmationPageView;
