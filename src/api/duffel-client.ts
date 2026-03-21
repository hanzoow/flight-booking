import { DuffelError, DuffelResponse } from "./models";

export class DuffelRequestError extends Error {
  readonly status: number;

  readonly errors: DuffelError["errors"];

  constructor(message: string, status: number, errors: DuffelError["errors"]) {
    super(message);
    this.name = "DuffelRequestError";
    this.status = status;
    this.errors = errors;
  }
}

const DUFFEL_BASE_URL = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

function getAccessToken(): string {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    throw new Error("DUFFEL_ACCESS_TOKEN environment variable is not set");
  }
  return token;
}

export async function duffelGet<T>(
  path: string,
  params?: Record<string, string | undefined>
): Promise<DuffelResponse<T>> {
  const url = new URL(path, DUFFEL_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "Duffel-Version": DUFFEL_VERSION,
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  if (!response.ok) {
    const error: DuffelError = await response.json();
    const first = error.errors?.[0];
    throw new DuffelRequestError(
      first?.message ?? `Duffel API error: ${response.status}`,
      response.status,
      error.errors ?? []
    );
  }

  return response.json();
}

export async function duffelPost<T>(
  path: string,
  body: unknown
): Promise<DuffelResponse<T>> {
  const response = await fetch(`${DUFFEL_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "Duffel-Version": DUFFEL_VERSION,
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: DuffelError = await response.json();
    const first = error.errors?.[0];
    throw new DuffelRequestError(
      first?.message ?? `Duffel API error: ${response.status}`,
      response.status,
      error.errors ?? []
    );
  }

  return response.json();
}
