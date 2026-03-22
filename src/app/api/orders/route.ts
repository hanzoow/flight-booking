import { NextRequest, NextResponse } from "next/server";
import { createDuffelOrder } from "@/api/orders";
import { DuffelRequestError } from "@/api/duffel-client";
import { getOfferById } from "@/api/offers";
import {
  buildCreateOrderData,
  type ClientOrderContactPayload,
  type ClientOrderPassengerPayload,
} from "@/utils/createDuffelOrderPayload";
import { friendlyOrderErrorMessage } from "@/utils/offerPassengerDob";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseContact(raw: unknown): ClientOrderContactPayload | null {
  if (!isRecord(raw)) return null;
  const email = typeof raw.email === "string" ? raw.email : "";
  const title = typeof raw.title === "string" ? raw.title : "mr";
  const given_name = typeof raw.given_name === "string" ? raw.given_name : "";
  const family_name =
    typeof raw.family_name === "string" ? raw.family_name : "";
  const phone = typeof raw.phone === "string" ? raw.phone : "";
  const country = typeof raw.country === "string" ? raw.country : "AE";
  if (!email.trim() || !given_name.trim() || !family_name.trim()) return null;
  return { title, given_name, family_name, email, phone, country };
}

function parseTripDate(raw: unknown): { y: string; m: string; d: string } {
  if (!isRecord(raw)) return { y: "", m: "", d: "" };
  return {
    y: typeof raw.y === "string" ? raw.y : "",
    m: typeof raw.m === "string" ? raw.m : "",
    d: typeof raw.d === "string" ? raw.d : "",
  };
}

function parsePassengers(
  raw: unknown
): Record<string, ClientOrderPassengerPayload> | null {
  if (!isRecord(raw)) return null;
  const out: Record<string, ClientOrderPassengerPayload> = {};
  for (const [id, val] of Object.entries(raw)) {
    if (!isRecord(val)) return null;
    const gender = val.gender === "f" ? "f" : "m";
    const title = typeof val.title === "string" ? val.title : "mr";
    const given_name =
      typeof val.given_name === "string" ? val.given_name : "";
    const family_name =
      typeof val.family_name === "string" ? val.family_name : "";
    const doc_type =
      typeof val.doc_type === "string" ? val.doc_type : "passport";
    const doc_number =
      typeof val.doc_number === "string" ? val.doc_number : "";
    out[id] = {
      title,
      given_name,
      family_name,
      gender,
      born_on: parseTripDate(val.born_on),
      doc_type,
      doc_number,
      doc_issued: parseTripDate(val.doc_issued),
      doc_issued_country:
        typeof val.doc_issued_country === "string"
          ? val.doc_issued_country
          : "",
      doc_expires: parseTripDate(val.doc_expires),
    };
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    if (!isRecord(json)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const offerId =
      typeof json.offerId === "string" ? json.offerId.trim() : "";
    if (!offerId) {
      return NextResponse.json({ error: "offerId is required" }, { status: 400 });
    }

    const contact = parseContact(json.contact);
    if (!contact) {
      return NextResponse.json(
        { error: "Invalid or incomplete contact details" },
        { status: 400 }
      );
    }

    const passengers = parsePassengers(json.passengers);
    if (!passengers || Object.keys(passengers).length === 0) {
      return NextResponse.json(
        { error: "Passenger details are required" },
        { status: 400 }
      );
    }

    const offer = await getOfferById(offerId);

    let payload;
    try {
      payload = buildCreateOrderData({ offer, contact, passengers });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Invalid order payload";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const result = await createDuffelOrder(payload);
    return NextResponse.json({ data: result.data });
  } catch (e) {
    if (e instanceof DuffelRequestError) {
      const first = e.errors[0];
      const raw = first?.message ?? e.message;
      const code = first?.code;
      const userMessage = friendlyOrderErrorMessage(raw, code);
      const status = e.status >= 400 && e.status < 600 ? e.status : 502;
      return NextResponse.json(
        { error: raw, code, userMessage },
        { status }
      );
    }
    const message =
      e instanceof Error ? e.message : "Could not create order";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
