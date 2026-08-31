/**
 * Data-fetching layer for ServerPrice.
 *
 * Every read/write goes through `request()`, which targets the FastAPI
 * backend at API_BASE_URL — from both the browser and the SSR server, since
 * TanStack Start route loaders run server-side first. Product/health calls
 * fall back to placeholder data if the backend is unreachable; deal/BOM
 * calls have no meaningful offline fallback and surface a real error.
 */
import { buildHealthSnapshot, PRODUCTS } from "./data";
import { calculateDiscount } from "./discount";
import type {
  CustomerSegment,
  Deal,
  DealStage,
  DealSummary,
  DiscountQuote,
  HealthSnapshot,
  Region,
  ServerProduct,
  StakeholderRole,
  StakeholderStatus,
} from "./types";

export const API_BASE_URL = "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 2500;

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    // FastAPI/Pydantic validation errors come back as an array of
    // { loc, msg, type } objects — join their messages into one string.
    if (Array.isArray(body?.detail)) {
      return body.detail
        .map((d: { loc?: unknown[]; msg?: string }) => {
          const field = Array.isArray(d.loc) ? d.loc.at(-1) : undefined;
          return field ? `${field}: ${d.msg}` : d.msg;
        })
        .filter(Boolean)
        .join("; ");
    }
  } catch {
    // Response body wasn't JSON — fall through to the status text below.
  }
  return `${res.status} ${res.statusText}`;
}

async function request<T>(path: string, init: RequestInit | undefined, fallback: () => T): Promise<T> {
  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    clearTimeout(timer);
  } catch {
    // The backend itself is unreachable (down, timed out, network error) —
    // this is the only case that should fall back to placeholder data.
    await new Promise((r) => setTimeout(r, 420));
    return fallback();
  }

  // The backend responded — a 4xx/5xx here is a real validation or business
  // rule error, not "no backend yet". Surface it, don't paper over it.
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return (await res.json()) as T;
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

  // Deal/BOM management has no offline placeholder — there's no meaningful
  // fake dataset for stakeholder sign-offs and stage transitions, so a
  // dropped backend surfaces as a real error instead of silently faking it.
  listDeals: (filters: { stage?: DealStage; region?: Region; search?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.stage) params.set("stage", filters.stage);
    if (filters.region) params.set("region", filters.region);
    if (filters.search) params.set("search", filters.search);
    const qs = params.toString();
    return request<DealSummary[]>(`/deals${qs ? `?${qs}` : ""}`, undefined, backendRequired);
  },

  getDeal: (id: string) => request<Deal>(`/deals/${id}`, undefined, backendRequired),

  changeDealStage: (id: string, stage: DealStage) =>
    request<Deal>(
      `/deals/${id}/stage`,
      { method: "POST", body: JSON.stringify({ stage }) },
      backendRequired,
    ),

  revertDealStage: (id: string) =>
    request<Deal>(`/deals/${id}/stage/revert`, { method: "POST" }, backendRequired),

  signoffStakeholder: (id: string, role: StakeholderRole, status: StakeholderStatus, actor?: string) =>
    request<Deal>(
      `/deals/${id}/stakeholders/${role}/signoff`,
      { method: "POST", body: JSON.stringify({ status, actor }) },
      backendRequired,
    ),

  addBomItem: (
    id: string,
    payload: { productId: string; quantity: number; termMonths: 12 | 24 | 36; segment: CustomerSegment },
  ) =>
    request<Deal>(`/deals/${id}/bom`, { method: "POST", body: JSON.stringify(payload) }, backendRequired),

  removeBomItem: (id: string, itemId: string) =>
    request<Deal>(`/deals/${id}/bom/${itemId}`, { method: "DELETE" }, backendRequired),
};

function backendRequired(): never {
  throw new Error("Backend unavailable — start the FastAPI server on localhost:8000");
}

export const queryKeys = {
  products: ["products"] as const,
  health: ["health"] as const,
  quote: (p: unknown) => ["quote", p] as const,
  deals: (filters: unknown) => ["deals", filters] as const,
  deal: (id: string) => ["deal", id] as const,
};
