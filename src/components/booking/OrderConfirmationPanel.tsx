"use client";

import React, { FC, useCallback, useState } from "react";
import type { DuffelOrderRecord } from "@/api/models";

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
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
    const h = m[1] ? `${m[1]}h` : "";
    const min = m[2] ? `${m[2]}m` : "";
    const s = m[3] && !m[1] && !m[2] ? `${m[3]}s` : "";
    const out = [h, min, s].filter(Boolean).join(" ");
    return out || iso;
  }
  return iso;
}

function airportLabel(a?: { iata_code?: string; name?: string; city_name?: string }) {
  if (!a) return "—";
  const code = a.iata_code ?? "";
  const place = a.city_name || a.name || "";
  if (code && place) return `${code} · ${place}`;
  return code || place || "—";
}

export interface OrderConfirmationPanelProps {
  order: DuffelOrderRecord;
  paid?: boolean;
  payments?: Array<{
    id: string;
    status: string;
    amount?: string;
    currency?: string | null;
  }>;
  /** “success” = green hero; “neutral” for list / secondary views */
  tone?: "success" | "neutral";
  className?: string;
  footer?: React.ReactNode;
}

const OrderConfirmationPanel: FC<OrderConfirmationPanelProps> = ({
  order,
  paid,
  payments,
  tone = "success",
  className = "",
  footer,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback(async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }, []);

  const hero =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
      : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <div className={`space-y-6 ${className}`}>
      <div className={`rounded-2xl border p-6 sm:p-8 ${hero}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {paid === false
                ? "Order details"
                : tone === "success"
                  ? "Booking confirmed"
                  : "Order"}
            </p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {paid === false
                ? "Complete payment before the deadline to confirm this booking."
                : "Keep your order id and booking reference for support and check-in."}
            </p>
          </div>
          {order.booking_reference && (
            <div className="mt-2 text-right sm:mt-0">
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Booking reference
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-primary-6000 dark:text-primary-400">
                {order.booking_reference}
              </div>
            </div>
          )}
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-600/50 dark:bg-neutral-900/40">
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Order id
            </dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <span className="break-all font-mono text-sm text-neutral-900 dark:text-neutral-100">
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
          {order.offer_id && (
            <div className="rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-600/50 dark:bg-neutral-900/40">
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Offer id
              </dt>
              <dd className="mt-1 break-all font-mono text-sm text-neutral-800 dark:text-neutral-200">
                {order.offer_id}
              </dd>
            </div>
          )}
          <div className="rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-600/50 dark:bg-neutral-900/40">
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Order type
            </dt>
            <dd className="mt-1 text-sm font-medium capitalize text-neutral-900 dark:text-neutral-100">
              {order.type ?? "—"}
            </dd>
          </div>
          {order.created_at && (
            <div className="rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-600/50 dark:bg-neutral-900/40">
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Created
              </dt>
              <dd className="mt-1 text-sm text-neutral-800 dark:text-neutral-200">
                {formatDateTime(order.created_at)}
              </dd>
            </div>
          )}
          {order.payment_required_by && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <dt className="text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-300">
                Pay by
              </dt>
              <dd className="mt-1 text-sm font-medium text-amber-950 dark:text-amber-100">
                {formatDateTime(order.payment_required_by)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {order.slices && order.slices.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-8">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Flight itinerary
          </h3>
          <div className="mt-6 space-y-8">
            {order.slices.map((slice, si) => (
              <div key={slice.id ?? si}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {airportLabel(slice.origin)} → {airportLabel(slice.destination)}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                    {slice.duration && (
                      <span>Slice duration: {formatIsoDuration(slice.duration)}</span>
                    )}
                    {slice.fare_brand_name && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
                        {slice.fare_brand_name}
                      </span>
                    )}
                  </div>
                </div>
                <ol className="mt-4 space-y-4">
                  {(slice.segments ?? []).map((seg, gi) => {
                    const carrier =
                      seg.marketing_carrier?.name ||
                      seg.marketing_carrier?.iata_code ||
                      "";
                    const fn = seg.marketing_carrier_flight_number ?? "";
                    const flightLabel =
                      carrier && fn
                        ? `${carrier} ${fn}`
                        : carrier || fn || "Flight";

                    return (
                      <li
                        key={seg.id ?? `${si}-${gi}`}
                        className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {flightLabel}
                          </span>
                          {seg.duration && (
                            <span className="text-xs text-neutral-500">
                              {formatIsoDuration(seg.duration)}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase text-neutral-500">
                              Departure
                            </div>
                            <div className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {formatDateTime(seg.departing_at)}
                            </div>
                            <div className="text-xs text-neutral-600 dark:text-neutral-400">
                              {airportLabel(seg.origin)}
                              {seg.origin_terminal != null && seg.origin_terminal !== ""
                                ? ` · T${seg.origin_terminal}`
                                : ""}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase text-neutral-500">
                              Arrival
                            </div>
                            <div className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {formatDateTime(seg.arriving_at)}
                            </div>
                            <div className="text-xs text-neutral-600 dark:text-neutral-400">
                              {airportLabel(seg.destination)}
                              {seg.destination_terminal != null &&
                              seg.destination_terminal !== ""
                                ? ` · T${seg.destination_terminal}`
                                : ""}
                            </div>
                          </div>
                        </div>
                        {seg.aircraft?.name && (
                          <p className="mt-2 text-xs text-neutral-500">
                            Aircraft: {seg.aircraft.name}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {order.passengers && order.passengers.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-8">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Travellers
          </h3>
          <ul className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
            {order.passengers.map((p, i) => (
              <li
                key={p.id ?? i}
                className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0"
              >
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {[p.title, p.given_name, p.family_name]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </span>
                <span className="text-xs uppercase text-neutral-500">
                  {p.type?.replace(/_/g, " ") ?? ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-8">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Price
        </h3>
        <dl className="mt-4 space-y-2 text-sm">
          {order.base_amount != null && (
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Base</dt>
              <dd className="font-medium text-neutral-900 dark:text-neutral-100">
                {order.total_currency} {order.base_amount}
              </dd>
            </div>
          )}
          {order.tax_amount != null && (
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Taxes &amp; fees</dt>
              <dd className="font-medium text-neutral-900 dark:text-neutral-100">
                {order.total_currency} {order.tax_amount}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-neutral-100 pt-3 text-base dark:border-neutral-800">
            <dt className="font-semibold text-neutral-900 dark:text-neutral-100">
              Total
            </dt>
            <dd className="font-bold text-secondary-6000">
              {order.total_currency} {order.total_amount}
            </dd>
          </div>
        </dl>
      </section>

      {payments && payments.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-8">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Payments
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800"
              >
                <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                  {p.id}
                </span>
                <span className="capitalize text-neutral-800 dark:text-neutral-200">
                  {p.status.replace(/_/g, " ")}
                </span>
                {p.amount != null && (
                  <span className="font-medium">
                    {(p.currency ?? order.total_currency) ?? ""} {p.amount}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {footer && <div className="flex flex-wrap gap-3">{footer}</div>}
    </div>
  );
};

export default OrderConfirmationPanel;
