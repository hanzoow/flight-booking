import type { OfferPassenger } from "@/api/models";

export type TravellerBadge = "ADULT" | "CHILD" | "INFANT";

export function getTravellerBadge(p: OfferPassenger): TravellerBadge {
  const t = (p.type || "adult").toLowerCase();
  if (t === "infant_without_seat" || t === "infant") return "INFANT";
  if (t === "child") return "CHILD";
  return "ADULT";
}

export function getAgeBadgeText(p: OfferPassenger): string | null {
  if (p.age === undefined || p.age === null) return null;
  return `${p.age} ${p.age === 1 ? "YEAR" : "YEARS"} OLD`;
}

export function travellerBadgeClass(badge: TravellerBadge): string {
  switch (badge) {
    case "ADULT":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
    case "CHILD":
      return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100";
    case "INFANT":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100";
    default:
      return "bg-neutral-200 text-neutral-800";
  }
}
