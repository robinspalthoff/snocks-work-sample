/**
 * Deterministischer Generator für die synthetischen Daten der Arbeitsprobe.
 *
 *   npm run generate
 *
 * Erzeugt JSON-Dateien in `data/`. Gleicher Seed → identische Dateien,
 * damit Build und Deploy reproduzierbar sind. Alle Annahmen stehen in
 * `src/config/assumptions.ts`; hier steht nur die Mechanik.
 *
 * Die zentrale Mechanik, um die es in diesem Dashboard geht: jede
 * Erstattung hat ZWEI Datumsangaben – das Bestelldatum (Kohortensicht,
 * periodengerecht) und das Erstattungsdatum (so bucht der Shopify-Report).
 * Der Generator schreibt beide Zuordnungen getrennt in den Datenwürfel.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  BASE_DISCOUNT_RATE,
  BRAND_ASSUMPTIONS,
  BRAND_CHANNEL_AFFINITY,
  BRANDS,
  CHANNEL_ASSUMPTIONS,
  CHANNELS,
  CLOSED_THROUGH,
  COHORT_WINDOWS,
  DAILY_NOISE_SD,
  DATA_END,
  DATA_START,
  MARKET_ASSUMPTIONS,
  MARKETING_ASSUMPTIONS,
  MARKETING_CHANNELS,
  MARKETS,
  MONTH_SEASONALITY,
  NET_REVENUE_2025_TARGET,
  PARTIAL_REFUND_RANGE,
  PARTIAL_REFUND_SHARE,
  PAYMENT_MIX,
  PLAN_OPTIMISM,
  RANDOM_SEED,
  REFUND_DELAY,
  REFUND_WINDOW_DAYS,
  SALES_EVENTS,
  TARGET_MER,
  UNIT_COSTS,
  WEEKDAY_SEASONALITY,
  type Brand,
  type Channel,
  type Market,
  type MarketingChannel,
  type SalesEvent,
} from "../src/config/assumptions";

// ─── RNG ────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(RANDOM_SEED);

/** Standardnormalverteilte Zufallszahl (Box-Muller). */
function randn(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Multiplikatives Rauschen mit Standardabweichung `sd`, nie negativ. */
function noise(sd: number): number {
  return Math.max(0.25, 1 + randn() * sd);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function pickWeighted<T>(items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ─── Datum ──────────────────────────────────────────────────────────────

const MS_DAY = 86_400_000;

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fromIso(s: string): Date {
  return new Date(`${s}T00:00:00Z`);
}

function addDays(iso: string, n: number): string {
  return toIso(new Date(fromIso(iso).getTime() + n * MS_DAY));
}

function dayRange(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  let t = fromIso(startIso).getTime();
  const end = fromIso(endIso).getTime();
  while (t <= end) {
    out.push(toIso(new Date(t)));
    t += MS_DAY;
  }
  return out;
}

/** Mo = 0 … So = 6 */
function weekdayIndex(iso: string): number {
  return (fromIso(iso).getUTCDay() + 6) % 7;
}

function monthIndex(iso: string): number {
  return Number(iso.slice(5, 7)) - 1;
}

function yearMonth(iso: string): string {
  return iso.slice(0, 7);
}

function daysBetween(aIso: string, bIso: string): number {
  return Math.round((fromIso(bIso).getTime() - fromIso(aIso).getTime()) / MS_DAY);
}

// ─── Zeitachse ──────────────────────────────────────────────────────────

/**
 * Vorlauf: Erstattungen, die im Januar 2025 im Shopify-Report auftauchen,
 * gehören zu Bestellungen aus November/Dezember 2024. Ohne Vorlauf hätte
 * die „Reported“-Linie am Anfang einen künstlichen Knick.
 */
const WARMUP_START = addDays(DATA_START, -REFUND_WINDOW_DAYS - 1);
const allDays = dayRange(WARMUP_START, DATA_END);
const emitFrom = allDays.indexOf(DATA_START);
const days = allDays.slice(emitFrom);
const D = allDays.length;

// ─── Events ─────────────────────────────────────────────────────────────

const eventByDay = new Map<string, SalesEvent>();
for (const ev of SALES_EVENTS) {
  for (const d of dayRange(ev.start, ev.end)) eventByDay.set(d, ev);
}

/**
 * Ad-Spend-Vorlauf: zehn Tage vor einem Event wird das Budget hochgefahren
 * (Prospecting, Retargeting-Pools füllen).
 */
function spendRamp(iso: string): number {
  let factor = 1;
  for (const ev of SALES_EVENTS) {
    const lead = daysBetween(iso, ev.start);
    if (lead > 0 && lead <= 10) {
      factor = Math.max(factor, 1 + (ev.spendFactor - 1) * 0.45 * ((11 - lead) / 10));
    }
  }
  return factor;
}

// ─── Verzögerung der Erstattungen ───────────────────────────────────────

/**
 * Diskrete Lognormal-Verteilung der Tage zwischen Bestellung und
 * Erstattung. Gipfel um Tag 12–16, Ausläufer bis Tag 60.
 */
const refundDelayPmf: number[] = (() => {
  const pmf = new Array(REFUND_WINDOW_DAYS + 1).fill(0);
  for (let t = REFUND_DELAY.minDays; t <= REFUND_DELAY.maxDays; t++) {
    const z = (Math.log(t) - REFUND_DELAY.mu) / REFUND_DELAY.sigma;
    pmf[t] = Math.exp(-0.5 * z * z) / (t * REFUND_DELAY.sigma * Math.sqrt(2 * Math.PI));
  }
  const sum = pmf.reduce((a, b) => a + b, 0);
  return pmf.map((p) => p / sum);
})();

/** Durchschnittlich erstatteter Anteil einer retournierten Bestellung. */
const AVG_REFUNDED_FRACTION =
  (1 - PARTIAL_REFUND_SHARE) +
  PARTIAL_REFUND_SHARE * ((PARTIAL_REFUND_RANGE.min + PARTIAL_REFUND_RANGE.max) / 2);

// ─── Kombinationen ──────────────────────────────────────────────────────

interface Combo {
  brand: Brand;
  channel: Channel;
  market: Market;
  bi: number;
  ci: number;
  mi: number;
  weight: number;
  aov: number;
  returnRate: number;
}

const combos: Combo[] = [];
for (const [ci, channel] of CHANNELS.entries()) {
  const ch = CHANNEL_ASSUMPTIONS[channel];
  for (const brand of ch.brands) {
    const br = BRAND_ASSUMPTIONS[brand];
    const affinity = BRAND_CHANNEL_AFFINITY[brand][channel] ?? 1;
    for (const market of ch.markets) {
      const mk = MARKET_ASSUMPTIONS[market];
      combos.push({
        brand,
        channel,
        market,
        bi: BRANDS.indexOf(brand),
        ci,
        mi: MARKETS.indexOf(market),
        weight: br.revenueShare * ch.revenueShare * mk.revenueShare * affinity,
        aov: br.aovShop * ch.aovFactor,
        returnRate: Math.max(0.01, br.returnRate + ch.returnRateDelta + mk.returnRateDelta),
      });
    }
  }
}
const weightSum = combos.reduce((a, c) => a + c.weight, 0);
for (const c of combos) c.weight /= weightSum;
const C = combos.length;

// ─── Würfel aufbauen ────────────────────────────────────────────────────

const metricNames = [
  "orders",
  "newOrders",
  "gross",
  "discount",
  "refundCohort",
  "refundReported",
  "returnedOrdersCohort",
  "returnedOrdersReported",
  "cogsShipped",
  "cogsReturnedCohort",
  "cogsReturnedReported",
] as const;

/** Rohwerte (float) pro Kombination × Tag, vor der Kalibrierung. */
const raw = {
  gross: mat(),
  discount: mat(),
  refundCohort: mat(),
  refundReported: mat(),
  returnedOrdersCohort: mat(),
  returnedOrdersReported: mat(),
  cogsShipped: mat(),
  cogsReturnedCohort: mat(),
  cogsReturnedReported: mat(),
};

function mat(): Float64Array[] {
  return Array.from({ length: C }, () => new Float64Array(D));
}

const BASE_DAILY = 300_000; // beliebiger Startwert, wird unten kalibriert

for (let ci = 0; ci < C; ci++) {
  const combo = combos[ci];
  const br = BRAND_ASSUMPTIONS[combo.brand];

  for (let di = 0; di < D; di++) {
    const iso = allDays[di];
    const ev = eventByDay.get(iso);

    // Trend: exponentielles Markenwachstum, verankert am 01.01.2025.
    const t = daysBetween(DATA_START, iso) / 365;
    const trend = Math.pow(1 + br.growth2026, t);

    const season = MONTH_SEASONALITY[monthIndex(iso)] * WEEKDAY_SEASONALITY[weekdayIndex(iso)];
    const uplift = 1 + (ev?.volumeUplift ?? 0);

    const gross =
      BASE_DAILY * combo.weight * trend * season * uplift * noise(DAILY_NOISE_SD);

    const discountRate = ev?.discountRate ?? BASE_DISCOUNT_RATE;
    const discount = gross * discountRate;
    const netBeforeRefund = gross - discount;

    // Retourenquote: Basis der Kombination, im Sales Event relativ erhöht.
    const returnRate = Math.min(
      0.6,
      combo.returnRate * (1 + (ev?.returnRateUplift ?? 0)) * noise(0.04),
    );

    const refund = netBeforeRefund * returnRate;
    // Landed Cost bezieht sich auf den Listenpreis, nicht auf den Rabattpreis.
    const cogsShipped = gross * br.cogsRate;
    const cogsReturned = netBeforeRefund > 0 ? cogsShipped * (refund / netBeforeRefund) : 0;
    const returnedOrders = (netBeforeRefund / combo.aov) * (returnRate / AVG_REFUNDED_FRACTION);

    raw.gross[ci][di] = gross;
    raw.discount[ci][di] = discount;
    raw.refundCohort[ci][di] = refund;
    raw.cogsShipped[ci][di] = cogsShipped;
    raw.cogsReturnedCohort[ci][di] = cogsReturned;
    raw.returnedOrdersCohort[ci][di] = returnedOrders;

    // Dieselbe Erstattung, nach Erstattungsdatum verteilt: so sieht sie der
    // Standardreport. Tage jenseits von heute fallen aus dem Bild – genau
    // deshalb sieht die Marge direkt nach einem Sales Event zu gut aus.
    for (let lag = REFUND_DELAY.minDays; lag <= REFUND_DELAY.maxDays; lag++) {
      const target = di + lag;
      if (target >= D) break;
      const p = refundDelayPmf[lag];
      raw.refundReported[ci][target] += refund * p;
      raw.cogsReturnedReported[ci][target] += cogsReturned * p;
      raw.returnedOrdersReported[ci][target] += returnedOrders * p;
    }
  }
}

// ─── Kalibrierung auf das Umsatzniveau ──────────────────────────────────

let net2025 = 0;
for (let ci = 0; ci < C; ci++) {
  for (let di = 0; di < D; di++) {
    if (!allDays[di].startsWith("2025")) continue;
    net2025 += raw.gross[ci][di] - raw.discount[ci][di] - raw.refundCohort[ci][di];
  }
}
const scale = NET_REVENUE_2025_TARGET / net2025;

// ─── Marketing ──────────────────────────────────────────────────────────

/** TikTok-Anteil wächst über den Zeitraum, Meta gibt entsprechend ab. */
function marketingShares(iso: string): Record<MarketingChannel, number> {
  const progress = Math.min(1, Math.max(0, daysBetween(DATA_START, iso) / daysBetween(DATA_START, DATA_END)));
  const shares: Record<string, number> = {};
  for (const mc of MARKETING_CHANNELS) {
    let s = MARKETING_ASSUMPTIONS[mc].spendShare;
    if (mc === "TikTok") s *= 0.62 + 0.9 * progress;
    if (mc === "Meta") s *= 1.06 - 0.12 * progress;
    shares[mc] = s;
  }
  const sum = Object.values(shares).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(shares)) shares[k] /= sum;
  return shares as Record<MarketingChannel, number>;
}

/** Marken, die stärker investieren als ihr Umsatzanteil hergibt. */
const BRAND_SPEND_AGGRESSION: Record<Brand, number> = {
  SNOCKS: 0.9,
  OCEANSAPART: 1.05,
  femtis: 1.35,
  "Les Lunes": 1.3,
};

const mktMetricNames = [
  "spend",
  "attrGross",
  "attrDiscount",
  "attrRefund",
  "attrOrders",
  "attrCogsShipped",
  "attrCogsReturned",
  "attrReturnedOrders",
] as const;

const mktRows: number[][] = []; // [brandIdx, mktChannelIdx] → Werte je Tag
const mktKeys: Array<[number, number]> = [];
for (let bi = 0; bi < BRANDS.length; bi++) {
  for (let mi = 0; mi < MARKETING_CHANNELS.length; mi++) mktKeys.push([bi, mi]);
}
const mkt: Record<string, Float64Array[]> = {};
for (const name of mktMetricNames) {
  mkt[name] = mktKeys.map(() => new Float64Array(days.length));
}

for (let di = 0; di < days.length; di++) {
  const iso = days[di];
  const ai = di + emitFrom;
  const ev = eventByDay.get(iso);

  // Netto-Umsatz des Tages (Kohortensicht) je Marke – Basis für den Spend.
  const netByBrand = new Array(BRANDS.length).fill(0);
  for (let ci = 0; ci < C; ci++) {
    netByBrand[combos[ci].bi] +=
      (raw.gross[ci][ai] - raw.discount[ci][ai] - raw.refundCohort[ci][ai]) * scale;
  }
  const netTotal = netByBrand.reduce((a, b) => a + b, 0);

  const spendTotal =
    (netTotal / TARGET_MER) * (ev?.spendFactor ?? 1) * spendRamp(iso) * noise(0.06);

  // Verteilung auf Marken: Umsatzanteil × Investitionsbereitschaft.
  const brandWeights = BRANDS.map((b, bi) => netByBrand[bi] * BRAND_SPEND_AGGRESSION[b]);
  const brandWeightSum = brandWeights.reduce((a, b) => a + b, 0) || 1;

  const shares = marketingShares(iso);
  const discountRate = ev?.discountRate ?? BASE_DISCOUNT_RATE;

  for (let k = 0; k < mktKeys.length; k++) {
    const [bi, mi] = mktKeys[k];
    const brand = BRANDS[bi];
    const mc = MARKETING_CHANNELS[mi];
    const ma = MARKETING_ASSUMPTIONS[mc];
    const br = BRAND_ASSUMPTIONS[brand];

    const spend = spendTotal * (brandWeights[bi] / brandWeightSum) * shares[mc] * noise(0.05);
    if (spend <= 0) continue;

    // Plattformseitig gemeldeter, attribuierter Brutto-Umsatz. Die Summe
    // über alle Kanäle übersteigt den echten Shop-Umsatz – Attributions-
    // Überschneidung ist gewollt und wird im Dashboard erklärt.
    const attrGross = spend * ma.reportedRoas * noise(0.07);
    const attrDiscount = attrGross * Math.min(0.45, discountRate * ma.discountFactor);
    const attrNet = attrGross - attrDiscount;
    const returnRate = Math.min(0.65, ma.returnRate * (1 + (ev?.returnRateUplift ?? 0)) * noise(0.05));
    const attrRefund = attrNet * returnRate;
    const attrOrders = attrNet / br.aovShop;
    const attrCogsShipped = attrGross * br.cogsRate;
    const attrCogsReturned = attrNet > 0 ? attrCogsShipped * (attrRefund / attrNet) : 0;
    const attrReturnedOrders = attrOrders * (returnRate / AVG_REFUNDED_FRACTION);

    mkt.spend[k][di] = spend;
    mkt.attrGross[k][di] = attrGross;
    mkt.attrDiscount[k][di] = attrDiscount;
    mkt.attrRefund[k][di] = attrRefund;
    mkt.attrOrders[k][di] = attrOrders;
    mkt.attrCogsShipped[k][di] = attrCogsShipped;
    mkt.attrCogsReturned[k][di] = attrCogsReturned;
    mkt.attrReturnedOrders[k][di] = attrReturnedOrders;
  }
}

// ─── Hilfsfunktionen für die Ausgabe ────────────────────────────────────

const OUT = path.join(process.cwd(), "data");
mkdirSync(OUT, { recursive: true });

let totalBytes = 0;

function write(name: string, value: unknown) {
  const json = JSON.stringify(value);
  writeFileSync(path.join(OUT, name), json);
  totalBytes += json.length;
  console.log(`  ${name.padEnd(24)} ${(json.length / 1024).toFixed(0).padStart(5)} KB`);
}

/** Skalierte, ganzzahlige Tagesreihe einer Metrik für eine Kombination. */
function dayCol(src: Float64Array[], ci: number, factor: number, from: number, to: number): number[] {
  const out: number[] = [];
  for (let di = from; di <= to; di++) out.push(Math.round(src[ci][di + emitFrom] * factor));
  return out;
}

const CUBE_METRICS = [
  "orders",
  "newOrders",
  "gross",
  "discount",
  "refundCohort",
  "refundReported",
  "returnedOrdersCohort",
  "returnedOrdersReported",
  "cogsShipped",
  "cogsReturnedCohort",
  "cogsReturnedReported",
] as const;

/** Rohwert einer Metrik für Kombination/Tag, bereits skaliert. */
function val(metric: (typeof CUBE_METRICS)[number], ci: number, di: number): number {
  const ai = di + emitFrom;
  const combo = combos[ci];
  switch (metric) {
    case "orders":
      return ((raw.gross[ci][ai] - raw.discount[ci][ai]) * scale) / combo.aov;
    case "newOrders":
      return (
        (((raw.gross[ci][ai] - raw.discount[ci][ai]) * scale) / combo.aov) *
        BRAND_ASSUMPTIONS[combo.brand].newCustomerShare
      );
    case "returnedOrdersCohort":
      return raw.returnedOrdersCohort[ci][ai];
    case "returnedOrdersReported":
      return raw.returnedOrdersReported[ci][ai];
    default:
      return raw[metric][ci][ai] * scale;
  }
}

const comboTriples = combos.map((c) => [c.bi, c.ci, c.mi]);

// ─── 1. Vollständiger Tageswürfel (Referenzartefakt) ────────────────────
// Granularität Tag × Marke × Kanal × Markt, wie in der Aufgabenstellung.
// Das Dashboard liest diese Datei NICHT direkt – es nutzt die unten
// vorab aggregierten Varianten, damit die Seite schnell lädt.

write("cube-daily.json", {
  days,
  brands: BRANDS,
  channels: CHANNELS,
  markets: MARKETS,
  metrics: CUBE_METRICS,
  combos: comboTriples,
  data: combos.map((_, ci) =>
    CUBE_METRICS.map((m) => {
      const out = new Array(days.length);
      for (let di = 0; di < days.length; di++) out[di] = Math.round(val(m, ci, di));
      return out;
    }),
  ),
});

// ─── 2. Monatswürfel – die Basis aller Filter und Aggregate ─────────────

const months = Array.from(new Set(days.map(yearMonth)));
const monthOfDay = days.map((d) => months.indexOf(yearMonth(d)));

write("cube-month.json", {
  months,
  brands: BRANDS,
  channels: CHANNELS,
  markets: MARKETS,
  metrics: CUBE_METRICS,
  combos: comboTriples,
  data: combos.map((_, ci) =>
    CUBE_METRICS.map((m) => {
      const acc = new Float64Array(months.length);
      for (let di = 0; di < days.length; di++) acc[monthOfDay[di]] += val(m, ci, di);
      return Array.from(acc, (v) => Math.round(v));
    }),
  ),
});

// ─── 3. Tageswürfel der Sales-Event-Fenster ─────────────────────────────
// Für die Tagescharts rund um Black Week – nur die Fenster, in denen
// Tagesauflösung etwas aussagt, und nur die dafür nötigen Metriken.

const WINDOWS = [
  { id: "bw2025", label: "Black Week 2025 + Nachlauf", start: "2025-10-15", end: "2026-01-31" },
  { id: "now2026", label: "Vorlauf Black Week 2026", start: "2026-10-15", end: DATA_END },
];

const DAY_METRICS = [
  "orders",
  "gross",
  "discount",
  "refundCohort",
  "refundReported",
  "cogsShipped",
  "cogsReturnedCohort",
  "cogsReturnedReported",
] as const;

const windowDays: string[] = [];
for (const w of WINDOWS) {
  for (const d of dayRange(w.start, w.end)) if (days.includes(d)) windowDays.push(d);
}
const windowIdx = windowDays.map((d) => days.indexOf(d));

write("cube-window-daily.json", {
  windows: WINDOWS,
  days: windowDays,
  brands: BRANDS,
  channels: CHANNELS,
  markets: MARKETS,
  metrics: DAY_METRICS,
  combos: comboTriples,
  data: combos.map((_, ci) =>
    DAY_METRICS.map((m) => windowIdx.map((di) => Math.round(val(m, ci, di)))),
  ),
});

// ─── 4. Marketing ───────────────────────────────────────────────────────

const MKT_METRICS = mktMetricNames;

function mktVal(metric: string, k: number, di: number): number {
  return mkt[metric][k][di];
}

write("marketing-month.json", {
  months,
  brands: BRANDS,
  channels: MARKETING_CHANNELS,
  metrics: MKT_METRICS,
  combos: mktKeys,
  data: mktKeys.map((_, k) =>
    MKT_METRICS.map((m) => {
      const acc = new Float64Array(months.length);
      for (let di = 0; di < days.length; di++) acc[monthOfDay[di]] += mktVal(m, k, di);
      return Array.from(acc, (v) => Math.round(v));
    }),
  ),
});

write("marketing-window-daily.json", {
  days: windowDays,
  brands: BRANDS,
  channels: MARKETING_CHANNELS,
  metrics: MKT_METRICS,
  combos: mktKeys,
  data: mktKeys.map((_, k) => MKT_METRICS.map((m) => windowIdx.map((di) => Math.round(mktVal(m, k, di))))),
});

// ─── 5. Kohorten ────────────────────────────────────────────────────────
// Pro Kohorte die Summen je Kombination plus die kumulierte Verteilung der
// Erstattungen. Das Dashboard rechnet daraus mit derselben CM-Logik wie
// überall sonst die Margenentwicklung über 60 Tage nach der Bestellung.

const cumPmf: number[] = [];
{
  let acc = 0;
  for (let t = 0; t <= REFUND_WINDOW_DAYS; t++) {
    acc += refundDelayPmf[t] ?? 0;
    cumPmf.push(Number(acc.toFixed(6)));
  }
}

const COHORT_METRICS = [
  "orders",
  "newOrders",
  "gross",
  "discount",
  "refundTotal",
  "returnedOrdersTotal",
  "cogsShipped",
  "cogsReturnedTotal",
] as const;

const cohortData = COHORT_WINDOWS.map((cw) => {
  const idxs = dayRange(cw.start, cw.end)
    .map((d) => days.indexOf(d))
    .filter((i) => i >= 0);
  return combos.map((_, ci) => {
    const sums: Record<string, number> = {};
    for (const m of COHORT_METRICS) sums[m] = 0;
    for (const di of idxs) {
      sums.orders += val("orders", ci, di);
      sums.newOrders += val("newOrders", ci, di);
      sums.gross += val("gross", ci, di);
      sums.discount += val("discount", ci, di);
      sums.refundTotal += val("refundCohort", ci, di);
      sums.returnedOrdersTotal += val("returnedOrdersCohort", ci, di);
      sums.cogsShipped += val("cogsShipped", ci, di);
      sums.cogsReturnedTotal += val("cogsReturnedCohort", ci, di);
    }
    return COHORT_METRICS.map((m) => Math.round(sums[m]));
  });
});

/** Marketing-Spend der Kohorte je Marke – für CM3 der Kohorte. */
const cohortSpend = COHORT_WINDOWS.map((cw) => {
  const idxs = dayRange(cw.start, cw.end)
    .map((d) => days.indexOf(d))
    .filter((i) => i >= 0);
  return BRANDS.map((_, bi) => {
    let sum = 0;
    for (let k = 0; k < mktKeys.length; k++) {
      if (mktKeys[k][0] !== bi) continue;
      for (const di of idxs) sum += mkt.spend[k][di];
    }
    return Math.round(sum);
  });
});

write("cohorts.json", {
  cohorts: COHORT_WINDOWS,
  brands: BRANDS,
  channels: CHANNELS,
  markets: MARKETS,
  metrics: COHORT_METRICS,
  combos: comboTriples,
  /** data[cohortIdx][comboIdx][metricIdx] */
  data: cohortData,
  /** spend[cohortIdx][brandIdx] */
  spend: cohortSpend,
  /** Anteil der Erstattungen, der bis Tag t nach Bestellung eingegangen ist. */
  cumPmf,
});

// ─── 6. Stichprobe Einzelbestellungen ───────────────────────────────────

interface SampleOrder {
  id: string;
  orderDate: string;
  brand: Brand;
  channel: Channel;
  market: Market;
  customerType: "Neukunde" | "Bestandskunde";
  marketingChannel: MarketingChannel | "Organisch / Direkt";
  paymentMethod: string;
  items: number;
  gross: number;
  discount: number;
  refund: number;
  refundDate: string | null;
  refundType: "Vollerstattung" | "Teilerstattung" | null;
  cogsShipped: number;
  cogsReturned: number;
  /** Datenqualitäts-Flag: Landed Cost fehlt im Artikelstamm. */
  cogsMissing: boolean;
}

const SAMPLE_SIZE = 500;
const sampleOrders: SampleOrder[] = [];
const comboWeights = combos.map((c) => c.weight);

for (let i = 0; i < SAMPLE_SIZE; i++) {
  const combo = pickWeighted(combos, comboWeights);
  const br = BRAND_ASSUMPTIONS[combo.brand];
  // Bestelldatum: gewichtet nach Saisonalität, damit Black Week auch in
  // der Stichprobe sichtbar ist.
  const orderDate = pickWeighted(
    days,
    days.map((d) => {
      const ev = eventByDay.get(d);
      return MONTH_SEASONALITY[monthIndex(d)] * (1 + (ev?.volumeUplift ?? 0));
    }),
  );
  const ev = eventByDay.get(orderDate);
  const discountRate = ev?.discountRate ?? BASE_DISCOUNT_RATE;

  const items = 1 + Math.floor(rand() * (combo.channel === "Amazon" ? 2 : 4));
  const gross = round2(combo.aov * (0.55 + rand() * 1.1) * (items / 2 + 0.5));
  const discount = round2(gross * discountRate * (0.7 + rand() * 0.6));
  const net = gross - discount;

  const returnRate = combo.returnRate * (1 + (ev?.returnRateUplift ?? 0));
  const returned = rand() < returnRate / AVG_REFUNDED_FRACTION;

  let refund = 0;
  let refundDate: string | null = null;
  let refundType: SampleOrder["refundType"] = null;
  if (returned) {
    const partial = rand() < PARTIAL_REFUND_SHARE;
    const share = partial
      ? PARTIAL_REFUND_RANGE.min + rand() * (PARTIAL_REFUND_RANGE.max - PARTIAL_REFUND_RANGE.min)
      : 1;
    refund = round2(net * share);
    refundType = partial ? "Teilerstattung" : "Vollerstattung";
    const lag = pickWeighted(
      Array.from({ length: REFUND_WINDOW_DAYS + 1 }, (_, t) => t),
      refundDelayPmf,
    );
    const candidate = addDays(orderDate, lag);
    // Erstattungen nach heute sind noch nicht eingetroffen – die Bestellung
    // ist retourniert, aber im Report noch nicht sichtbar.
    refundDate = candidate <= DATA_END ? candidate : null;
    if (refundDate === null) refundType = null;
  }

  const cogsMissing = rand() < 0.008;
  const cogsShipped = cogsMissing ? 0 : round2(gross * br.cogsRate);
  const cogsReturned = net > 0 ? round2(cogsShipped * (refund / net)) : 0;

  sampleOrders.push({
    id: `#${String(1_000_000 + i * 37 + Math.floor(rand() * 29))}`,
    orderDate,
    brand: combo.brand,
    channel: combo.channel,
    market: combo.market,
    customerType: rand() < br.newCustomerShare ? "Neukunde" : "Bestandskunde",
    marketingChannel:
      combo.channel === "Onlineshop"
        ? rand() < 0.72
          ? pickWeighted(
              MARKETING_CHANNELS,
              MARKETING_CHANNELS.map((m) => MARKETING_ASSUMPTIONS[m].spendShare),
            )
          : "Organisch / Direkt"
        : "Organisch / Direkt",
    paymentMethod:
      combo.channel === "Onlineshop"
        ? pickWeighted(
            PAYMENT_MIX.map((p) => p.method),
            PAYMENT_MIX.map((p) => p.share),
          )
        : `${combo.channel} Abwicklung`,
    items,
    gross,
    discount,
    refund,
    refundDate,
    refundType,
    cogsShipped,
    cogsReturned,
    cogsMissing,
  });
}

sampleOrders.sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1));

