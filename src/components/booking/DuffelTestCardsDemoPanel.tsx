"use client";

import React, { FC, useCallback, useState } from "react";

/**
 * Reference panel for Duffel test mode — matches
 * https://duffel.com/docs/guides/paying-with-customer-cards#testing-your-integration
 * Test flights should use Duffel Airways (or suppliers Duffel documents for card tests).
 */
const ROWS = [
  {
    outcome: "Success (3DS challenge)",
    detail:
      "Complete the challenge; use verification code below for pass / fail.",
    visa: "4242424242424242",
    mastercard: "5555555555554444",
    amex: "378282246310005",
  },
  {
    outcome: "Success (no 3DS)",
    detail: "Often skips the challenge modal in test.",
    visa: "4111110116638870",
    mastercard: "5555550130659057",
    amex: "378282246310005",
  },
] as const;

function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      /* ignore */
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="group inline-flex max-w-full items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 font-mono text-xs text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
      title="Copy"
    >
      <span className="truncate">{value}</span>
      <span className="shrink-0 text-[10px] font-sans font-medium text-primary-6000">
        {done ? "Copied" : label ?? "Copy"}
      </span>
    </button>
  );
}

const DuffelTestCardsDemoPanel: FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <aside
      className={`rounded-2xl border border-sky-200 bg-sky-50/90 p-5 dark:border-sky-900/60 dark:bg-sky-950/25 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-200">
        Demo / proposal — Duffel test cards
      </p>
      <p className="mt-2 text-sm text-sky-950/90 dark:text-sky-100/90">
        Use{" "}
        <strong>test mode</strong> and offers from suppliers Duffel documents for
        card testing (e.g. Duffel Airways). Expiry: any future date. CVC: any{" "}
        <strong>3</strong> digits (Visa/MC) or <strong>4</strong> (Amex). Billing
        address: any valid values.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-sky-200/80 dark:border-sky-800">
              <th className="py-2 pr-3 font-semibold text-sky-950 dark:text-sky-100">
                Scenario
              </th>
              <th className="py-2 pr-3 font-semibold text-sky-950 dark:text-sky-100">
                Visa
              </th>
              <th className="py-2 pr-3 font-semibold text-sky-950 dark:text-sky-100">
                Mastercard
              </th>
              <th className="py-2 font-semibold text-sky-950 dark:text-sky-100">
                Amex
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.outcome}
                className="border-b border-sky-100 dark:border-sky-900/40"
              >
                <td className="py-3 pr-3 align-top text-sky-900 dark:text-sky-200">
                  <div className="font-medium">{row.outcome}</div>
                  <div className="mt-1 text-[11px] text-sky-800/80 dark:text-sky-300/80">
                    {row.detail}
                  </div>
                </td>
                <td className="py-3 pr-3 align-top">
                  <CopyBtn value={row.visa} />
                </td>
                <td className="py-3 pr-3 align-top">
                  <CopyBtn value={row.mastercard} />
                </td>
                <td className="py-3 align-top">
                  <CopyBtn value={row.amex} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-4 space-y-3 text-sm text-sky-950 dark:text-sky-100">
        <li>
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">
            3DS challenge → success
          </p>
          <p className="mt-1 text-sky-900/95 dark:text-sky-200/90">
            When the challenge screen appears, enter verification code{" "}
            <code className="rounded bg-white/90 px-1.5 py-0.5 font-mono dark:bg-neutral-800">
              111-111
            </code>{" "}
            (include the dash).{" "}
            <span className="mt-1 block sm:mt-0 sm:inline">
              <CopyBtn value="111-111" label="Copy code" />
            </span>
          </p>
        </li>
        <li>
          <p className="font-semibold text-red-800 dark:text-red-300">
            3DS challenge → failed / denied
          </p>
          <p className="mt-1 text-sky-900/95 dark:text-sky-200/90">
            Enter <strong>any other</strong> code than{" "}
            <code className="rounded bg-white/90 px-1 font-mono dark:bg-neutral-800">
              111-111
            </code>
            .
          </p>
        </li>
        <li>
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Payment declined (after card + 3DS)
          </p>
          <p className="mt-1 text-sky-900/95 dark:text-sky-200/90">
            In the Duffel form, set <strong>cardholder name</strong> to exactly{" "}
            <code className="rounded bg-white/90 px-1 font-mono dark:bg-neutral-800">
              Declined
            </code>{" "}
            (Duffel flights test).{" "}
            <CopyBtn value="Declined" label="Copy name" />
          </p>
        </li>
      </ul>

      <p className="mt-3 text-[11px] text-sky-800/70 dark:text-sky-400/80">
        Source:{" "}
        <a
          href="https://duffel.com/docs/guides/paying-with-customer-cards#testing-your-integration"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Duffel — Paying with customer cards (testing)
        </a>
      </p>
    </aside>
  );
};

export default DuffelTestCardsDemoPanel;
