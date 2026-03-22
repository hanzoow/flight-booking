import parsePhoneNumber from "libphonenumber-js/min";
import { isSupportedCountry, type CountryCode } from "libphonenumber-js/min";

/** Business rule: national (subscriber) digits after country calling code. */
export const BOOKING_PHONE_NATIONAL_DIGITS = 9;

export function phoneDefaultCountry(isoAlpha2: string): CountryCode {
  const code = isoAlpha2.trim().toUpperCase() as CountryCode;
  return isSupportedCountry(code) ? code : "AE";
}

/**
 * Returns an error message if invalid, or `null` if OK.
 * Requires a parseable E.164-style value and exactly {@link BOOKING_PHONE_NATIONAL_DIGITS} national digits.
 */
export function getBookingPhoneError(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return "Phone number is required.";
  }
  try {
    const phone = parsePhoneNumber(trimmed);
    if (!phone) {
      return "Choose a country and enter a valid phone number.";
    }
    const nationalDigits = phone.nationalNumber.replace(/\D/g, "");
    if (nationalDigits.length !== BOOKING_PHONE_NATIONAL_DIGITS) {
      return `Enter exactly ${BOOKING_PHONE_NATIONAL_DIGITS} digits after the country code (you entered ${nationalDigits.length}).`;
    }
    return null;
  } catch {
    return "Choose a country and enter a valid phone number.";
  }
}

/** Normalized E.164 for Duffel `phone_number`. */
export function formatBookingPhoneE164(value: string): string {
  const phone = parsePhoneNumber(value.trim());
  if (!phone) {
    throw new Error("Invalid phone number.");
  }
  const nationalDigits = phone.nationalNumber.replace(/\D/g, "");
  if (nationalDigits.length !== BOOKING_PHONE_NATIONAL_DIGITS) {
    throw new Error(
      `Phone must have exactly ${BOOKING_PHONE_NATIONAL_DIGITS} digits after the country code.`
    );
  }
  return phone.format("E.164");
}
