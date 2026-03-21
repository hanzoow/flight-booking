"use client";

import Image from "next/image";
import Link from "next/link";
import React, { FC, useState } from "react";
import { Offer, OfferSlice, Segment } from "@/api/models";
import { Route } from "@/routers/types";
import { buildPassengersOfferHrefFromListingQuery } from "@/utils/flightListingSearchParams";
import { getStopLabelForSegments } from "@/utils/flightStops";

export interface FlightCardProps {
  className?: string;
  data: Offer;
  /** Summary row uses this slice (0 = outbound, 1 = return). Default 0. */
  primarySliceIndex?: 0 | 1;
  /** Override price shown in the summary column (e.g. “from” min for outbound groups). */
  headlinePrice?: {
    amount: string;
    currency: string;
    subtitle?: string;
  };
  /** Replace default “Select & continue” footer */
  footer?: React.ReactNode;
  /** Serialized listing search (`origin`, `departDate`, …) to keep when opening passengers */
  listingSearchQuery?: string;
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : "";
  const m = match[2] ? ` ${match[2]}m` : "";
  return `${h}${m}`.trim();
}

function formatTime(datetime: string): string {
  const d = new Date(datetime);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(datetime: string): string {
  const d = new Date(datetime);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** IATA codes in travel order: in-flight stops first per segment, then connection airports between segments */
function getStopAirportCodes(segments: Segment[]): string[] {
  const codes: string[] = [];
  segments.forEach((seg, idx) => {
    for (const st of seg.stops ?? []) {
      const code = st.airport?.iata_code;
      if (code) codes.push(code);
    }
    if (idx < segments.length - 1) {
      const code = seg.destination?.iata_code;
      if (code) codes.push(code);
    }
  });
  return codes;
}

function getStopDetail(segments: Segment[]): string {
  const codes = getStopAirportCodes(segments);
  return codes.join(", ");
}

function getCarrierLogoUrl(iataCode: string): string {
  return `https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/${iataCode}.svg`;
}

const FlightCard: FC<FlightCardProps> = ({
  className = "",
  data,
  primarySliceIndex = 0,
  headlinePrice,
  footer,
  listingSearchQuery,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const summarySlice = data.slices[primarySliceIndex] ?? data.slices[0];
  if (!summarySlice || summarySlice.segments.length === 0) return null;

  const firstSeg = summarySlice.segments[0];
  const lastSeg = summarySlice.segments[summarySlice.segments.length - 1];
  const carrier = firstSeg.operating_carrier;
  const departTime = formatTime(firstSeg.departing_at);
  const arriveTime = formatTime(lastSeg.arriving_at);
  const originCode = firstSeg.origin.iata_code;
  const destCode = lastSeg.destination.iata_code;
  const duration = parseDuration(summarySlice.duration);
  const stopLabel = getStopLabelForSegments(summarySlice.segments);
  const stopDetail = getStopDetail(summarySlice.segments);
  const stopDetailTitle =
    stopDetail || "No intermediate stops or connections";

  const renderSliceDetail = (slice: OfferSlice, label: string) => {
    return (
      <div className="mb-6 last:mb-0">
        <div className="text-xs font-semibold text-primary-6000 uppercase tracking-wide mb-3">
          {label}
        </div>
        {slice.segments.map((seg, idx) => (
          <div key={seg.id}>
            <div className="flex flex-col md:flex-row">
              <div className="w-24 md:w-20 lg:w-24 flex-shrink-0 md:pt-7">
                <Image
                  src={
                    seg.operating_carrier.logo_symbol_url ??
                    getCarrierLogoUrl(seg.operating_carrier.iata_code)
                  }
                  className="w-10"
                  alt={seg.operating_carrier.name}
                  sizes="40px"
                  width={40}
                  height={40}
                />
              </div>
              <div className="flex my-5 md:my-0">
                <div className="flex-shrink-0 flex flex-col items-center py-2">
                  <span className="block w-6 h-6 rounded-full border border-neutral-400"></span>
                  <span className="block flex-grow border-l border-neutral-400 border-dashed my-1"></span>
                  <span className="block w-6 h-6 rounded-full border border-neutral-400"></span>
                </div>
                <div className="ml-4 space-y-10 text-sm">
                  <div className="flex flex-col space-y-1">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {formatDate(seg.departing_at)} · {formatTime(seg.departing_at)}
                    </span>
                    <span className="font-semibold">
                      {seg.origin.name} ({seg.origin.iata_code})
                    </span>
                  </div>
                  {(seg.stops ?? []).map((stop) => (
                    <div
                      key={stop.id}
                      className="flex flex-col space-y-1 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2 -mx-1 border border-amber-100 dark:border-amber-900/50"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Stop · {stop.airport?.iata_code}
                      </span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {stop.airport?.name}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatDate(stop.arriving_at)} · arr {formatTime(stop.arriving_at)}
                        <span className="mx-1">→</span>
                        dep {formatTime(stop.departing_at)}
                        {stop.duration && (
                          <span className="ml-2 text-amber-700/90 dark:text-amber-400/90">
                            ({parseDuration(stop.duration)} on ground)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  <div className="flex flex-col space-y-1">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {formatDate(seg.arriving_at)} · {formatTime(seg.arriving_at)}
                    </span>
                    <span className="font-semibold">
                      {seg.destination.name} ({seg.destination.iata_code})
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-l border-neutral-200 dark:border-neutral-700 md:mx-6 lg:mx-10"></div>
              <ul className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1 md:space-y-2">
                <li>Flight time: {parseDuration(seg.duration)}</li>
                <li>
                  {seg.operating_carrier.name} · {seg.passengers[0]?.cabin_class_marketing_name ?? seg.passengers[0]?.cabin_class} ·{" "}
                  {seg.aircraft?.name ?? ""} · {seg.marketing_carrier.iata_code} {seg.marketing_carrier_flight_number}
                </li>
              </ul>
            </div>
            {idx < slice.segments.length - 1 && (
              <div className="my-7 md:my-10 space-y-5 md:pl-24">
                <div className="border-t border-neutral-200 dark:border-neutral-700" />
                <div className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
                  Layover: {parseDuration(
                    computeLayover(seg.arriving_at, slice.segments[idx + 1].departing_at)
                  )} — {seg.destination.name} ({seg.destination.iata_code})
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-700" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderDetail = () => {
    if (!isOpen) return null;
    return (
      <div className="p-4 md:p-8 border border-neutral-200 dark:border-neutral-700 rounded-2xl">
        {data.slices.map((slice, idx) => (
          <React.Fragment key={slice.id}>
            {renderSliceDetail(
              slice,
              idx === 0 ? "Outbound" : "Return"
            )}
          </React.Fragment>
        ))}
        {data.conditions && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 text-xs text-neutral-500">
            {data.conditions.change_before_departure?.allowed && (
              <span className="flex items-center gap-1">
                <i className="las la-exchange-alt text-green-500"></i>
                Changeable
                {data.conditions.change_before_departure.penalty_amount !== "0" &&
                  data.conditions.change_before_departure.penalty_amount && (
                    <span>
                      (fee: {data.conditions.change_before_departure.penalty_currency}{" "}
                      {data.conditions.change_before_departure.penalty_amount})
                    </span>
                  )}
              </span>
            )}
            {data.conditions.refund_before_departure?.allowed && (
              <span className="flex items-center gap-1">
                <i className="las la-undo text-green-500"></i>
                Refundable
                {data.conditions.refund_before_departure.penalty_amount !== "0" &&
                  data.conditions.refund_before_departure.penalty_amount && (
                    <span>
                      (fee: {data.conditions.refund_before_departure.penalty_currency}{" "}
                      {data.conditions.refund_before_departure.penalty_amount})
                    </span>
                  )}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`nc-FlightCard group p-4 sm:p-6 relative bg-white dark:bg-neutral-900 border border-neutral-100
     dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow space-y-6 ${className}`}
    >
      <div className={`sm:pr-20 relative`}>
        <span
          className={`absolute right-0 bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 w-10 h-10 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center cursor-pointer ${
            isOpen ? "transform -rotate-180" : ""
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <i className="text-xl las la-angle-down"></i>
        </span>

        <div className="flex flex-col sm:flex-row sm:items-center space-y-6 sm:space-y-0">
          {/* LOGO */}
          <div className="w-24 lg:w-32 flex-shrink-0">
            <Image
              src={
                carrier.logo_symbol_url ??
                getCarrierLogoUrl(carrier.iata_code)
              }
              width={40}
              height={40}
              className="w-10"
              alt={carrier.name}
              sizes="40px"
            />
          </div>

          {/* MOBILE LAYOUT */}
          <div className="block lg:hidden space-y-1">
            <div className="flex font-semibold">
              <div>
                <span>{departTime}</span>
                <span className="flex items-center text-sm text-neutral-500 font-normal mt-0.5">
                  {originCode}
                </span>
              </div>
              <span className="w-12 flex justify-center">
                <i className="text-2xl las la-long-arrow-alt-right"></i>
              </span>
              <div>
                <span>{arriveTime}</span>
                <span className="flex items-center text-sm text-neutral-500 font-normal mt-0.5">
                  {destCode}
                </span>
              </div>
            </div>
            <div
              className="text-sm text-neutral-500 font-normal mt-0.5"
              title={stopDetailTitle}
            >
              <span>{stopLabel}</span>
              <span className="mx-2">·</span>
              <span>{duration}</span>
              {stopDetail && (
                <>
                  <span className="mx-2">·</span>
                  <span className="truncate inline-block max-w-[200px] sm:max-w-xs align-bottom">
                    {stopDetail}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* DESKTOP: TIME + AIRLINE */}
          <div className="hidden lg:block min-w-[150px] flex-[4]">
            <div className="font-medium text-lg">
              {departTime} — {arriveTime}
            </div>
            <div className="text-sm text-neutral-500 font-normal mt-0.5">
              {carrier.name}
            </div>
          </div>

          {/* DESKTOP: ROUTE */}
          <div className="hidden lg:block flex-[4] whitespace-nowrap">
            <div className="font-medium text-lg">
              {originCode} — {destCode}
            </div>
            <div className="text-sm text-neutral-500 font-normal mt-0.5">
              {duration}
            </div>
          </div>

          {/* DESKTOP: STOPS */}
          <div className="hidden lg:block flex-[4] min-w-0">
            <div className="font-medium text-lg">{stopLabel}</div>
            {stopDetail ? (
              <div
                className="text-sm text-neutral-500 font-normal mt-0.5 line-clamp-2"
                title={stopDetailTitle}
              >
                {stopDetail}
              </div>
            ) : (
              <div className="text-sm text-neutral-400 font-normal mt-0.5">
                Direct
              </div>
            )}
          </div>

          {/* PRICE */}
          <div className="flex-[4] whitespace-nowrap sm:text-right">
            <div>
              <span className="text-xl font-semibold text-secondary-6000">
                {headlinePrice
                  ? `${headlinePrice.currency} ${headlinePrice.amount}`
                  : `${data.total_currency} ${data.total_amount}`}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5">
              {headlinePrice?.subtitle ??
                (data.slices.length > 1 ? "round-trip" : "one-way")}
            </div>
          </div>
        </div>
      </div>

      {renderDetail()}

      {footer !== undefined ? (
        <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
          {footer}
        </div>
      ) : (
        <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href={
              buildPassengersOfferHrefFromListingQuery(
                data.id,
                listingSearchQuery
              ) as Route
            }
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary-6000 px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
          >
            Select &amp; continue
          </Link>
        </div>
      )}
    </div>
  );
};

function computeLayover(arrivalAt: string, nextDepartureAt: string): string {
  const diff =
    new Date(nextDepartureAt).getTime() - new Date(arrivalAt).getTime();
  const totalMin = Math.round(diff / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `PT${h}H${m}M`;
}

export default FlightCard;
