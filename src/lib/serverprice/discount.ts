import { REGION_SHORT, SEGMENT_RULES } from "./data";
import type { CustomerSegment, DiscountQuote, ServerProduct } from "./types";

const REGION_ADJUST: Record<string, { delta: number; reason: string }> = {
  "us-east": { delta: 0, reason: "Primary region — rate card baseline" },
  "us-west": { delta: -1, reason: "Capacity constrained region, less headroom" },
  "eu-central": { delta: 1.5, reason: "Competitive pressure from local providers" },
  apac: { delta: 2, reason: "Market-entry pricing program active" },
  latam: { delta: 3, reason: "FX exposure offset + growth incentive" },
};

export interface QuoteInput {
  product: ServerProduct;
  segment: CustomerSegment;
  units: number;
  termMonths: 12 | 24 | 36;
}

export function calculateDiscount({
  product,
  segment,
  units,
  termMonths,
}: QuoteInput): DiscountQuote {
  const rules: DiscountQuote["rules"] = [];

  const segmentRule = SEGMENT_RULES[segment];
  rules.push({
    label: `Segment baseline — ${segment.replace("-", " ")}`,
    delta: segmentRule.base,
    detail: segmentRule.note,
  });

  const tier = [...product.discountTiers]
    .filter((t) => units >= t.minUnits && t.label.startsWith(String(termMonths)))
    .sort((a, b) => b.percent - a.percent)[0];

  if (tier) {
    rules.push({
      label: `Commit tier — ${tier.label}`,
      delta: tier.percent,
      detail: `Published tier for ${tier.minUnits}+ units on this SKU`,
    });
  } else {
    const nearest = [...product.discountTiers].sort((a, b) => a.minUnits - b.minUnits)[0];
    rules.push({
      label: "Commit tier — not reached",
      delta: 0,
      detail: nearest
        ? `Needs ${nearest.minUnits} units on a ${nearest.label} to unlock ${nearest.percent}%`
        : "No published commit tiers for this SKU",
    });
  }

  const region = REGION_ADJUST[product.region]!;
  rules.push({
    label: `Region adjustment — ${REGION_SHORT[product.region]}`,
    delta: region.delta,
    detail: region.reason,
  });

  if (product.availability === "constrained" || product.availability === "backorder") {
    const penalty = product.availability === "backorder" ? -4 : -2;
    rules.push({
      label: "Supply constraint hold-back",
      delta: penalty,
      detail: `${product.leadTimeDays}-day lead time — pricing desk restricts concessions`,
    });
  }

  if (units >= 50) {
    rules.push({
      label: "Volume override",
      delta: 3,
      detail: `${units} units clears the 50-unit strategic volume gate`,
    });
  }

  const raw = rules.reduce((sum, r) => sum + r.delta, 0);
  const maxAllowed = 100 - product.marginFloorPercent;
  const discountPercent = Math.max(0, Math.min(raw, maxAllowed));

  if (raw > maxAllowed) {
    rules.push({
      label: "Margin floor cap",
      delta: +(maxAllowed - raw).toFixed(1),
      detail: `Capped at ${maxAllowed}% to protect the ${product.marginFloorPercent}% margin floor`,
    });
  }

  const listTotal = product.basePrice * units * termMonths;
  const netUnitPrice = product.basePrice * (1 - discountPercent / 100);
  const netTotal = netUnitPrice * units * termMonths;

  // Confidence reflects historical sample size, supply certainty and how
  // close the quote sits to the margin floor. Mirrors backend/app/discount.py —
  // each signal that moves the score records why, so the UI never has to guess.
  let score = 55;
  const confidenceFactors: DiscountQuote["confidenceFactors"] = [];
  const segmentText = segment.replace("-", " ");

  if (segmentRule.sampleSize > 200) {
    score += 20;
    confidenceFactors.push({
      label: "Deep deal history",
      detail: `${segmentRule.sampleSize} closed ${segmentText} deals back this rate`,
      direction: "up",
    });
  } else if (segmentRule.sampleSize > 100) {
    score += 12;
    confidenceFactors.push({
      label: "Moderate deal history",
      detail: `${segmentRule.sampleSize} comparable ${segmentText} deals on record`,
      direction: "up",
    });
  } else {
    score += 4;
    confidenceFactors.push({
      label: "Thin deal history",
      detail: `Only ${segmentRule.sampleSize} comparable ${segmentText} deals to reference`,
      direction: "down",
    });
  }

  if (tier) {
    score += 14;
    confidenceFactors.push({
      label: "Exact rate card match",
      detail: `Hits the published ${tier.label} tier at ${tier.minUnits}+ units`,
      direction: "up",
    });
  } else {
    confidenceFactors.push({
      label: "No commit tier matched",
      detail: "Priced off segment and region rules alone — no published tier applies",
      direction: "down",
    });
  }

  if (product.availability === "in-stock") {
    score += 10;
    confidenceFactors.push({
      label: "Supply confirmed",
      detail: `In stock, ${product.leadTimeDays}-day lead time`,
      direction: "up",
    });
  } else if (product.availability === "backorder") {
    score -= 12;
    confidenceFactors.push({
      label: "On backorder",
      detail: `${product.leadTimeDays}-day lead time puts the quote date at risk`,
      direction: "down",
    });
  } else {
    confidenceFactors.push({
      label: "Supply constrained",
      detail: `${product.leadTimeDays}-day lead time — allocation not guaranteed`,
      direction: "down",
    });
  }

  const marginPercent = 100 - product.marginFloorPercent - discountPercent;
  if (marginPercent < 5) {
    score -= 18;
    confidenceFactors.push({
      label: "Close to margin floor",
      detail: `Only ${marginPercent.toFixed(1)}% headroom above the ${product.marginFloorPercent}% floor`,
      direction: "down",
    });
  }

  score = Math.max(12, Math.min(97, score));

  const confidence = score >= 78 ? "high" : score >= 55 ? "medium" : "low";

  return {
    productId: product.id,
    segment,
    units,
    termMonths,
    basePrice: product.basePrice,
    listTotal,
    discountPercent: +discountPercent.toFixed(1),
    netUnitPrice: +netUnitPrice.toFixed(2),
    netTotal: +netTotal.toFixed(2),
    savings: +(listTotal - netTotal).toFixed(2),
    confidence,
    confidenceScore: score,
    marginPercent: +marginPercent.toFixed(1),
    requiresApproval: discountPercent > 20 || marginPercent < 6,
    rules,
    confidenceFactors,
  };
}

export const currency = (n: number, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(n);
