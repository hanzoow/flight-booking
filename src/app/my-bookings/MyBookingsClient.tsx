"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import type { DuffelOrderRecord } from "@/api/models";
import { Route } from "@/routers/types";
import BookingSteps from "@/components/booking/BookingSteps";
import BgGlassmorphism from "@/components/BgGlassmorphism";
import OrderConfirmationPanel from "@/components/booking/OrderConfirmationPanel";
import { friendlyOrderErrorMessage } from "@/utils/offerPassengerDob";
import {
  addSavedOrderId,
  getSavedOrderIds,
  removeSavedOrderId,
} from "@/utils/savedBookings";

type PaymentRow = {
  id: string;
  status: string;
  amount?: string;
  currency?: string | null;
};

const MyBookingsClient: FC = () => {
  const searchParams = useSearchParams();
  const orderFromQuery = searchParams.get("orderId")?.trim() ?? "";

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [manualId, setManualId] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const [order, setOrder] = useState<DuffelOrderRecord | null>(null);
  const [paid, setPaid] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSaved = useCallback(() => {
    setSavedIds(getSavedOrderIds());
  }, []);

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  useEffect(() => {
    if (orderFromQuery) {
      setActiveId(orderFromQuery);
      addSavedOrderId(orderFromQuery);
      refreshSaved();
    }
  }, [orderFromQuery, refreshSaved]);

  const loadOrder = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(trimmed)}`);
      const json = (await res.json()) as {
        error?: string;
        userMessage?: string;
        code?: string;
        data?: {
          order: DuffelOrderRecord;
          paid: boolean;
          payments?: PaymentRow[];
        };
      };
      if (!res.ok) {
        const raw = json.error || "Could not load order";
        throw new Error(
          json.userMessage ?? friendlyOrderErrorMessage(raw, json.code)
        );
      }
      if (!json.data?.order) throw new Error("Invalid order response");
      setOrder(json.data.order);
      setPaid(json.data.paid);
      setPayments(json.data.payments ?? []);
      addSavedOrderId(trimmed);
      refreshSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load order");
    } finally {
      setLoading(false);
    }
  }, [refreshSaved]);

  useEffect(() => {
    if (!activeId) return;
    void loadOrder(activeId);
  }, [activeId, loadOrder]);

  const sortedSaved = useMemo(
    () => [...savedIds].filter(Boolean),
    [savedIds]
  );

  return (
    <div className="nc-MyBookingsPage relative overflow-hidden">
      <BgGlassmorphism />
      <div className="container relative py-6 lg:py-10">
        <div className="mb-8">
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            My Booking
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
            Open a saved order from this device or paste a Duffel order id. Data
            is loaded from Duffel via our API (same confirmation view as after
            payment).
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <aside className="space-y-6 lg:col-span-4">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Load by id
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Paste an order id (e.g. from email or payment URL).
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="ord_xxx"
                  className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-950"
                />
                <button
                  type="button"
                  onClick={() => {
                    const id = manualId.trim();
                    if (!id) return;
                    setActiveId(id);
                  }}
                  className="shrink-0 rounded-xl bg-primary-6000 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Load
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Saved on this device
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Order ids stored in your browser after booking or payment.
              </p>
              {sortedSaved.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">
                  No saved orders yet. Complete a booking to save one here.
                </p>
              ) : (
                <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                  {sortedSaved.map((id) => (
                    <li
                      key={id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                        activeId === id
                          ? "border-primary-6000 bg-primary-6000/5"
                          : "border-neutral-100 dark:border-neutral-800"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveId(id)}
                        className="min-w-0 flex-1 truncate text-left font-mono text-xs text-neutral-800 hover:text-primary-6000 dark:text-neutral-200"
                      >
                        {id}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeSavedOrderId(id);
                          refreshSaved();
                          if (activeId === id) {
                            setActiveId(null);
                            setOrder(null);
                          }
                        }}
                        className="shrink-0 text-xs text-red-600 hover:underline dark:text-red-400"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>

          <div className="lg:col-span-8">
            {!activeId && (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400">
                Select a saved order or enter an id to view confirmation
                details.
              </div>
            )}

            {activeId && loading && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
                <i className="las la-spinner la-spin text-4xl text-primary-6000" />
                <p className="mt-4 text-neutral-600 dark:text-neutral-300">
                  Loading order…
                </p>
              </div>
            )}

            {activeId && !loading && error && (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950/35"
                role="alert"
              >
                <p className="text-center text-sm font-semibold text-red-900 dark:text-red-100">
                  Could not load order
                </p>
                <p className="mx-auto mt-3 max-w-lg text-center text-sm text-red-800 dark:text-red-200">
                  {friendlyOrderErrorMessage(error)}
                </p>
                <p className="mt-2 text-center text-xs text-red-700/80 dark:text-red-300/80">
                  <span className="font-mono">{activeId}</span>
                </p>
              </div>
            )}

            {activeId && !loading && !error && order && (
              <OrderConfirmationPanel
                order={order}
                paid={paid}
                payments={payments}
                tone="neutral"
                footer={
                  <Link
                    href={"/listing-flights" as Route}
                    className="inline-flex rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    New search
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookingsClient;
