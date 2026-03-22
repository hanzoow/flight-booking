/**
 * Options for `<select>` fields that must send ISO 3166-1 alpha-2 (e.g. Duffel `issuing_country_code`).
 */
export type Iso3166SelectOption = { code: string; name: string };

/** Subset if runtime has no `Intl.supportedValuesOf` (older Node). */
const FALLBACK_ISO3166: Iso3166SelectOption[] = [
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "BH", name: "Bahrain" },
  { code: "KW", name: "Kuwait" },
  { code: "OM", name: "Oman" },
  { code: "EG", name: "Egypt" },
  { code: "VN", name: "Vietnam" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "PH", name: "Philippines" },
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
  { code: "CN", name: "China" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
];

/**
 * Sorted list of { code, name } for alpha-2 regions (Node 20+ / modern browsers).
 */
export function getIso3166Alpha2SelectOptions(): Iso3166SelectOption[] {
  try {
    const intl = Intl as unknown as {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof intl.supportedValuesOf !== "function") {
      return [...FALLBACK_ISO3166].sort((a, b) => a.name.localeCompare(b.name));
    }
    const codes = intl.supportedValuesOf("region");
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    const out: Iso3166SelectOption[] = [];
    for (const code of codes) {
      if (!/^[A-Z]{2}$/.test(code)) continue;
      const name = regionNames.of(code);
      if (!name) continue;
      out.push({ code, name });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  } catch {
    return [...FALLBACK_ISO3166].sort((a, b) => a.name.localeCompare(b.name));
  }
}

/** `true` if value is exactly two ASCII letters (caller may uppercase). */
export function isIso3166Alpha2(value: string): boolean {
  return /^[A-Za-z]{2}$/.test(value.trim());
}
