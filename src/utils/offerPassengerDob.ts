import type { Offer } from "@/api/models";
import { tripDateToIso } from "@/utils/createDuffelOrderPayload";

/** Date parts aligned with booking form (`y`/`m`/`d` strings). */
export interface TripDateParts {
  y: string;
  m: string;
  d: string;
}

/**
 * First outbound segment departure (UTC). Duffel validates passenger age against the offer;
 * using this date keeps DOB consistent with `offer.passengers[].age`.
 */
export function getOfferDepartureUtcDate(offer: Offer): Date | null {
  const raw = offer.slices?.[0]?.segments?.[0]?.departing_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * A date of birth such that the passenger is exactly `ageYears` years old on `referenceUtc`
 * (same calendar month/day as reference, minus `ageYears` years).
 */
export function tripDateForAgeAtReference(
  ageYears: number,
  referenceUtc: Date
): TripDateParts {
  const safeAge = Math.max(0, Math.floor(ageYears));
  const b = new Date(
    Date.UTC(
      referenceUtc.getUTCFullYear() - safeAge,
      referenceUtc.getUTCMonth(),
      referenceUtc.getUTCDate()
    )
  );
  const y = b.getUTCFullYear();
  const m = b.getUTCMonth() + 1;
  const d = b.getUTCDate();
  return {
    y: String(y),
    m: String(m).padStart(2, "0"),
    d: String(d).padStart(2, "0"),
  };
}

/** Completed years at `referenceUtc` (airline-style), UTC calendar. */
export function ageYearsAtReferenceUtc(
  bornOn: TripDateParts,
  referenceUtc: Date
): number | null {
  const iso = tripDateToIso(bornOn);
  if (!iso) return null;
  const birth = new Date(`${iso}T12:00:00.000Z`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = referenceUtc.getUTCFullYear() - birth.getUTCFullYear();
  const md =
    referenceUtc.getUTCMonth() * 32 + referenceUtc.getUTCDate() -
    (birth.getUTCMonth() * 32 + birth.getUTCDate());
  if (md < 0) age -= 1;
  return age;
}

export function birthMatchesOfferAge(
  bornOn: TripDateParts,
  offerAge: number | undefined,
  referenceUtc: Date
): boolean {
  if (offerAge === undefined || offerAge === null) return true;
  const computed = ageYearsAtReferenceUtc(bornOn, referenceUtc);
  if (computed === null) return false;
  return computed === offerAge;
}

/** Map Duffel / airline messages to short user-facing copy for booking UI. */
export function friendlyOrderErrorMessage(raw: string, errorCode?: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("age") &&
    lower.includes("date of birth") &&
    lower.includes("match")
  ) {
    return "Date of birth must match each traveller’s age from your original search (children and infants). Use the date of birth that makes them the same age on the flight date—check child and infant rows, then try again.";
  }
  if (lower.includes("offer") && lower.includes("expired")) {
    return "This offer has expired. Go back to the results and select the flight again to get a fresh price.";
  }
  if (errorCode === "offer_expired" || errorCode === "offer_no_longer_available") {
    return "This offer is no longer available. Return to search results and choose the flight again.";
  }

  // Payments — https://duffel.com/docs/api/v2/payments/create-a-payment
  if (
    errorCode === "payment_amount_does_not_match_order_amount" ||
    lower.includes("payment") && lower.includes("amount") && lower.includes("match")
  ) {
    return "The price changed since we last loaded your booking. Refresh this page and try paying again with the updated total.";
  }
  if (
    errorCode === "payment_currency_does_not_match_order_currency" ||
    (lower.includes("currency") && lower.includes("match") && lower.includes("payment"))
  ) {
    return "Currency no longer matches the order. Refresh and try again, or start a new search.";
  }
  if (errorCode === "order_type_not_eligible_for_payment") {
    return "This order can’t be paid here (it isn’t a held booking). If you already paid, check your confirmation email.";
  }
  if (errorCode === "already_paid" || (lower.includes("already") && lower.includes("paid"))) {
    return "This booking is already paid. You don’t need to pay again.";
  }
  if (errorCode === "already_cancelled" || (lower.includes("cancelled") && lower.includes("order"))) {
    return "This booking was cancelled. Start a new search to book again.";
  }
  if (errorCode === "past_payment_required_by_date" || lower.includes("payment_required_by")) {
    return "The time limit to pay for this held booking has passed. Search again and rebook.";
  }
  if (errorCode === "schedule_changed" || lower.includes("schedule_changed")) {
    return "The airline changed this itinerary, so this held booking can’t be paid. Start again with a new search.";
  }
  if (errorCode === "price_changed" || (lower.includes("price") && lower.includes("chang"))) {
    return "The airline updated the price. Refresh to see the latest total, then try paying again.";
  }
  if (
    lower.includes("ineligible_airline_credit") ||
    errorCode === "ineligible_airline_credit"
  ) {
    return "That airline credit can’t be used for this payment. Use another payment method or contact support.";
  }
  return raw;
}
