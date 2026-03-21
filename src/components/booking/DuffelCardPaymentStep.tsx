"use client";

import React, { FC, useCallback, useEffect, useState } from "react";
import {
  createThreeDSecureSession,
  DuffelCardForm,
  useDuffelCardFormActions,
} from "@duffel/components";

export interface DuffelCardPaymentStepProps {
  resourceId: string;
  resourceKind: "offer" | "order";
  orderIdForClientKey?: string;
  onReadyForPayment: (threeDSecureSessionId: string) => void | Promise<void>;
  submitInProgress?: boolean;
  summary?: React.ReactNode;
}

/**
 * Duffel PCI card form + 3DS. For hold orders use resourceKind="order" and resourceId = order id.
 * @see https://duffel.com/docs/guides/card-form-component-with-3dsecure
 */
const DuffelCardPaymentStep: FC<DuffelCardPaymentStepProps> = ({
  resourceId,
  resourceKind,
  orderIdForClientKey,
  onReadyForPayment,
  submitInProgress = false,
  summary,
}) => {
  const { ref, createCardForTemporaryUse } = useDuffelCardFormActions();
  const [clientKey, setClientKey] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [cardValid, setCardValid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setKeyLoading(true);
    setKeyError(null);
    setClientKey(null);

    (async () => {
      try {
        const res = await fetch("/api/component-client-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            orderIdForClientKey?.trim()
              ? { orderId: orderIdForClientKey.trim() }
              : {}
          ),
        });
        const json = (await res.json()) as {
          clientKey?: string;
          userMessage?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(
            json.userMessage ?? json.error ?? "Could not start secure payment."
          );
        }
        if (!json.clientKey?.trim()) {
          throw new Error("Invalid payment setup response.");
        }
        setClientKey(json.clientKey);
      } catch (e) {
        if (!cancelled) {
          setKeyError(
            e instanceof Error ? e.message : "Could not start secure payment."
          );
        }
      } finally {
        if (!cancelled) setKeyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderIdForClientKey, resourceId, resourceKind]);

  const runSecurePayment = useCallback(() => {
    if (!clientKey) return;
    setStepError(null);
    setBusy(true);
    try {
      createCardForTemporaryUse();
    } catch (e) {
      setStepError(
        e instanceof Error ? e.message : "Could not start card tokenisation."
      );
      setBusy(false);
    }
  }, [clientKey, createCardForTemporaryUse]);

  const onCardTempSuccess = useCallback(
    async (card: { id: string }) => {
      if (!clientKey) {
        setBusy(false);
        setStepError("Payment session expired. Refresh the page.");
        return;
      }
      try {
        const session = await createThreeDSecureSession(
          clientKey,
          card.id,
          resourceId,
          [],
          true
        );
        if (session.status !== "ready_for_payment") {
          setStepError(
            session.status === "failed"
              ? "Card authentication failed. Try another card or check your details."
              : "Authentication did not complete. Please try again."
          );
          setBusy(false);
          return;
        }
        await onReadyForPayment(session.id);
      } catch (e) {
        setStepError(
          e instanceof Error
            ? e.message
            : "3D Secure or payment setup failed. Try again."
        );
      } finally {
        setBusy(false);
      }
    },
    [clientKey, onReadyForPayment, resourceId]
  );

  if (keyLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <i className="las la-spinner la-spin text-3xl text-primary-6000" />
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
          Starting secure card checkout…
        </p>
      </div>
    );
  }

  if (keyError || !clientKey) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/35 dark:text-red-200"
        role="alert"
      >
        {keyError ?? "Could not load the payment form."}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-8">
      {summary}
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        Card details
      </h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Card data is collected by Duffel (PCI). Use Duffel test cards in test
        mode —{" "}
        <a
          href="https://duffel.com/docs/guides/paying-with-customer-cards#testing-your-integration"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary-6000 hover:underline"
        >
          testing guide
        </a>
        .
      </p>
      <div className="mt-6 [&_iframe]:max-w-full">
        <DuffelCardForm
          ref={ref}
          clientKey={clientKey}
          intent="to-create-card-for-temporary-use"
          onValidateSuccess={() => setCardValid(true)}
          onValidateFailure={() => setCardValid(false)}
          onCreateCardForTemporaryUseSuccess={(data) => {
            void onCardTempSuccess(data);
          }}
          onCreateCardForTemporaryUseFailure={(err) => {
            setBusy(false);
            setStepError(err.message || "Could not verify the card.");
          }}
        />
      </div>
      {stepError && (
        <p
          className="mt-4 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {stepError}
        </p>
      )}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          disabled={!cardValid || busy || submitInProgress}
          onClick={runSecurePayment}
          className="rounded-2xl bg-primary-6000 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy || submitInProgress
            ? "Processing…"
            : "Verify card & pay"}
        </button>
      </div>
    </div>
  );
};

export default DuffelCardPaymentStep;