write("orders-sample.json", { orders: sampleOrders });

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// ─── 7. Plan (Soll-Ist) ─────────────────────────────────────────────────

const planRows = months.map((ym, mi) => {
  const actual = BRANDS.map((_, bi) => {
    let gross = 0;
    let discount = 0;
    let refund = 0;
    let orders = 0;
    for (let ci = 0; ci < combos.length; ci++) {
      if (combos[ci].bi !== bi) continue;
      for (let di = 0; di < days.length; di++) {
        if (monthOfDay[di] !== mi) continue;
        gross += val("gross", ci, di);
        discount += val("discount", ci, di);
        refund += val("refundCohort", ci, di);
        orders += val("orders", ci, di);
      }
    }
    return { gross, discount, refund, orders };
  });

  return BRANDS.map((_, bi) => {
    const a = actual[bi];
    const net = a.gross - a.discount - a.refund;
    // Der Plan war optimistischer und hat die Retouren unterschätzt.
    const optimism = 1 + PLAN_OPTIMISM + randn() * 0.045;
    const planOrders = Math.round(a.orders * (1 + PLAN_OPTIMISM * 0.6 + randn() * 0.03));
    const planAov = round2((net / Math.max(1, a.orders)) * (1 + randn() * 0.02));
    const planReturnRate = Math.max(
      0.01,
      (a.refund / Math.max(1, a.gross)) * (0.9 + randn() * 0.04),
    );
    return {
      month: ym,
      brand: BRANDS[bi],
      planNetRevenue: Math.round(net * optimism),
      planOrders,
      planAov,
      planReturnRate: Number(planReturnRate.toFixed(4)),
    };
  });
});

