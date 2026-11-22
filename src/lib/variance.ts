"use client";

import { BRANDS, type Brand } from "@/config/assumptions";
import { cubeMonth, planRows } from "@/data/datasets";
import { aggregate, brandAllocation, safeDiv, type Filters } from "@/lib/kpi";

/**
 * Abweichungszerlegung Plan/Ist für den Netto-Umsatz.
 *
 * Die drei Mengen-/Preiseffekte werden auf dem Bestellwert VOR Erstattungen
 * gerechnet und mit (1 − Plan-Retourenquote) auf Netto-Ebene gebracht; der
 * Retoureneffekt trägt den Rest. Die Summe der vier Effekte ergibt exakt
 * die Gesamtabweichung – das ist die Probe, die eine Zerlegung bestehen muss.
 *
 *   Mengeneffekt   = (Ist-Bestellungen − Plan-Bestellungen) × Plan-AOV
 *   Preiseffekt    = (Ist-AOV − Plan-AOV) × Ist-Bestellungen
 *   Mixeffekt      = Mengeneffekt je Marke − Mengeneffekt auf Basis des
 *                    durchschnittlichen Plan-AOV (Verschiebung zwischen
 *                    Marken mit unterschiedlichem Bestellwert)
 *   Retoureneffekt = −(Ist-Retourenquote − Plan-Retourenquote) × Ist-Bestellwert
 */
export interface VarianceRow {
  key: string;
  planNetRevenue: number;
  actualNetRevenue: number;
  variance: number;
  volume: number;
  price: number;
  mix: number;
  returns: number;
  planOrders: number;
  actualOrders: number;
  planAov: number;
  actualAov: number;
  planReturnRate: number;
  actualReturnRate: number;
}

interface Figures {
  orders: number;
  netBeforeRefund: number;
  refunds: number;
}

function actualFigures(f: Filters, brand: Brand | null, month: string | null): Figures {
  const filters: Filters = {
    ...f,
    brands: brand ? [brand] : f.brands,
    from: month ?? f.from,
    to: month ?? f.to,
  };
  const rows = aggregate(cubeMonth, filters);
  let orders = 0;
  let netBeforeRefund = 0;
  let refunds = 0;
  for (const r of rows) {
    orders += r.sums.orders;
    netBeforeRefund += r.sums.gross - r.sums.discount;
    refunds += r.sums.refundCohort;
  }
  return { orders, netBeforeRefund, refunds };
}

/**
 * Plan-Daten liegen je Marke und Monat vor, nicht je Kanal oder Markt.
 * Bei aktivem Kanal- oder Marktfilter wird der Markenplan mit dem
 * Umsatzanteil der Auswahl skaliert, damit Plan und Ist dieselbe Grundmenge
 * beschreiben.
 */
function planFigures(
  f: Filters,
  brand: Brand | null,
  month: string | null,
  allocation: Partial<Record<Brand, number>>,
): Figures {
  let orders = 0;
  let netBeforeRefund = 0;
  let refunds = 0;
  for (const row of planRows) {
    if (row.month < f.from || row.month > f.to) continue;
    if (month && row.month !== month) continue;
    if (brand ? row.brand !== brand : !f.brands.includes(row.brand)) continue;
    const share = allocation[row.brand] ?? 1;
    const nbr = row.planOrders * row.planAov * share;
    orders += row.planOrders * share;
    netBeforeRefund += nbr;
    refunds += nbr * row.planReturnRate;
  }
  return { orders, netBeforeRefund, refunds };
}

function decompose(plan: Figures, actual: Figures, brandSplit: { plan: Figures; actual: Figures }[]) {
  const planAov = safeDiv(plan.netBeforeRefund, plan.orders);
  const planReturnRate = safeDiv(plan.refunds, plan.netBeforeRefund);
  const keepRate = 1 - planReturnRate;

  // Menge und Preis je Marke – zusammen exakt die Abweichung vor Retouren.
  let volumeByBrand = 0;
  let price = 0;
  for (const b of brandSplit) {
    const pAov = safeDiv(b.plan.netBeforeRefund, b.plan.orders);
    const aAov = safeDiv(b.actual.netBeforeRefund, b.actual.orders);
    volumeByBrand += (b.actual.orders - b.plan.orders) * pAov;
    price += (aAov - pAov) * b.actual.orders;
  }
  const volumeBlended = (actual.orders - plan.orders) * planAov;
  const mix = volumeByBrand - volumeBlended;

  const actualReturnRate = safeDiv(actual.refunds, actual.netBeforeRefund);
  const returns = -(actualReturnRate - planReturnRate) * actual.netBeforeRefund;

  return {
    volume: volumeBlended * keepRate,
    price: price * keepRate,
    mix: mix * keepRate,
    returns,
    planAov,
    planReturnRate,
    actualAov: safeDiv(actual.netBeforeRefund, actual.orders),
    actualReturnRate,
  };
}

export function monthlyVariance(f: Filters): VarianceRow[] {
  const months: string[] = [];
  for (const m of cubeMonth.periods) {
    if (m >= f.from && m <= f.to) months.push(m);
  }

  const allocation = brandAllocation(cubeMonth, f);

  return months.map((month) => {
    const plan = planFigures(f, null, month, allocation);
    const actual = actualFigures(f, null, month);
    const brandSplit = BRANDS.filter((b) => f.brands.includes(b)).map((b) => ({
      plan: planFigures(f, b, month, allocation),
      actual: actualFigures(f, b, month),
    }));
    const parts = decompose(plan, actual, brandSplit);
    const planNet = plan.netBeforeRefund - plan.refunds;
    const actualNet = actual.netBeforeRefund - actual.refunds;
    return {
      key: month,
      planNetRevenue: planNet,
      actualNetRevenue: actualNet,
      variance: actualNet - planNet,
      planOrders: plan.orders,
      actualOrders: actual.orders,
      ...parts,
    };
  });
}

export function totalVariance(f: Filters): VarianceRow {
  const allocation = brandAllocation(cubeMonth, f);
  const plan = planFigures(f, null, null, allocation);
  const actual = actualFigures(f, null, null);
  const brandSplit = BRANDS.filter((b) => f.brands.includes(b)).map((b) => ({
    plan: planFigures(f, b, null, allocation),
    actual: actualFigures(f, b, null),
  }));
  const parts = decompose(plan, actual, brandSplit);
  const planNet = plan.netBeforeRefund - plan.refunds;
  const actualNet = actual.netBeforeRefund - actual.refunds;
  return {
    key: "Gesamt",
    planNetRevenue: planNet,
    actualNetRevenue: actualNet,
    variance: actualNet - planNet,
    planOrders: plan.orders,
    actualOrders: actual.orders,
    ...parts,
  };
}
