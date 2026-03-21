import { Suspense } from "react";
import HoldPaymentClient from "@/components/booking/HoldPaymentClient";

export default function HoldPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 text-center text-neutral-500">
          Loading…
        </div>
      }
    >
      <HoldPaymentClient />
    </Suspense>
  );
}