write("plan.json", { rows: planRows.flat() });

// ─── 8. Datenqualität ───────────────────────────────────────────────────

/**
 * Erstattungen, deren Bestellung in einer bereits geschlossenen Periode
 * liegt, deren Erstattung aber erst danach gebucht wurde. Genau die Fälle,
 * die einen abgeschlossenen Monat nachträglich verändern würden.
 */
let lateRefundValue = 0;
let lateRefundCount = 0;
{
  const closeIdx = days.indexOf(CLOSED_THROUGH);
  for (let di = 0; di <= closeIdx; di++) {
    const arrivedByClose = cumPmf[Math.min(REFUND_WINDOW_DAYS, closeIdx - di)] ?? 1;
    const openShare = Math.max(0, 1 - arrivedByClose);
    if (openShare <= 0) continue;
    for (let ci = 0; ci < combos.length; ci++) {
      lateRefundValue += val("refundCohort", ci, di) * openShare;
      lateRefundCount += val("returnedOrdersCohort", ci, di) * openShare;
    }
  }
}

/** Bestellungen ohne hinterlegte Landed Cost – Anteil aus der Stichprobe. */
const missingCogsShare = sampleOrders.filter((o) => o.cogsMissing).length / SAMPLE_SIZE;
let totalOrders = 0;
let totalGross = 0;
for (let ci = 0; ci < combos.length; ci++) {
  for (let di = 0; di < days.length; di++) {
    totalOrders += val("orders", ci, di);
    totalGross += val("gross", ci, di);
  }
}

