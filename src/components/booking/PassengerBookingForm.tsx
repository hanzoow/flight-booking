"use client";

import { useRouter } from "next/navigation";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Route } from "@/routers/types";
import type { Offer, OfferPassenger } from "@/api/models";
import Input from "@/shared/Input";
import Select from "@/shared/Select";
import { tripDateToIso } from "@/utils/createDuffelOrderPayload";
import {
  getOfferDepartureUtcDate,
  tripDateForAgeAtReference,
  birthMatchesOfferAge,
  friendlyOrderErrorMessage,
} from "@/utils/offerPassengerDob";
import {
  getAgeBadgeText,
  getTravellerBadge,
  travellerBadgeClass,
} from "@/utils/bookingPassenger";
import type { DuffelOrderRecord } from "@/api/models";
import OrderConfirmationPanel from "@/components/booking/OrderConfirmationPanel";
import { addSavedOrderId } from "@/utils/savedBookings";

const TITLES = [
  { value: "mr", label: "Mr" },
  { value: "mrs", label: "Mrs" },
  { value: "ms", label: "Ms" },
  { value: "miss", label: "Miss" },
  { value: "dr", label: "Dr" },
];

const DOC_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "national_identity_card", label: "National ID card" },
];

const GENDERS = [
  { value: "m", label: "Male" },
  { value: "f", label: "Female" },
] as const;

type TripDate = { y: string; m: string; d: string };

function emptyTripDate(): TripDate {
  return { y: "", m: "", d: "" };
}

function trip(y: string, m: string, d: string): TripDate {
  return { y, m, d };
}

/**
 * Demo / staging: pre-fill valid-looking data so you can click "Confirm and book" quickly.
 * Set to `false` for production builds where the form should start empty.
 */
const BOOKING_FORM_DEMO_AUTOFILL = true;

const DEMO_CONTACT: ContactFieldState = {
  title: "mr",
  given_name: "An",
  family_name: "Nguyen",
  email: "demo.booking@example.com",
  phone: "+84901234567",
  country: "VN",
};

export interface PassengerFieldState {
  title: string;
  given_name: string;
  family_name: string;
  /** Duffel expects `m` or `f` on create order. */
  gender: "m" | "f";
  national_id: string;
  born_on: TripDate;
  doc_type: string;
  doc_number: string;
  doc_issued: TripDate;
  doc_issued_country: string;
  doc_expires: TripDate;
  nationality: string;
}

export interface ContactFieldState {
  title: string;
  given_name: string;
  family_name: string;
  email: string;
  phone: string;
  country: string;
}

function emptyPassengerRow(p: OfferPassenger, offer: Offer): PassengerFieldState {
  const badge = getTravellerBadge(p);
  const refUtc = getOfferDepartureUtcDate(offer) ?? new Date();
  let born_on = emptyTripDate();
  if (
    (badge === "CHILD" || badge === "INFANT") &&
    p.age !== undefined &&
    p.age !== null
  ) {
    born_on = tripDateForAgeAtReference(p.age, refUtc);
  }

  return {
    title: "mr",
    given_name: p.given_name ?? "",
    family_name: p.family_name ?? "",
    gender: "m",
    national_id: "",
    born_on,
    doc_type: "passport",
    doc_number: "",
    doc_issued: emptyTripDate(),
    doc_issued_country: "",
    doc_expires: emptyTripDate(),
    nationality: "",
  };
}

