/**
 * Data-fetching layer for ServerPrice.
 *
 * Every read/write goes through `request()`, which targets the FastAPI
 * backend at API_BASE_URL. Until that backend exists the layer transparently
 * falls back to the local placeholder dataset, so swapping in the real API
 * requires no component changes.
 */
import { buildHealthSnapshot, PRODUCTS } from "./data";
import { calculateDiscount } from "./discount";
import type { CustomerSegment, DiscountQuote, HealthSnapshot, ServerProduct } from "./types";

export const API_BASE_URL = "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 2500;

async function request<T>(path: string, init: RequestInit | undefined, fallback: () => T): Promise<T> {
  if (typeof window === "undefined") return fallback();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } catch {
    // Backend not connected yet — serve placeholder data.
    await new Promise((r) => setTimeout(r, 420));
    return fallback();
  }
}

export const api = {
  listProducts: () => request<ServerProduct[]>("/products", undefined, () => PRODUCTS),

  getHealth: () =>
    request<HealthSnapshot>("/health/metrics", undefined, () => buildHealthSnapshot(Date.now())),

  quote: (payload: {
    productId: string;
    segment: CustomerSegment;
    units: number;
    termMonths: 12 | 24 | 36;
  }) =>
    request<DiscountQuote>(
      "/quotes/calculate",
      { method: "POST", body: JSON.stringify(payload) },
      () => {
        const product = PRODUCTS.find((p) => p.id === payload.productId);
        if (!product) throw new Error("Unknown product");
        return calculateDiscount({ ...payload, product });
      },
    ),

  exportQuote: (payload: { quote: DiscountQuote; reference: string }) =>
    request<{ id: string; status: string }>(
      "/quotes/export",
      { method: "POST", body: JSON.stringify(payload) },
      () => ({ id: `Q-${Math.floor(Math.random() * 90000 + 10000)}`, status: "finalized" }),
    ),
};

export const queryKeys = {
  products: ["products"] as const,
  health: ["health"] as const,
  quote: (p: unknown) => ["quote", p] as const,
};