/**
 * Abweichung zwischen eigenen Bestelldaten und der Abrechnung des
 * Marktplatzes – in der Praxis Gebührenkorrekturen, Kulanzgutschriften
 * und Währungsrundungen.
 */
const marketplaceDrift = months.map((ym) => {
  const row: Record<string, number> = { };
  for (const ch of ["Amazon", "Zalando"] as Channel[]) {
    let own = 0;
    for (let ci = 0; ci < combos.length; ci++) {
      if (combos[ci].channel !== ch) continue;
      for (let di = 0; di < days.length; di++) {
        if (days[di].slice(0, 7) !== ym) continue;
        own += val("gross", ci, di) - val("discount", ci, di) - val("refundReported", ci, di);
      }
    }
    const drift = own * (0.004 + rand() * 0.012) * (rand() < 0.35 ? -1 : 1);
    row[`${ch}_own`] = Math.round(own);
    row[`${ch}_settlement`] = Math.round(own + drift);
  }
  return { month: ym, ...row };
});

write("data-quality.json", {
  closedThrough: CLOSED_THROUGH,
  lateRefunds: {
    value: Math.round(lateRefundValue),
    count: Math.round(lateRefundCount),
  },
  missingCogs: {
    share: Number(missingCogsShare.toFixed(4)),
    orders: Math.round(totalOrders * missingCogsShare),
    grossValue: Math.round(totalGross * missingCogsShare),
  },
  partialRefundsWithoutReturn: {
    share: Number((PARTIAL_REFUND_SHARE * 0.31).toFixed(4)),
    note: "Teilerstattungen, bei denen keine Ware zurückkam (Preisnachlass, Kulanz).",
  },
  marketplaceDrift,
});

