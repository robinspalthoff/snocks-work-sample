"use client";

import { useMemo } from "react";
import {
  BRANDS,
  CHANNELS,
  MARKETS,
  type Brand,
  type Channel,
  type Market,
} from "@/config/assumptions";
import { cubeMonth, marketingMonth } from "@/data/datasets";
import { useFilters } from "@/lib/filters";
import {
  BLENDED_SHIPPING,
  aggregate,
  aggregateMarketing,
  brandAllocation,
  channelEfficiency,
  computeCm,
  periodIndices,
  totalSpend,
  type Cm,
  type ChannelEfficiency,
  type Filters,
} from "@/lib/kpi";

export interface MonthPoint {
  month: string;
  real: Cm;
  reported: Cm;
}

export interface DimensionRow<T extends string> {
  key: T;
  real: Cm;
  reported: Cm;
}

export interface DashboardData {
  filters: Filters;
  /** Periodengerecht: Erstattungen bei der Ursprungsbestellung. */
  real: Cm;
  /** Wie im Standardreport: Erstattungen am Erstattungsdatum. */
  reported: Cm;
  monthly: MonthPoint[];
  byBrand: DimensionRow<Brand>[];
  byChannel: DimensionRow<Channel>[];
  byMarket: DimensionRow<Market>[];
  efficiency: ChannelEfficiency[];
  spend: number;
  /** Summe des attribuierten Umsatzes aller Marketing-Kanäle. */
  attributedRevenue: number;
  months: string[];
}

/** Rechnet beide Sichten für einen Filterschnitt. */
function cmPair(f: Filters): { real: Cm; reported: Cm; spend: number } {
  const rows = aggregate(cubeMonth, f);
  const alloc = brandAllocation(cubeMonth, f);
  const spend = totalSpend(aggregateMarketing(marketingMonth, f, alloc));
  return {
    real: computeCm(rows, "cohort", spend),
    reported: computeCm(rows, "reported", spend),
    spend,
  };
}

/**
 * Zentrale Auswertung für alle Seiten. Rechnet aus dem Monatswürfel beide
 * Sichten, die Monatsreihe und die Dimensionsschnitte. Das sind wenige
 * tausend Additionen – schnell genug, um bei jedem Filterklick neu zu
 * rechnen, und es gibt keine zweite Wahrheit im Code.
 */
export function useDashboard(): DashboardData {
  const { filters } = useFilters();

  return useMemo(() => {
    const rows = aggregate(cubeMonth, filters);
    const alloc = brandAllocation(cubeMonth, filters);
    const mktRows = aggregateMarketing(marketingMonth, filters, alloc);
    const spend = totalSpend(mktRows);

    const real = computeCm(rows, "cohort", spend);
    const reported = computeCm(rows, "reported", spend);

    const monthIdx = periodIndices(cubeMonth, filters);
    const monthKeys = monthIdx.map((i) => cubeMonth.periods[i]);

    const monthly: MonthPoint[] = monthKeys.map((month) => {
      const mf: Filters = { ...filters, from: month, to: month };
      const pair = cmPair(mf);
      return { month, real: pair.real, reported: pair.reported };
    });

    const byBrand = BRANDS.filter((b) => filters.brands.includes(b)).map((b) => {
      const pair = cmPair({ ...filters, brands: [b] });
      return { key: b, real: pair.real, reported: pair.reported };
    });

    const byChannel = CHANNELS.filter((c) => filters.channels.includes(c)).map((c) => {
      const pair = cmPair({ ...filters, channels: [c] });
      return { key: c, real: pair.real, reported: pair.reported };
    });

    const byMarket = MARKETS.filter((m) => filters.markets.includes(m)).map((m) => {
      const pair = cmPair({ ...filters, markets: [m] });
      return { key: m, real: pair.real, reported: pair.reported };
    });

    const efficiency = channelEfficiency(mktRows, BLENDED_SHIPPING);
    const attributedRevenue = efficiency.reduce((a, e) => a + e.attributedRevenue, 0);

    return {
      filters,
      real,
      reported,
      monthly,
      byBrand,
      byChannel,
      byMarket,
      efficiency,
      spend,
      attributedRevenue,
      months: monthKeys,
    };
  }, [filters]);
}

/** Gesamt-POAS: CM2 der attribuierten Bestellungen je Euro Ad-Spend. */
export function blendedPoas(efficiency: ChannelEfficiency[]): number {
  const spend = efficiency.reduce((a, e) => a + e.spend, 0);
  const cm2 = efficiency.reduce((a, e) => a + e.cm2, 0);
  return spend === 0 ? 0 : cm2 / spend;
}
