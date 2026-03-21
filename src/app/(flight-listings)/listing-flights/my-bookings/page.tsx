import { redirect } from "next/navigation";

/** Legacy URL: forwards to `/my-bookings` (preserves `?orderId=`). */
export default function LegacyMyBookingsPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const id = searchParams?.orderId?.trim();
  redirect(
    id
      ? `/my-bookings?orderId=${encodeURIComponent(id)}`
      : "/my-bookings"
  );
}
