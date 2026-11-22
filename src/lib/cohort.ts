"use client";

import { BRANDS, type Brand } from "@/config/assumptions";
import { cohortMetricIdx, cohorts } from "@/data/datasets";
import { computeCm, matchesCombo, safeDiv, type Cm, type ComboSums, type Filters } from "@/lib/kpi";

/**
 * Deckungsbeitrag einer Bestell-Kohorte zum Zeitpunkt t Tage nach der
 * Bestellung. Zum Tag 0 ist noch keine Erstattung eingetroffen – die
 * Kohorte sieht maximal profitabel aus. Mit jedem Tag kommen Retouren
 * dazu, bis nach rund 60 Tagen der endgültige Wert steht.
 *
 * Es ist dieselbe computeCm()-Logik wie überall sonst; nur die Höhe der
 * Erstattungen hängt an der kumulierten Verzögerungsverteilung.
 */
export function cohortCmAt(cohortIdx: number, t: number, f: Filters): Cm {
  const share = cohorts.cumPmf[Math.max(0, Math.min(cohorts.cumPmf.length - 1, t))];
  const rows: ComboSums[] = [];

  for (let ci = 0; ci < cohorts.combos.length; ci++) {
    const combo = cohorts.combos[ci];
    if (!matchesCombo(combo, f)) continue;
    const v = cohorts.data[cohortIdx][ci];
    rows.push({
      combo,
      sums: {
        orders: v[cohortMetricIdx.orders],
        newOrders: v[cohortMetricIdx.newOrders],
        gross: v[cohortMetricIdx.gross],
        discount: v[cohortMetricIdx.discount],
        refundCohort: v[cohortMetricIdx.refundTotal] * share,
        refundReported: 0,
        returnedOrdersCohort: v[cohortMetricIdx.returnedOrdersTotal] * share,
        returnedOrdersReported: 0,
        cogsShipped: v[cohortMetricIdx.cogsShipped],
        cogsReturnedCohort: v[cohortMetricIdx.cogsReturnedTotal] * share,
        cogsReturnedReported: 0,
      },
    });
  }

  return computeCm(rows, "cohort", cohortSpend(cohortIdx, f));
}

/**
 * Marketing-Spend der Kohorte. Liegt nur je Marke vor und wird bei
 * aktivem Kanal- oder Marktfilter anteilig nach Netto-Umsatz allokiert.
 */
export function cohortSpend(cohortIdx: number, f: Filters): number {
  let spend = 0;
  for (const brand of BRANDS) {
    if (!f.brands.includes(brand)) continue;
    const bi = BRANDS.indexOf(brand);
    let selected = 0;
    let total = 0;
    for (let ci = 0; ci < cohorts.combos.length; ci++) {
      const combo = cohorts.combos[ci];
      if (combo.brand !== brand) continue;
      const v = cohorts.data[cohortIdx][ci];
      const net =
        v[cohortMetricIdx.gross] - v[cohortMetricIdx.discount] - v[cohortMetricIdx.refundTotal];
      total += net;
      if (matchesCombo(combo, f)) selected += net;
    }
    spend += (cohorts.spend[cohortIdx][bi] ?? 0) * safeDiv(selected, total);
  }
  return spend;
}

export interface CohortCurvePoint {
  day: number;
  cm3: number;
  cm3Margin: number;
  cm2Margin: number;
  netRevenue: number;
  refunds: number;
  returnRate: number;
}

/** Vollständiger 0–60-Tage-Verlauf einer Kohorte. */
export function cohortCurve(cohortIdx: number, f: Filters): CohortCurvePoint[] {
  const out: CohortCurvePoint[] = [];
  for (let t = 0; t < cohorts.cumPmf.length; t++) {
    const cm = cohortCmAt(cohortIdx, t, f);
    out.push({
      day: t,
      cm3: cm.cm3,
      cm3Margin: cm.cm3Margin,
      cm2Margin: cm.cm2Margin,
      netRevenue: cm.netRevenue,
      refunds: cm.refunds,
      returnRate: cm.returnRate,
    });
  }
  return out;
}

export function cohortIndexById(id: string): number {
  return cohorts.cohorts.findIndex((c) => c.id === id);
}

export type { Brand };
