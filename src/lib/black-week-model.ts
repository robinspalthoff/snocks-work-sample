"use client";

import { BLACK_WEEK_2025, UNIT_COSTS } from "@/config/assumptions";
import type { Cm } from "@/lib/kpi";

export interface PlannerInputs {
  /** Rabattsatz auf den Brutto-Umsatz. */
  discountRate: number;
  /** Absatz-Uplift gegenüber dem Normalniveau derselben Kalendertage. */
  volumeUplift: number;
  /** Wertbasierte Retourenquote. */
  returnRate: number;
  /** Ad-Spend für das Aktionsfenster. */
  adSpend: number;
}

/**
 * Kennzahlen, die aus der Black Week 2025 abgeleitet werden und das
 * Rechenmodell für 2026 kalibrieren. Alles, was nicht geregelt wird,
 * bleibt auf dem Niveau des Vorjahres.
 */
export interface PlannerBaseline {
  /** Brutto-Umsatz zu Listenpreisen ohne Event-Uplift, hochgerechnet auf 2026. */
  normalGross: number;
  /** Durchschnittlicher Netto-Bestellwert vor Erstattungen. */
  aov: number;
  /** Landed Cost in % des Brutto-Umsatzes. */
  cogsRate: number;
  /** Fulfillment + Versand je Bestellung. */
  logisticsPerOrder: number;
  /** Payment- und Marktplatzgebühren in % des Netto-Umsatzes. */
  feeRate: number;
  /** Werte der Black Week 2025 als Vorbelegung. */
  actual2025: Cm;
  inputs2025: PlannerInputs;
  growthFactor: number;
}

export interface PlannerResult {
  gross: number;
  discount: number;
  refunds: number;
  netRevenue: number;
  orders: number;
  cogs: number;
  cm1: number;
  variableCosts: number;
  cm2: number;
  marketing: number;
  cm3: number;
  cm3Margin: number;
  mer: number;
  poas: number;
}

/** Durchschnittlich erstatteter Anteil einer retournierten Bestellung. */
const AVG_REFUNDED_FRACTION = 0.872;

export function buildBaseline(actual2025: Cm, growthFactor: number): PlannerBaseline {
  const ev = BLACK_WEEK_2025;
  const orders = Math.max(1, actual2025.orders);
  const netBeforeRefund = actual2025.gross - actual2025.discount;

  return {
    normalGross: (actual2025.gross / (1 + ev.volumeUplift)) * growthFactor,
    aov: netBeforeRefund / orders,
    cogsRate: actual2025.gross > 0 ? actual2025.cogsShipped / actual2025.gross : 0.3,
    logisticsPerOrder: (actual2025.fulfillment + actual2025.shipping) / orders,
    feeRate:
      actual2025.netRevenue > 0
        ? (actual2025.paymentFees + actual2025.marketplaceFees) / actual2025.netRevenue
        : 0.05,
    actual2025,
    inputs2025: {
      discountRate: ev.discountRate,
      volumeUplift: ev.volumeUplift,
      returnRate: actual2025.returnRate,
      adSpend: actual2025.marketing * growthFactor,
    },
    growthFactor,
  };
}

/** Rechnet ein Szenario durch – dieselbe Kostenlogik wie im Ist-Reporting. */
export function runScenario(b: PlannerBaseline, i: PlannerInputs): PlannerResult {
  const gross = b.normalGross * (1 + i.volumeUplift);
  const discount = gross * i.discountRate;
  const netBeforeRefund = gross - discount;
  const refunds = netBeforeRefund * i.returnRate;
  const netRevenue = netBeforeRefund - refunds;

  const orders = b.aov > 0 ? netBeforeRefund / b.aov : 0;
  const returnedOrders = orders * (i.returnRate / AVG_REFUNDED_FRACTION);

  const cogsShipped = gross * b.cogsRate;
  const cogsReturned = netBeforeRefund > 0 ? cogsShipped * i.returnRate : 0;
  const cogs = cogsShipped - cogsReturned * (1 - UNIT_COSTS.returnWriteOffShare);

  const variableCosts =
    orders * b.logisticsPerOrder +
    returnedOrders * UNIT_COSTS.returnHandlingPerReturn +
    netRevenue * b.feeRate;

  const cm1 = netRevenue - cogs;
  const cm2 = cm1 - variableCosts;
  const cm3 = cm2 - i.adSpend;

  return {
    gross,
    discount,
    refunds,
    netRevenue,
    orders,
    cogs,
    cm1,
    variableCosts,
    cm2,
    marketing: i.adSpend,
    cm3,
    cm3Margin: netRevenue > 0 ? cm3 / netRevenue : 0,
    mer: i.adSpend > 0 ? netRevenue / i.adSpend : 0,
    poas: i.adSpend > 0 ? cm2 / i.adSpend : 0,
  };
}

/**
 * Rabattsatz, bei dem der CM3 auf null fällt – alles andere konstant.
 * Bisektion, weil der Zusammenhang durch die Mengen- und Retourenlogik
 * nicht linear ist.
 */
export function breakEvenDiscount(b: PlannerBaseline, i: PlannerInputs): number | null {
  const f = (d: number) => runScenario(b, { ...i, discountRate: d }).cm3;
  let lo = 0;
  let hi = 0.9;
  if (f(lo) < 0) return null; // schon ohne Rabatt negativ
  if (f(hi) > 0) return null; // selbst bei 90 % Rabatt positiv (unrealistisch)
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
