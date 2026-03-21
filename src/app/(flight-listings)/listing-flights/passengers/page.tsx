import { Suspense } from "react";
import PassengerBookingClient from "./PassengerBookingClient";

export default function PassengerBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 text-center text-neutral-500">
          Loading…
        </div>
      }
    >
      <PassengerBookingClient />
    </Suspense>
  );
}