// ─── 9. Metadaten ───────────────────────────────────────────────────────

let net2026 = 0;
let netAll = 0;
for (let ci = 0; ci < combos.length; ci++) {
  for (let di = 0; di < days.length; di++) {
    const n = val("gross", ci, di) - val("discount", ci, di) - val("refundCohort", ci, di);
    netAll += n;
    if (days[di].startsWith("2026")) net2026 += n;
  }
}

write("meta.json", {
  seed: RANDOM_SEED,
  today: DATA_END,
  start: DATA_START,
  days: days.length,
  months: months.length,
  combos: combos.length,
  sampleOrders: SAMPLE_SIZE,
  netRevenue2025: Math.round(NET_REVENUE_2025_TARGET),
  netRevenue2026Ytd: Math.round(net2026),
  netRevenueTotal: Math.round(netAll),
  refundWindowDays: REFUND_WINDOW_DAYS,
  unitCosts: UNIT_COSTS,
  paymentFeeBlended: Number(
    PAYMENT_MIX.reduce((a, p) => a + p.share * p.feeRate, 0).toFixed(4),
  ),
  shippingBlended: Number(
    MARKETS.reduce(
      (a, m) => a + MARKET_ASSUMPTIONS[m].revenueShare * MARKET_ASSUMPTIONS[m].shippingCost,
      0,
    ).toFixed(2),
  ),
});

console.log(`\n  Summe: ${(totalBytes / 1024).toFixed(0)} KB`);
console.log(`  Netto-Umsatz 2025: ${(NET_REVENUE_2025_TARGET / 1e6).toFixed(1)} Mio €`);
console.log(`  Netto-Umsatz 2026 YTD: ${(net2026 / 1e6).toFixed(1)} Mio €`);
