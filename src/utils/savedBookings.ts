const STORAGE_KEY = "easygds_saved_order_ids";
const MAX_IDS = 30;

function readRaw(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0
    );
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

/** Remember an order id for “My Booking” (deduped, newest first). */
export function addSavedOrderId(orderId: string): void {
  const id = orderId?.trim();
  if (!id) return;
  const list = readRaw().filter((x) => x !== id);
  write([id, ...list].slice(0, MAX_IDS));
}

export function getSavedOrderIds(): string[] {
  return readRaw();
}

export function removeSavedOrderId(orderId: string): void {
  const id = orderId?.trim();
  if (!id) return;
  write(readRaw().filter((x) => x !== id));
}
