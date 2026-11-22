/**
 * Zugriff auf die generierten Datensätze.
 *
 * Die Dateien entstehen über `npm run generate` (deterministisch, fester
 * Seed) und liegen nicht im Repository. Bewusst werden hier die VORAB
 * AGGREGIERTEN Varianten eingebunden: der vollständige Tageswürfel
 * (`cube-daily.json`, Tag × Marke × Kanal × Markt) existiert als
 * Referenzartefakt, ist für die Auslieferung an den Browser aber zu groß.
 *
 *   cube-month.json          → Basis aller Filter und Aggregate (23 Monate)
 *   cube-window-daily.json   → Tagesauflösung in den Sales-Event-Fenstern
 *   cohorts.json             → 60-Tage-Verlauf ausgewählter Bestell-Kohorten
 */
import cubeMonthRaw from "../../data/cube-month.json";
import cubeWindowRaw from "../../data/cube-window-daily.json";
import marketingMonthRaw from "../../data/marketing-month.json";
import cohortsRaw from "../../data/cohorts.json";
import metaRaw from "../../data/meta.json";
import {
  decodeCube,
  decodeMarketing,
  type Cube,
  type MarketingCube,
  type RawCube,
  type RawMarketingCube,
} from "@/lib/kpi";
import type { Brand, Channel, Market } from "@/config/assumptions";

export const cubeMonth: Cube = decodeCube(cubeMonthRaw as unknown as RawCube);
export const cubeWindowDaily: Cube = decodeCube(cubeWindowRaw as unknown as RawCube);
export const marketingMonth: MarketingCube = decodeMarketing(
  marketingMonthRaw as unknown as RawMarketingCube,
);

export const months: string[] = cubeMonth.periods;
export const meta = metaRaw;

// ─── Kohorten ───────────────────────────────────────────────────────────

export const COHORT_METRICS = [
  "orders",
  "newOrders",
  "gross",
  "discount",
  "refundTotal",
  "returnedOrdersTotal",
  "cogsShipped",
  "cogsReturnedTotal",
] as const;
export type CohortMetric = (typeof COHORT_METRICS)[number];

export interface CohortDefinition {
  id: string;
  label: string;
  start: string;
  end: string;
  highlight: boolean;
}

export interface CohortData {
  cohorts: CohortDefinition[];
  combos: { brand: Brand; channel: Channel; market: Market }[];
  /** data[cohortIdx][comboIdx][metricIdx] */
  data: number[][][];
  /** spend[cohortIdx][brandIdx] */
  spend: number[][];
  /** Anteil der Erstattungen, die bis Tag t nach Bestellung eingegangen sind. */
  cumPmf: number[];
  brands: Brand[];
}

const rawCohorts = cohortsRaw as unknown as {
  cohorts: CohortDefinition[];
  brands: string[];
  channels: string[];
  markets: string[];
  metrics: string[];
  combos: number[][];
  data: number[][][];
  spend: number[][];
  cumPmf: number[];
};

export const cohorts: CohortData = {
  cohorts: rawCohorts.cohorts,
  brands: rawCohorts.brands as Brand[],
  combos: rawCohorts.combos.map(([b, c, m]) => ({
    brand: rawCohorts.brands[b] as Brand,
    channel: rawCohorts.channels[c] as Channel,
    market: rawCohorts.markets[m] as Market,
  })),
  data: rawCohorts.data,
  spend: rawCohorts.spend,
  cumPmf: rawCohorts.cumPmf,
};

export const cohortMetricIdx: Record<CohortMetric, number> = Object.fromEntries(
  rawCohorts.metrics.map((m, i) => [m, i]),
) as Record<CohortMetric, number>;