function buildInitialPassengerState(
  offer: Offer,
  demo: boolean
): Record<string, PassengerFieldState> {
  const map: Record<string, PassengerFieldState> = {};
  let adultSlot = 0;
  const refUtc = getOfferDepartureUtcDate(offer) ?? new Date();

  for (const p of offer.passengers) {
    if (!demo) {
      map[p.id] = emptyPassengerRow(p, offer);
      continue;
    }

    const badge = getTravellerBadge(p);

    if (badge === "INFANT") {
      const ageYears = p.age ?? 0;
      map[p.id] = {
        title: "miss",
        given_name: p.given_name || "Mai",
        family_name: p.family_name || "Nguyen",
        gender: "f",
        national_id: "",
        born_on: tripDateForAgeAtReference(ageYears, refUtc),
        doc_type: "passport",
        doc_number: "",
        doc_issued: emptyTripDate(),
        doc_issued_country: "",
        doc_expires: emptyTripDate(),
        nationality: "",
      };
      continue;
    }

    if (badge === "CHILD") {
      const ageYears = p.age ?? 8;
      const born_on = tripDateForAgeAtReference(ageYears, refUtc);
      map[p.id] = {
        title: "mr",
        given_name: p.given_name || "Cuong",
        family_name: p.family_name || "Nguyen",
        gender: "m",
        national_id: "035099001234",
        born_on,
        doc_type: "passport",
        doc_number: "V123998877",
        doc_issued: trip("2022", "05", "10"),
        doc_issued_country: "VN",
        doc_expires: trip("2027", "05", "10"),
        nationality: "Vietnamese",
      };
      continue;
    }

    const adults = [
      {
        title: "mr",
        given_name: "An",
        family_name: "Nguyen",
        gender: "m" as const,
        national_id: "001099012345",
        born_on: trip("1988", "03", "15"),
        doc_number: "B889900112",
      },
      {
        title: "mrs",
        given_name: "Linh",
        family_name: "Tran",
        gender: "f" as const,
        national_id: "002088045678",
        born_on: trip("1990", "06", "20"),
        doc_number: "C990011223",
      },
    ];
    const a = adults[adultSlot % adults.length];
    adultSlot += 1;

    map[p.id] = {
      title: a.title,
      given_name: p.given_name || a.given_name,
      family_name: p.family_name || a.family_name,
      gender: a.gender,
      national_id: a.national_id,
      born_on: a.born_on,
      doc_type: "passport",
      doc_number: a.doc_number,
      doc_issued: trip("2020", "01", "15"),
      doc_issued_country: "VN",
      doc_expires: trip("2030", "01", "15"),
      nationality: "Vietnamese",
    };
  }

  return map;
}

function rangeYears(from: number, to: number): number[] {
  const out: number[] = [];
  for (let y = to; y >= from; y--) out.push(y);
  return out;
}

const YearSelect: FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  from: number;
  to: number;
}> = ({ value, onChange, placeholder, from, to }) => {
  const years = useMemo(() => rangeYears(from, to), [from, to]);
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm"
    >
      <option value="">{placeholder}</option>
      {years.map((y) => (
        <option key={y} value={String(y)}>
          {y}
        </option>
      ))}
    </Select>
  );
};

const MonthSelect: FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => (
  <Select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="text-sm"
  >
    <option value="">{placeholder}</option>
    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
      <option key={m} value={String(m).padStart(2, "0")}>
        {String(m).padStart(2, "0")}
      </option>
    ))}
  </Select>
);

const DaySelect: FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => (
  <Select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="text-sm"
  >
    <option value="">{placeholder}</option>
    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
      <option key={d} value={String(d).padStart(2, "0")}>
        {String(d).padStart(2, "0")}
      </option>
    ))}
  </Select>
);

const DateRow: FC<{
  label: string;
  required?: boolean;
  value: TripDate;
  onChange: (next: TripDate) => void;
  yearFrom: number;
  yearTo: number;
}> = ({ label, required, value, onChange, yearFrom, yearTo }) => (
  <div>
    <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </span>
    <div className="grid grid-cols-3 gap-2">
      <YearSelect
        placeholder="Year"
        from={yearFrom}
        to={yearTo}
        value={value.y}
        onChange={(y) => onChange({ ...value, y })}
      />
      <MonthSelect
        placeholder="Month"
        value={value.m}
        onChange={(m) => onChange({ ...value, m })}
      />
      <DaySelect
        placeholder="Day"
        value={value.d}
        onChange={(d) => onChange({ ...value, d })}
      />
    </div>
  </div>
);

