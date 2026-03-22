---
name: flight-flow-ui
description: >-
  Use shared layout and feedback components for flight home, listing, booking,
  payment, and my-bookings pages. Apply when adding a new flight-related route,
  empty/error states, loading spinners, or page headers with a back link.
---

# Flight flow UI (shared layout & feedback)

This project centralises repeated **page chrome**, **alerts**, and **loading** patterns used across `(flight-listings)`, **home**, **payment**, and **`/my-bookings`**.

## Barrel import

```tsx
import {
  FlightFlowPageShell,
  BookingFlowPageHeader,
  FlowFeedbackCard,
  FlowLoadingPanel,
} from "@/components/layout";
```

Source: `src/components/layout/index.ts`.

---

## 1. `FlightFlowPageShell`

**Role:** `BgGlassmorphism` + outer `relative overflow-hidden` + inner `container` (same visual baseline as the original template).

| Prop | Purpose |
|------|---------|
| `pageClassName` | Tracking / BEM id, e.g. `nc-ListingFlightsPage`, `nc-PageHome` |
| `containerClassName` | Default `container relative`; add `py-6 lg:py-10` for booking-style pages |
| `as` | `"main"` on **home** for semantics; default `"div"` |

**Home (`src/app/page.tsx`):**

```tsx
<FlightFlowPageShell as="main" pageClassName="nc-PageHome">
  <SectionHeroArchivePage ... />
  <SectionSliderNewCategories ... />
</FlightFlowPageShell>
```

**Listing / passengers / payment / my-bookings:** set `containerClassName="container relative py-6 lg:py-10"` when the page needs vertical rhythm like the old duplicated wrappers.

**Do not** wrap another full-width `container` inside unless you need nested layout; the shell already provides one.

---

## 2. `BookingFlowPageHeader`

**Role:** Optional **back link** (`primary-6000` underline style) + **title** + **description** + optional **`trailing`** (e.g. price card on the right at `sm+`).

```tsx
<BookingFlowPageHeader
  backHref={backToResultsHref}
  backLabel="← Back to search results"
  title="Passenger details"
  description="Prices below are from the latest offer…"
  trailing={offer ? <PriceSummaryCard /> : undefined}
/>
```

Omit `backHref` / `backLabel` if the page has no “back” action (rare in this flow).

---

## 3. `FlowFeedbackCard`

**Role:** Consistent **empty**, **error**, and **warning** panels (icons + typography aligned with listing errors).

| `variant` | Use case |
|-----------|----------|
| `error` | API / validation failures (“Something went wrong”, offer/order load errors) |
| `empty` | No search params yet (“Search for flights to see results”) |
| `warning` | Non-blocking notices (e.g. instant order on payment page) |

```tsx
<FlowFeedbackCard
  variant="error"
  title="Something went wrong"
  description={userMessage}
  role="alert"
/>
```

- Use **`children`** for extra lines (reference id, secondary `Link`).
- Pass **`description` as `ReactNode`** only when you need custom markup (e.g. payment error paragraph); otherwise prefer a string.
- Set **`iconClassName={null}`** to hide the default Line Awesome icon (not used in current flows).

---

## 4. `FlowLoadingPanel`

**Role:** Bordered white/neutral card with **spinner** + message (offer refresh, order load, payment screen).

```tsx
{loading && <FlowLoadingPanel message="Refreshing offer…" />}
```

Prefer this over ad-hoc spinner `div`s on flight/booking pages.

---

## 5. URL state helper (listing search)

**Role:** Single parser for `/listing-flights?...` query keys (origin, destination, dates, guests, cabin).

```tsx
import { parseFlightSearchFromUrl } from "@/utils/flightSearchUrlState";
```

Use in **one place** for fetch + display logic (see `ListingFlightsPageClient.tsx`).  
**Do not** duplicate `CABIN_LABEL` / parse logic in new components—extend `flightSearchUrlState.ts` if new params are added.

Related: **`buildListingFlightsSearchHref`** / **`buildPassengersOfferHref`** in `src/utils/flightListingSearchParams.ts` for preserving search context across passengers ↔ listing.

---

## 6. Patterns to avoid

- Re-introducing raw `<BgGlassmorphism />` + `container` copies on new flight pages—use **`FlightFlowPageShell`**.
- One-off red/amber/neutral alert boxes—use **`FlowFeedbackCard`**.
- Duplicating the “back link + h1 + subtitle + optional right card” row—use **`BookingFlowPageHeader`**.

---

## 7. Relation to `button-submit` skill

- **`button-submit`:** search / submit **buttons** (`@/shared/ButtonSubmit`).
- **`flight-flow-ui`:** **page shell**, **headers**, **feedback**, **loading**, **URL parse** for the flight funnel.

Use both when building a new search surface that navigates into this flow.
