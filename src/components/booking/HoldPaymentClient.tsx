"use client";

import { useSearchParams } from "next/navigation";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import type { DuffelOrderRecord } from "@/api/models";
import { Route } from "@/routers/types";
import BookingConfirmationPageView from "@/components/booking/BookingConfirmationPageView";
import BookingSteps from "@/components/booking/BookingSteps";
import {
  FlightFlowPageShell,
  FlowFeedbackCard,
  FlowLoadingPanel,
} from "@/components/layout";
import DuffelCardPaymentStep from "@/components/booking/DuffelCardPaymentStep";
import DuffelTestCardsDemoPanel from "@/components/booking/DuffelTestCardsDemoPanel";
import { friendlyOrderErrorMessage } from "@/utils/offerPassengerDob";
import { addSavedOrderId } from "@/utils/savedBookings";

type OrderPayload = Pick<
  DuffelOrderRecord,
  | "id"
  | "type"
  | "booking_reference"
  | "total_amount"
  | "total_currency"
  | "payment_required_by"
>;

type PaymentRow = {
  id: string;
  status: string;
  amount?: string;
  currency?: string | null;
};

const HoldPaymentClient: FC = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId")?.trim() ?? "";
  const offerId = searchParams.get("offerId")?.trim() ?? "";

  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [fullOrder, setFullOrder] = useState<DuffelOrderRecord | null>(null);
  const [orderPaid, setOrderPaid] = useState(false);
  const [paymentsList, setPaymentsList] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payingBalance, setPayingBalance] = useState(false);
  const [payingCard, setPayingCard] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [completeRef, setCompleteRef] = useState<{
    id: string;
    booking_reference?: string;
  } | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
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
      const o = json.data.order;
      setFullOrder(o);
      setOrder({
        id: o.id,
        type: o.type,
        booking_reference: o.booking_reference,
        total_amount: o.total_amount,
        total_currency: o.total_currency,
        payment_required_by: o.payment_required_by,
      });
      setOrderPaid(json.data.paid);
      setPaymentsList(json.data.payments ?? []);
      addSavedOrderId(o.id);
      if (json.data.paid) {
        setCompleteRef({
          id: o.id,
          booking_reference: o.booking_reference ?? undefined,
        });
      } else {
        setCompleteRef(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load order");
      setOrder(null);
      setFullOrder(null);
      setPaymentsList([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("Missing order. Start again from passenger details.");
      return;
    }
    void loadOrder();
  }, [orderId, loadOrder]);

  const postPayment = useCallback(
    async (body: Record<string, string>) => {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, ...body }),
      });
      const json = (await res.json()) as {
        error?: string;
        userMessage?: string;
        code?: string;
        data?: {
          payment?: { status?: string; failure_reason?: string | null };
          order?: OrderPayload;
        };
      };
      if (!res.ok) {
        const raw = json.error || "Payment failed";
        throw new Error(
          json.userMessage ?? friendlyOrderErrorMessage(raw, json.code)
        );
      }
      const payment = json.data?.payment;
      if (payment?.status === "failed") {
        const raw = payment.failure_reason ?? "Payment failed";
        throw new Error(
          friendlyOrderErrorMessage(raw, payment.failure_reason ?? undefined)
        );
      }
      const o = json.data?.order;
      setCompleteRef({
        id: o?.id ?? orderId,
        booking_reference: o?.booking_reference ?? undefined,
      });
      addSavedOrderId(o?.id ?? orderId);
      setOrderPaid(true);
      await loadOrder();
    },
    [orderId, loadOrder]
  );

  const handleCardReady = useCallback(
    async (sessionId: string) => {
      setPayError(null);
      setPayingCard(true);
      try {
        await postPayment({ threeDSecureSessionId: sessionId });
      } catch (e) {
        setPayError(
          e instanceof Error ? e.message : "Payment could not be completed."
        );
      } finally {
        setPayingCard(false);
      }
    },
    [postPayment]
  );

  const handleBalancePay = useCallback(async () => {
    setPayError(null);
    setPayingBalance(true);
    try {
      await postPayment({});
    } catch (e) {
      setPayError(
        e instanceof Error ? e.message : "Payment could not be completed."
      );
    } finally {
      setPayingBalance(false);
    }
  }, [postPayment]);

  const showPayUi =
    order && !completeRef && order.type !== "instant";

  const showConfirmed = Boolean(completeRef && fullOrder);

  const backHref = useMemo(
    () =>
      (offerId
        ? `/listing-flights/passengers?offerId=${encodeURIComponent(offerId)}`
        : "/listing-flights") as Route,
    [offerId]
  );

  return (
    <FlightFlowPageShell
      pageClassName="nc-HoldPaymentPage"
      containerClassName="container relative py-6 lg:py-10"
    >
      <BookingSteps currentStepIndex={2} className="mb-10" />

      {loading && (
        <FlowLoadingPanel message="Loading confirmation…" />
      )}

      {!loading && error && (
        <FlowFeedbackCard
          variant="error"
          title="Something went wrong"
          description={
            <p className="mx-auto max-w-lg text-center text-sm text-red-800 dark:text-red-200">
              {friendlyOrderErrorMessage(error)}
            </p>
          }
          role="alert"
        />
      )}

      {!loading &&
        !error &&
        fullOrder &&
        order?.type !== "instant" && (
          <BookingConfirmationPageView
            order={fullOrder}
            paid={orderPaid}
            payments={paymentsList}
            showPayment={Boolean(showPayUi)}
            showConfirmed={Boolean(showConfirmed)}
            backHref={backHref}
            backLabel="← Back to passenger details"
          />
        )}

      {!loading && !error && order?.type === "instant" && !completeRef && (
        <FlowFeedbackCard
          variant="warning"
          title="This order was created as instant and is not waiting for payment on this page."
        />
      )}
    </FlightFlowPageShell>
  );
};

export default HoldPaymentClient;
