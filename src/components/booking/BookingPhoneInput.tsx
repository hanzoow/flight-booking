"use client";

import React, { FC } from "react";
import PhoneInput, { type Country, type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { phoneDefaultCountry } from "@/utils/bookingPhone";

export interface BookingPhoneInputProps {
  value: string;
  onChange: (e164: string) => void;
  /** ISO 3166-1 alpha-2 — used as default flag / calling code */
  countryIso2: string;
  /** When user picks another country in the phone dropdown */
  onCountryChange?: (iso2: Country) => void;
  invalid?: boolean;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * International phone field (flag + calling code + number) via `react-phone-number-input`.
 * Parent should store E.164 in `value` (e.g. `+966501234567`).
 */
const BookingPhoneInput: FC<BookingPhoneInputProps> = ({
  value,
  onChange,
  countryIso2,
  onCountryChange,
  invalid,
  placeholder = "Enter phone number",
  disabled,
  id,
}) => {
  const defaultCountry = phoneDefaultCountry(countryIso2);

  return (
    <div
      className={`booking-phone-field${invalid ? " booking-phone-field--invalid" : ""}`}
    >
      <PhoneInput
        id={id}
        international
        withCountryCallingCode
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        limitMaxLength
        placeholder={placeholder}
        value={(value || undefined) as Value | undefined}
        onChange={(v) => onChange(v ?? "")}
        onCountryChange={(c) => {
          if (c) onCountryChange?.(c);
        }}
        disabled={disabled}
        smartCaret
      />
    </div>
  );
};

export default BookingPhoneInput;
