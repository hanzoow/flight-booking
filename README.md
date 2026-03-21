# Flight Booking (Duffel) — Easy GDS

A **Next.js (App Router)** flight shopping and booking experience built on the **Chisfis** UI template, integrated with **Duffel** for offer requests, orders, payments (including 3D Secure card flows), and **@duffel/components** for card capture.

---

## Table of contents

1. [Architectural decisions](#architectural-decisions)  
2. [Competitor analysis](#competitor-analysis)  
3. [AI tools](#ai-tools)  
4. [Setup instructions](#setup-instructions)  
5. [Original template](#original-template)

---

## Architectural decisions

### Component structure

- **App Router (`src/app/`)** — Routes for listings (`/listing-flights`), passengers, payment/confirmation, and **`/my-bookings`** (saved order IDs in `localStorage`, loaded via API).
- **Feature-oriented UI** — Booking flow split into focused clients: `ListingFlightsPageClient` (search results + filters), `PassengerBookingForm` / `PassengerBookingClient`, `HoldPaymentClient` + `BookingConfirmationPageView`, and `MyBookingsClient`.
- **Shared presentation** — `FlightCard`, `FlightListingWithFilters`, `BookingSteps`, `OrderConfirmationPanel`, and skeletons (`FlightListingsSkeleton`) keep listing and confirmation layouts consistent.
- **API abstraction** — `src/api/*` (Duffel HTTP client, orders, payments, offer requests) used only from **Route Handlers** under `src/app/api/*` so secrets stay server-side.

**Rationale:** Clear boundaries between “page shell,” client orchestration, and server-only Duffel access make it easier to test, extend (e.g. new payment types), and avoid leaking the access token to the browser.

### State management approach

- **Local React state** for form fields, filters (stops, search text), sort order, round-trip wizard step (outbound vs return selection), and loading/error on the listing page.
- **`useSearchParams`** as the source of truth for **flight search criteria**; listing results are refetched when the query string changes. **Search context** is copied onto passenger URLs and restored on “Back to search results” via `flightListingSearchParams` helpers.
- **`localStorage`** for “My Booking” order ID list (not a full state library).

**Rationale:** The booking funnel is linear and URL-addressable; avoiding global stores keeps data flow obvious. Persisting only order IDs locally is enough for a demo “return to my trip” pattern without a backend user account.

### Data fetching & rendering strategy

| Area | Strategy | Rationale |
|------|-----------|-----------|
| Duffel API calls | **Server-only** (`Route Handlers` + `src/api/duffel-client.ts`) | Protect `DUFFEL_ACCESS_TOKEN`; map Duffel errors to safe client messages. |
| Flight search results | **CSR** — `ListingFlightsPageClient` calls **`GET /api/offer-requests`** when URL params change | Shows **loading skeletons** immediately on param changes (e.g. after “Edit search”); `AbortController` cancels stale requests. |
| Offer / order reads | **CSR** via `fetch` to `/api/offers/[id]`, `/api/orders/[id]` | Keeps passenger and confirmation pages dynamic after navigation. |
| Payments & component client key | **CSR** + server routes (`/api/payments`, `/api/component-client-keys`) | Card data stays in Duffel Components; server creates client keys and posts payments. |
| Initial route load | **`loading.tsx`** + **`Suspense`** fallbacks | Perceived performance while the app shell hydrates. |

**SSR / Server Components:** The listing page shell uses a thin server `page.tsx` with `Suspense`; heavy Duffel work for **repeat searches** is intentionally moved to the client + API route so UX can show skeletons and cancel in-flight fetches. Server routes remain the only place that talk to Duffel with the access token.

---

## Competitor analysis

Patterns observed on major OTAs (e.g. **Trip.com**, **Booking.com**, **AirAsia**, **Expedia**) and how this project relates:

### Adopted or aligned patterns

- **Left filter column + main result list** on desktop; **filters in a sheet/modal** on mobile — matches common OTA density and scanability.
- **Sort controls** (e.g. duration vs price) and a **short disclaimer** (local times, round-trip behaviour) — reduces support confusion.
- **Progress / steps** (search → travellers → confirmation/payment) — similar to phased checkout on large travel sites.
- **Expandable itinerary rows** on a card — users can skim prices first, then drill into segments and stops.
- **Round-trip “pick outbound, then return”** wizard — mirrors many sites that anchor the UX on the outbound choice before return options.
- **Prominent booking reference + order id** on confirmation — standard for support and “manage booking” flows.
- **Loading placeholders** during search — OTAs rarely show a blank screen; skeletons approximate final layout.

### Deliberately avoided or simplified

- **Account login, loyalty, and saved traveller profiles** — not in scope for this Duffel-led demo; “My Booking” uses **local IDs** only.
- **Full airline filter matrix, baggage sliders, fare families grid** — placeholders or “coming soon” where Duffel data or time did not justify full parity.
- **Aggressive upsell** (hotels, insurance bundles) — kept focus on **flight path** and template consistency.
- **Proprietary maps / explore-everywhere** — not required for the core booking story.

---

## AI tools

- **Cursor IDE** with the **Claude** model was used as the primary assistant during development.

### How they were used

- **Duffel documentation** was provided as context so the assistant could align **API shapes**, **order/payment flows**, **3D Secure**, and **`@duffel/components`** usage with official behaviour.
- **Natural-language requests** drove implementation of features (e.g. hold vs instant orders, payment page split, confirmation layout, My Booking, URL param preservation).
- **UI/UX prompts** asked for layouts that fit the existing **Chisfis / Tailwind** design system (e.g. confirmation page, skeletons, header links).

### Where they helped most

- **Implementing and wiring Duffel APIs** (offer requests, orders, payments, component client keys, error handling).
- **Generating and refactoring reusable UI** (flight cards, filters, booking steps, confirmation panels, loading skeletons) while staying consistent with template tokens (`primary-6000`, `neutral`, dark mode).

Human review was still applied for correctness, security (secrets only on server), and end-to-end flow testing.

---

## Setup instructions

### Prerequisites

- **Node.js** 18+ recommended  
- **npm**, **yarn**, or **pnpm**  
- A **Duffel** account and **test access token**

### 1. Clone and install

```bash
git clone <your-repo-url>
cd flight-booking-easygds
npm install
```

### 2. Environment variables

Create **`.env.local`** in the project root:

```env
DUFFEL_ACCESS_TOKEN=duffel_test_xxxxxxxx
```

- Use a **test** token from the Duffel dashboard for development.  
- Never commit `.env.local` or expose this token in client-side code.

Optional (e.g. to hide demo test-card hints in production builds):

```env
NEXT_PUBLIC_SHOW_DUFFEL_TEST_CARDS=false
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Flight search lives under **`/listing-flights`** (with query parameters after you submit the hero search form).

### 4. Production build

```bash
npm run build
npm start
```

Ensure **`DUFFEL_ACCESS_TOKEN`** is set in the hosting environment for API routes to work.

---

## Original template

This project started from **Chisfis** — a responsive Next.js booking/listing template (Tailwind, App Router–oriented stack).

- Original theme credits: see legacy notes in upstream Chisfis documentation.  
- Flight-specific flows, Duffel integration, and booking UX described in this document were added on top of that base.

---

Crafted with ❤️ — template foundation by [Hamed Hasan](https://github.com/Hamed-Hasan); flight integration and documentation extended for this project.
