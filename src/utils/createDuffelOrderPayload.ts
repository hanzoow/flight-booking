import type { Offer, OfferPassenger } from "@/api/models";
import { getTravellerBadge } from "@/utils/bookingPassenger";

/** Date parts from the booking form (YYYY / MM / DD as strings). */
export interface TripDatePayload {
  y: string;
  m: string;
  d: string;
}

/** One traveller as sent from the client to POST /api/orders. */
export interface ClientOrderPassengerPayload {
  title: string;
  given_name: string;
  family_name: string;
  gender: "m" | "f";
  born_on: TripDatePayload;
  doc_type: string;
  doc_number: string;
  doc_issued: TripDatePayload;
  doc_issued_country: string;
  doc_expires: TripDatePayload;
}

export interface ClientOrderContactPayload {
  title: string;
  given_name: string;
  family_name: string;
  email: string;
  phone: string;
  country: string;
}

export function tripDateToIso(d: TripDatePayload): string | null {
  if (!d.y || !d.m || !d.d) return null;
  const y = Number(d.y);
  const m = Number(d.m);
  const day = Number(d.d);
  if (!y || !m || !day) return null;
  const date = new Date(Date.UTC(y, m - 1, day));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeCountryCode(raw: string): string {
  const s = raw.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(s)) return s;
  const map: Record<string, string> = {
    VIETNAM: "VN",
    "UNITED STATES": "US",
    USA: "US",
    "UNITED KINGDOM": "GB",
    UK: "GB",
    JAPAN: "JP",
    "SOUTH KOREA": "KR",
    KOREA: "KR",
    SINGAPORE: "SG",
    THAILAND: "TH",
    "UNITED ARAB EMIRATES": "AE",
    UAE: "AE",
    EMIRATES: "AE",
    DUBAI: "AE",
  };
  if (map[s]) return map[s];
  const alpha = s.replace(/[^A-Z]/gi, "").toUpperCase();
  if (alpha.length >= 2) return alpha.slice(0, 2);
  throw new Error(
    `Invalid country code "${raw}". Use a 2-letter ISO code (e.g. VN, US).`
  );
}

function mapIdentityDocumentType(
  formType: string,
  supported?: string[]
): string {
  if (formType === "national_identity_card") {
    if (supported?.includes("national_identity_card")) {
      return "national_identity_card";
    }
    return "passport";
  }
  return "passport";
}

function isInfantPassenger(p: OfferPassenger): boolean {
  return getTravellerBadge(p) === "INFANT";
}

function isAdultPassenger(p: OfferPassenger): boolean {
  return getTravellerBadge(p) === "ADULT";
}

export interface BuildCreateOrderInput {
  offer: Offer;
  contact: ClientOrderContactPayload;
  passengers: Record<string, ClientOrderPassengerPayload>;
}

/**
 * Builds the `data` object for POST https://api.duffel.com/air/orders
 * @see https://duffel.com/docs/api/v2/orders
 */
export function buildCreateOrderData(input: BuildCreateOrderInput): {
  data: Record<string, unknown>;
} {
  const { offer, contact, passengers } = input;

  const idsFromOffer = offer.passengers.map((p) => p.id);
  const idsFromClient = Object.keys(passengers);
  if (idsFromClient.length !== idsFromOffer.length) {
    throw new Error("Passenger count does not match this offer.");
  }
  for (const id of idsFromOffer) {
    if (!passengers[id]) {
      throw new Error(`Missing details for passenger ${id}.`);
    }
  }

  const infantQueue = offer.passengers
    .filter(isInfantPassenger)
    .map((p) => p.id);

  const contactEmail = contact.email.trim();
  if (!contactEmail) {
    throw new Error("Contact email is required.");
  }
  const contactPhone = contact.phone?.trim();

  const duffelPassengers: Record<string, unknown>[] = [];

  for (const p of offer.passengers) {
    const form = passengers[p.id];
    const bornOn = tripDateToIso(form.born_on);
    if (!bornOn) {
      throw new Error(`Invalid or incomplete date of birth for passenger ${p.id}.`);
    }

    const row: Record<string, unknown> = {
      id: p.id,
      title: form.title,
      given_name: form.given_name.trim(),
      family_name: form.family_name.trim(),
      born_on: bornOn,
      gender: form.gender,
      // Booker contact (single fields in UI) → every row; child/infant have no separate email/phone inputs.
      email: contactEmail,
    };
    if (contactPhone) {
      row.phone_number = contactPhone;
    }

    if (!isInfantPassenger(p)) {
      const expiresOn = tripDateToIso(form.doc_expires);
      if (!expiresOn) {
        throw new Error(`Invalid document expiry for passenger ${p.id}.`);
      }
      const docNumber = form.doc_number.trim();
      if (!docNumber) {
        throw new Error(`Document number is required for passenger ${p.id}.`);
      }
      let issuing: string;
      try {
        issuing = normalizeCountryCode(form.doc_issued_country);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Invalid country code";
        throw new Error(`${msg} (passenger ${p.id})`);
      }

      const docType = mapIdentityDocumentType(
        form.doc_type,
        offer.supported_passenger_identity_document_types
      );

      row.identity_documents = [
        {
          unique_identifier: docNumber,
          type: docType,
          issuing_country_code: issuing,
          expires_on: expiresOn,
        },
      ];
    }

    if (isAdultPassenger(p) && infantQueue.length > 0) {
      row.infant_passenger_id = infantQueue.shift();
    }

    duffelPassengers.push(row);
  }

  if (infantQueue.length > 0) {
    throw new Error(
      "There are more infants than adults. Each infant needs a separate adult passenger on this booking."
    );
  }

  const requiresInstant =
    offer.payment_requirements?.requires_instant_payment !== false;

  const data: Record<string, unknown> = {
    selected_offers: [offer.id],
    passengers: duffelPassengers,
  };

  if (requiresInstant) {
    data.type = "instant";
    data.payments = [
      {
        type: "balance",
        currency: offer.total_currency,
        amount: offer.total_amount,
      },
    ];
  } else {
    data.type = "hold";
  }

  return { data };
}
