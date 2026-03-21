import { duffelPost } from "./duffel-client";

/** @see https://duffel.com/docs/api/v2/component-client-keys/create-component-client-key */
export interface ComponentClientKeyData {
  component_client_key: string;
}

export async function createDuffelComponentClientKey(body: {
  order_id?: string;
}): Promise<{ data: ComponentClientKeyData }> {
  const data =
    body.order_id && body.order_id.trim()
      ? { order_id: body.order_id.trim() }
      : {};
  return duffelPost<ComponentClientKeyData>("/identity/component_client_keys", {
    data,
  });
}