export type CheckoutPhase = "travelers" | "complete";

export interface PassengerBookingFormProps {
  offer: Offer;
  /** Syncs the top booking stepper (Search → Travelers → Payment). */
  onCheckoutPhaseChange?: (phase: CheckoutPhase) => void;
}

const PassengerBookingForm: FC<PassengerBookingFormProps> = ({
  offer,
  onCheckoutPhaseChange,
}) => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    id: string;
    booking_reference?: string;
  } | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<DuffelOrderRecord | null>(
    null
  );
  const [confirmedPaid, setConfirmedPaid] = useState(false);
  const [confirmedPayments, setConfirmedPayments] = useState<
    Array<{
      id: string;
      status: string;
      amount?: string;
      currency?: string | null;
    }>
  >([]);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  const [contact, setContact] = useState<ContactFieldState>(() =>
    BOOKING_FORM_DEMO_AUTOFILL
      ? { ...DEMO_CONTACT }
      : {
          title: "mr",
          given_name: "",
          family_name: "",
          email: "",
          phone: "",
          country: "VN",
        }
  );

  const [byPassengerId, setByPassengerId] = useState<
    Record<string, PassengerFieldState>
  >(() => buildInitialPassengerState(offer, BOOKING_FORM_DEMO_AUTOFILL));

  /** Collect booking email/phone once on the first adult; same values are sent for every passenger (child/infant included). */
  const firstAdultPassengerId = useMemo(
    () =>
      offer.passengers.find((p) => getTravellerBadge(p) === "ADULT")?.id ?? null,
    [offer.passengers]
  );

  const updatePassenger = useCallback(
    (id: string, patch: Partial<PassengerFieldState>) => {
      setByPassengerId((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }));
    },
    []
  );

  const copyContactToLead = useCallback(() => {
    const leadId = offer.passengers[0]?.id;
    if (!leadId) return;
    setByPassengerId((prev) => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        title: contact.title,
        given_name: contact.given_name,
        family_name: contact.family_name,
      },
    }));
  }, [contact, offer.passengers]);

  const validateForm = useCallback((): string | null => {
    if (!contact.given_name.trim() || !contact.family_name.trim()) {
      return "Please complete contact first and last name.";
    }
    if (!contact.email.trim()) {
      return "Contact email is required.";
    }

    const refUtc = getOfferDepartureUtcDate(offer) ?? new Date();

    for (let i = 0; i < offer.passengers.length; i++) {
      const p = offer.passengers[i];
      const s = byPassengerId[p.id];
      if (!s) return "Missing traveller data. Please refresh the page.";
      const label = `Traveller ${i + 1}`;
      if (!s.given_name.trim() || !s.family_name.trim()) {
        return `${label}: first and last name are required.`;
      }
      if (!tripDateToIso(s.born_on)) {
        return `${label}: please enter a complete valid date of birth.`;
      }
      const badge = getTravellerBadge(p);
      if (
        p.age !== undefined &&
        p.age !== null &&
        !birthMatchesOfferAge(s.born_on, p.age, refUtc)
      ) {
        return `${label}: date of birth must match age ${p.age} from your search on the flight date (${refUtc.toLocaleDateString()}). Adjust the birth date or start a new search with the correct ages.`;
      }
      if (badge !== "INFANT") {
        if (!s.national_id.trim()) {
          return `${label}: national ID is required.`;
        }
        if (!s.doc_number.trim()) {
          return `${label}: document number is required.`;
        }
        if (!tripDateToIso(s.doc_issued)) {
          return `${label}: please enter a complete document issued date.`;
        }
        if (!s.doc_issued_country.trim()) {
          return `${label}: document issuing country is required (e.g. VN).`;
        }
        if (!tripDateToIso(s.doc_expires)) {
          return `${label}: please enter a complete document expiry date.`;
        }
        if (!s.nationality.trim()) {
          return `${label}: nationality is required.`;
        }
      }
    }
    return null;
  }, [byPassengerId, contact, offer]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      const err = validateForm();
      if (err) {
        setSubmitError(err);
        return;
      }
      setSubmitting(true);
      try {
        const passengers: Record<string, unknown> = {};
        for (const p of offer.passengers) {
          const s = byPassengerId[p.id];
          passengers[p.id] = {
            title: s.title,
            given_name: s.given_name,
            family_name: s.family_name,
            gender: s.gender,
            born_on: s.born_on,
            doc_type: s.doc_type,
            doc_number: s.doc_number,
            doc_issued: s.doc_issued,
            doc_issued_country: s.doc_issued_country,
            doc_expires: s.doc_expires,
          };
        }
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerId: offer.id,
            contact,
            passengers,
          }),
        });
        const json = (await res.json()) as {
          error?: string;
          userMessage?: string;
          code?: string;
          data?: {
            id: string;
            type?: "instant" | "hold";
            booking_reference?: string | null;
            total_amount?: string;
            total_currency?: string;
            payment_required_by?: string | null;
          };
        };
        if (!res.ok) {
          const raw = json.error || "Could not complete booking.";
          const friendly =
            json.userMessage ?? friendlyOrderErrorMessage(raw, json.code);
          throw new Error(friendly);
        }
        if (!json.data?.id) {
          throw new Error("Unexpected response from booking service.");
        }
        const d = json.data;
        const treatAsHold =
          d.type === "hold" ||
          (d.type !== "instant" &&
            offer.payment_requirements.requires_instant_payment === false);
        if (treatAsHold) {
          const q = new URLSearchParams({
            orderId: d.id,
            offerId: offer.id,
          });
          router.push(
            `/listing-flights/payment?${q.toString()}` as Route
          );
        } else {
          addSavedOrderId(d.id);
          setOrderSuccess({
            id: d.id,
            booking_reference: d.booking_reference ?? undefined,
          });
        }
      } catch (ex) {
        setSubmitError(
          ex instanceof Error ? ex.message : "Could not complete booking."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [byPassengerId, contact, offer, router, validateForm]
  );

  useEffect(() => {
    if (!onCheckoutPhaseChange) return;
    if (orderSuccess) onCheckoutPhaseChange("complete");
    else onCheckoutPhaseChange("travelers");
  }, [orderSuccess, onCheckoutPhaseChange]);

  useEffect(() => {
    if (!orderSuccess?.id) {
      setConfirmedOrder(null);
      setConfirmedPaid(false);
      setConfirmedPayments([]);
      return;
    }
    let cancelled = false;
    setOrderDetailLoading(true);
    fetch(`/api/orders/${encodeURIComponent(orderSuccess.id)}`)
      .then(async (res) => {
        const json = (await res.json()) as {
          error?: string;
          data?: {
            order: DuffelOrderRecord;
            paid: boolean;
            payments?: Array<{
              id: string;
              status: string;
              amount?: string;
              currency?: string | null;
            }>;
          };
        };
        if (!res.ok) throw new Error(json.error || "Could not load order");
        return json.data;
      })
      .then((data) => {
        if (cancelled || !data?.order) return;
        setConfirmedOrder(data.order);
        setConfirmedPaid(data.paid);
        setConfirmedPayments(data.payments ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setConfirmedOrder(null);
          setConfirmedPaid(false);
          setConfirmedPayments([]);
        }
      })
      .finally(() => {
        if (!cancelled) setOrderDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderSuccess?.id]);

  const yNow = new Date().getFullYear();

  return (
    <form className="space-y-8" onSubmit={handleSubmit} noValidate>
      {!orderSuccess && (
        <>
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Contact
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {firstAdultPassengerId
            ? "Booking email and phone are entered on the first adult traveller below (reused for children and infants in the order)."
            : "Please enter the email address where you would like to receive your confirmation."}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
              Title<span className="text-red-500">*</span>
            </span>
            <Select
              value={contact.title}
              onChange={(e) =>
                setContact((c) => ({ ...c, title: e.target.value }))
              }
            >
              {TITLES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
              First Name<span className="text-red-500">*</span>
            </span>
            <Input
              value={contact.given_name}
              onChange={(e) =>
                setContact((c) => ({ ...c, given_name: e.target.value }))
              }
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
              Last Name<span className="text-red-500">*</span>
            </span>
            <Input
              value={contact.family_name}
              onChange={(e) =>
                setContact((c) => ({ ...c, family_name: e.target.value }))
              }
            />
          </div>
          {!firstAdultPassengerId && (
            <>
              <div className="md:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  Email<span className="text-red-500">*</span>
                </span>
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) =>
                    setContact((c) => ({ ...c, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  Phone
                </span>
                <Input
                  placeholder="+84"
                  value={contact.phone}
                  onChange={(e) =>
                    setContact((c) => ({ ...c, phone: e.target.value }))
                  }
                />
              </div>
            </>
          )}
          <div className="md:col-span-3">
            <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
              Country<span className="text-red-500">*</span>
            </span>
            <Select
              value={contact.country}
              onChange={(e) =>
                setContact((c) => ({ ...c, country: e.target.value }))
              }
            >
              <option value="VN">Vietnam (Việt Nam)</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="JP">Japan</option>
              <option value="KR">South Korea</option>
              <option value="SG">Singapore</option>
              <option value="TH">Thailand</option>
            </Select>
          </div>
        </div>
      </section>

      {offer.passengers.map((p: OfferPassenger, index: number) => {
        const state = byPassengerId[p.id];
        if (!state) return null;
        const badge = getTravellerBadge(p);
        const isInfant = badge === "INFANT";
        const ageBadge = getAgeBadgeText(p);
        const isLead = index === 0;
        const heading = isLead ? "Lead Passenger" : `Traveller ${index + 1}`;
        const showBookingContactFields =
          firstAdultPassengerId === p.id && badge === "ADULT";

        return (
          <section
            key={p.id}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-8"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {heading}
                  </h2>
                  <span className="text-neutral-400">&gt;</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-bold ${travellerBadgeClass(badge)}`}
                  >
                    {badge}
                  </span>
                  {ageBadge && (
                    <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900 dark:bg-sky-900/40 dark:text-sky-100">
                      {ageBadge}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  {isInfant
                    ? "Enter the infant’s details below (no travel document fields on this row)."
                    : "Traveller names must match government-issued photo ID exactly."}
                </p>
              </div>
              {isLead && (
                <button
                  type="button"
                  onClick={copyContactToLead}
                  className="shrink-0 rounded-xl bg-primary-6000 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Copy From Contact
                </button>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div>
                <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  Title<span className="text-red-500">*</span>
                </span>
                <Select
                  value={state.title}
                  onChange={(e) =>
                    updatePassenger(p.id, { title: e.target.value })
                  }
                >
                  {TITLES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  First Name<span className="text-red-500">*</span>
                </span>
                <Input
                  value={state.given_name}
                  onChange={(e) =>
                    updatePassenger(p.id, { given_name: e.target.value })
                  }
                />
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  Last Name<span className="text-red-500">*</span>
                </span>
                <Input
                  value={state.family_name}
                  onChange={(e) =>
                    updatePassenger(p.id, { family_name: e.target.value })
                  }
                />
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  Gender<span className="text-red-500">*</span>
                </span>
                <Select
                  value={state.gender}
                  onChange={(e) =>
                    updatePassenger(p.id, {
                      gender: e.target.value === "f" ? "f" : "m",
                    })
                  }
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-2">
                <DateRow
                  label="Date Of Birth"
                  required
                  value={state.born_on}
                  onChange={(born_on) => updatePassenger(p.id, { born_on })}
                  yearFrom={yNow - 120}
                  yearTo={yNow}
                />
              </div>
              {showBookingContactFields && (
                <>
                  <div className="md:col-span-2">
                    <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      Booking email<span className="text-red-500">*</span>
                    </span>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) =>
                        setContact((c) => ({ ...c, email: e.target.value }))
                      }
                    />
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Used for the whole order (same value is sent for children and
                      infants).
                    </p>
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      Booking phone
                    </span>
                    <Input
                      placeholder="+84"
                      value={contact.phone}
                      onChange={(e) =>
                        setContact((c) => ({ ...c, phone: e.target.value }))
                      }
                    />
                  </div>
                </>
              )}
              {!isInfant && (
                <>
                  <div className="md:col-span-1">
                    <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      National ID<span className="text-red-500">*</span>
                    </span>
                    <Input
                      value={state.national_id}
                      onChange={(e) =>
                        updatePassenger(p.id, { national_id: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      Document Type<span className="text-red-500">*</span>
                    </span>
                    <Select
                      value={state.doc_type}
                      onChange={(e) =>
                        updatePassenger(p.id, { doc_type: e.target.value })
                      }
                    >
                      {DOC_TYPES.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      Document ID<span className="text-red-500">*</span>
                    </span>
                    <Input
                      value={state.doc_number}
                      onChange={(e) =>
                        updatePassenger(p.id, { doc_number: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <DateRow
                      label="Document Issued Date"
                      required
                      value={state.doc_issued}
                      onChange={(doc_issued) =>
                        updatePassenger(p.id, { doc_issued })
                      }
                      yearFrom={yNow - 80}
                      yearTo={yNow}
                    />
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      Document Issued Country<span className="text-red-500">*</span>
                    </span>
                    <Input
                      placeholder="e.g. VN"
                      value={state.doc_issued_country}
                      onChange={(e) =>
                        updatePassenger(p.id, {
                          doc_issued_country: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <DateRow
                      label="Document Expiration"
                      required
                      value={state.doc_expires}
                      onChange={(doc_expires) =>
                        updatePassenger(p.id, { doc_expires })
                      }
                      yearFrom={yNow}
                      yearTo={yNow + 25}
                    />
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      Nationality<span className="text-red-500">*</span>
                    </span>
                    <Input
                      placeholder="Nationality"
                      value={state.nationality}
                      onChange={(e) =>
                        updatePassenger(p.id, { nationality: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </section>
        );
      })}
        </>
      )}

      {orderSuccess && (
        <div className="space-y-4">
          {orderDetailLoading && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
              <i className="las la-spinner la-spin text-3xl text-primary-6000" />
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                Loading confirmation details…
              </p>
            </div>
          )}
          {confirmedOrder ? (
            <OrderConfirmationPanel
              order={confirmedOrder}
              paid={confirmedPaid}
              payments={confirmedPayments}
              tone="success"
            />
          ) : (
            !orderDetailLoading && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                  Booking confirmed
                </p>
                {orderSuccess.booking_reference && (
                  <p className="mt-2 text-emerald-800 dark:text-emerald-200">
                    Booking reference:{" "}
                    <span className="font-mono font-bold">
                      {orderSuccess.booking_reference}
                    </span>
                  </p>
                )}
                <p className="mt-1 text-sm text-emerald-700/90 dark:text-emerald-300/90">
                  Order id:{" "}
                  <span className="font-mono">{orderSuccess.id}</span>
                </p>
              </div>
            )
          )}
        </div>
      )}

      {submitError && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900 dark:bg-red-950/35"
          role="alert"
        >
          <p className="text-center text-sm font-semibold text-red-900 dark:text-red-100">
            We couldn&apos;t complete the booking
          </p>
          <p className="mt-3 text-center text-sm leading-relaxed text-red-800/95 dark:text-red-200/95">
            {submitError}
          </p>
        </div>
      )}

      {!orderSuccess && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-primary-6000 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Booking…" : "Confirm and book"}
          </button>
        </div>
      )}
    </form>
  );
};

export default PassengerBookingForm;
