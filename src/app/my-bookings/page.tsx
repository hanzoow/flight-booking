import { Suspense } from "react";
import MyBookingsClient from "./MyBookingsClient";

export default function MyBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 text-center text-neutral-500">
          Loading…
        </div>
      }
    >
      <MyBookingsClient />
    </Suspense>
  );
}
