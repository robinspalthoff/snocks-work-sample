/**
 * Die KPI-Logik der Arbeitsprobe – eine einzige Quelle für alle Seiten.
 *
 * Kern der Sache ist der Parameter `view`:
 *   "reported" ordnet Erstattungen dem ERSTATTUNGSDATUM zu – so bucht der
 *             Standardreport im Shop-Backend.
 *   "cohort"  ordnet sie der URSPRÜNGLICHEN BESTELLUNG zu – periodengerecht.
 *
 * Alles andere (Brutto-Umsatz, Rabatte, Bestellungen, Marketing) ist in
 * beiden Sichten identisch. Genau deshalb ist die Differenz zwischen den
 * beiden Linien ausschließlich ein Timing-Effekt der Retouren.
 */
import {
  BRAND_ASSUMPTIONS,
  BRANDS,
  CHANNEL_ASSUMPTIONS,
  CHANNELS,
  MARKET_ASSUMPTIONS,
  MARKETING_CHANNELS,
  MARKETS,
  UNIT_COSTS,
  type Brand,
  type Channel,
  type Market,
  type MarketingChannel,
} from "@/config/assumptions";

export type View = "reported" | "cohort";

export const CUBE_METRICS = [
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
export type CubeMetric = (typeof CUBE_METRICS)[number];

// ─── Rohformat der generierten Dateien ──────────────────────────────────

export interface RawCube {
  months?: string[];
  days?: string[];
  brands: readonly string[];
  channels: readonly string[];
  markets: readonly string[];
  metrics: readonly string[];
  combos: number[][];
  data: number[][][];
}

export interface ComboDim {
  brand: Brand;
  channel: Channel;
  market: Market;
}

export interface Cube {
  /** Monats- ("2026-11") oder Tagesschlüssel ("2026-11-22"). */
  periods: string[];
  combos: ComboDim[];
  metricIdx: Partial<Record<CubeMetric, number>>;
  data: number[][][];
}

export function decodeCube(raw: RawCube): Cube {
  const metricIdx: Partial<Record<CubeMetric, number>> = {};
  raw.metrics.forEach((m, i) => {
    metricIdx[m as CubeMetric] = i;
  });
  return {
    periods: (raw.months ?? raw.days ?? []) as string[],
    combos: raw.combos.map(([b, c, m]) => ({
      brand: raw.brands[b] as Brand,
      channel: raw.channels[c] as Channel,
      market: raw.markets[m] as Market,
    })),
    metricIdx,
    data: raw.data,
  };
}

// ─── Filter ─────────────────────────────────────────────────────────────

export interface Filters {
  /** Inklusive Monatsgrenzen, Format "2025-01". */
  from: string;
  to: string;
  brands: Brand[];
  channels: Channel[];
  markets: Market[];
}

export const ALL_FILTERS: Omit<Filters, "from" | "to"> = {
  brands: [...BRANDS],
  channels: [...CHANNELS],
  markets: [...MARKETS],
};

export function matchesCombo(combo: ComboDim, f: Filters): boolean {
  return (
    f.brands.includes(combo.brand) &&
    f.channels.includes(combo.channel) &&
    f.markets.includes(combo.market)
  );
}

/** Indizes der Perioden, die im Filterzeitraum liegen. */
export function periodIndices(cube: Cube, f: Filters): number[] {
  const out: number[] = [];
  for (let i = 0; i < cube.periods.length; i++) {
    const ym = cube.periods[i].slice(0, 7);
    if (ym >= f.from && ym <= f.to) out.push(i);
  }
  return out;
}

export function comboIndices(cube: Cube, f: Filters): number[] {
  const out: number[] = [];
  for (let i = 0; i < cube.combos.length; i++) {
    if (matchesCombo(cube.combos[i], f)) out.push(i);
  }
  return out;
}

// ─── Aggregation ────────────────────────────────────────────────────────

export type MetricSums = Record<CubeMetric, number>;

function emptySums(): MetricSums {
  return {
    orders: 0,
    newOrders: 0,
    gross: 0,
    discount: 0,
    refundCohort: 0,
    refundReported: 0,
    returnedOrdersCohort: 0,
    returnedOrdersReported: 0,
    cogsShipped: 0,
    cogsReturnedCohort: 0,
    cogsReturnedReported: 0,
  };
}

export interface ComboSums {
  combo: ComboDim;
  sums: MetricSums;
}

/** Summen je Kombination über die gewählten Perioden. */
export function aggregate(cube: Cube, f: Filters, periods?: number[]): ComboSums[] {
  const pIdx = periods ?? periodIndices(cube, f);
  const cIdx = comboIndices(cube, f);
  return cIdx.map((ci) => {
    const sums = emptySums();
    for (const metric of CUBE_METRICS) {
      const mi = cube.metricIdx[metric];
      if (mi === undefined) continue;
      const row = cube.data[ci][mi];
      let acc = 0;
      for (const pi of pIdx) acc += row[pi] ?? 0;
      sums[metric] = acc;
    }
    return { combo: cube.combos[ci], sums };
  });
}

// ─── Deckungsbeitragsrechnung ───────────────────────────────────────────

export interface Cm {
  orders: number;
  newOrders: number;
  gross: number;
  discount: number;
  refunds: number;
  netRevenue: number;
  cogs: number;
  cm1: number;
  fulfillment: number;
  shipping: number;
  returnHandling: number;
  paymentFees: number;
  marketplaceFees: number;
  variableCosts: number;
  cm2: number;
  marketing: number;
  cm3: number;
  /** Abgeleitete Kennzahlen. */
  cm1Margin: number;
  cm2Margin: number;
  cm3Margin: number;
  returnRate: number;
  aov: number;
  mer: number;
}

const ZERO_CM: Cm = {
  orders: 0, newOrders: 0, gross: 0, discount: 0, refunds: 0, netRevenue: 0,
  cogs: 0, cm1: 0, fulfillment: 0, shipping: 0, returnHandling: 0,
  paymentFees: 0, marketplaceFees: 0, variableCosts: 0, cm2: 0,
  marketing: 0, cm3: 0, cm1Margin: 0, cm2Margin: 0, cm3Margin: 0,
  returnRate: 0, aov: 0, mer: 0,
};

/**
 * Baut die Deckungsbeitragsrechnung aus den Kombinations-Summen auf.
 * Die Kostensätze hängen von Kanal (Payment, Marktplatzprovision) und
 * Markt (Versand) ab – deshalb wird je Kombination gerechnet und erst
 * danach summiert.
 */
export function computeCm(rows: ComboSums[], view: View, marketing = 0): Cm {
  const t = { ...ZERO_CM, marketing };

  for (const { combo, sums } of rows) {
    const ch = CHANNEL_ASSUMPTIONS[combo.channel];
    const mk = MARKET_ASSUMPTIONS[combo.market];

    const refunds = view === "cohort" ? sums.refundCohort : sums.refundReported;
    const cogsReturned =
      view === "cohort" ? sums.cogsReturnedCohort : sums.cogsReturnedReported;
    const returnedOrders =
      view === "cohort" ? sums.returnedOrdersCohort : sums.returnedOrdersReported;

    const netRevenue = sums.gross - sums.discount - refunds;
    // Landed Cost der behaltenen Ware. Ein Teil der Rückläufer ist nicht
    // mehr verkäuflich und bleibt als Abschreibung im Wareneinsatz.
    const cogs = sums.cogsShipped - cogsReturned * (1 - UNIT_COSTS.returnWriteOffShare);

    const fulfillment = sums.orders * UNIT_COSTS.fulfillmentPerOrder;
    const shipping = sums.orders * mk.shippingCost;
    const returnHandling = returnedOrders * UNIT_COSTS.returnHandlingPerReturn;
    const paymentFees = netRevenue * ch.paymentFeeRate;
    const marketplaceFees = netRevenue * ch.marketplaceFeeRate;

    t.orders += sums.orders;
    t.newOrders += sums.newOrders;
    t.gross += sums.gross;
    t.discount += sums.discount;
    t.refunds += refunds;
    t.netRevenue += netRevenue;
    t.cogs += cogs;
    t.fulfillment += fulfillment;
    t.shipping += shipping;
    t.returnHandling += returnHandling;
    t.paymentFees += paymentFees;
    t.marketplaceFees += marketplaceFees;
  }

  t.cm1 = t.netRevenue - t.cogs;
  t.variableCosts =
    t.fulfillment + t.shipping + t.returnHandling + t.paymentFees + t.marketplaceFees;
  t.cm2 = t.cm1 - t.variableCosts;
  t.cm3 = t.cm2 - t.marketing;

  t.cm1Margin = safeDiv(t.cm1, t.netRevenue);
  t.cm2Margin = safeDiv(t.cm2, t.netRevenue);
  t.cm3Margin = safeDiv(t.cm3, t.netRevenue);
  t.returnRate = safeDiv(t.refunds, t.gross);
  t.aov = safeDiv(t.netRevenue, t.orders);
  t.mer = safeDiv(t.netRevenue, t.marketing);

  return t;
}

export function safeDiv(a: number, b: number): number {
  return b === 0 || !Number.isFinite(b) ? 0 : a / b;
}

// ─── Marketing ──────────────────────────────────────────────────────────

export const MKT_METRICS = [
  "spend",
  "attrGross",
  "attrDiscount",
  "attrRefund",
  "attrOrders",
  "attrCogsShipped",
  "attrCogsReturned",
  "attrReturnedOrders",
] as const;
export type MktMetric = (typeof MKT_METRICS)[number];

export interface RawMarketingCube {
  months?: string[];
  days?: string[];
  brands: readonly string[];
  channels: readonly string[];
  metrics: readonly string[];
  combos: number[][];
  data: number[][][];
}

export interface MarketingCube {
  periods: string[];
  combos: { brand: Brand; marketingChannel: MarketingChannel }[];
  metricIdx: Record<MktMetric, number>;
  data: number[][][];
}

export function decodeMarketing(raw: RawMarketingCube): MarketingCube {
  const metricIdx = {} as Record<MktMetric, number>;
  raw.metrics.forEach((m, i) => {
    metricIdx[m as MktMetric] = i;
  });
  return {
    periods: (raw.months ?? raw.days ?? []) as string[],
    combos: raw.combos.map(([b, c]) => ({
      brand: raw.brands[b] as Brand,
      marketingChannel: raw.channels[c] as MarketingChannel,
    })),
    metricIdx,
    data: raw.data,
  };
}

export type MktSums = Record<MktMetric, number>;

function emptyMkt(): MktSums {
  return {
    spend: 0, attrGross: 0, attrDiscount: 0, attrRefund: 0,
    attrOrders: 0, attrCogsShipped: 0, attrCogsReturned: 0, attrReturnedOrders: 0,
  };
}

/**
 * Marketing-Summen je (Marke, Marketing-Kanal) im Filterzeitraum.
 *
 * Wichtig und bewusst offengelegt: Ad-Spend liegt je Marke und Tag vor,
 * aber nicht je Markt oder Verkaufskanal. Bei aktivem Markt- oder
 * Kanalfilter wird der Spend der Marke anteilig nach ihrem Netto-Umsatz in
 * der Auswahl allokiert (`allocation`). Das ist eine Allokation, keine
 * Messung – im Glossar steht es genauso.
 */
export function aggregateMarketing(
  cube: MarketingCube,
  f: Filters,
  allocationByBrand: Partial<Record<Brand, number>> = {},
): { brand: Brand; marketingChannel: MarketingChannel; sums: MktSums }[] {
  const pIdx: number[] = [];
  for (let i = 0; i < cube.periods.length; i++) {
    const ym = cube.periods[i].slice(0, 7);
    if (ym >= f.from && ym <= f.to) pIdx.push(i);
  }

  const out: { brand: Brand; marketingChannel: MarketingChannel; sums: MktSums }[] = [];
  for (let ci = 0; ci < cube.combos.length; ci++) {
    const { brand, marketingChannel } = cube.combos[ci];
    if (!f.brands.includes(brand)) continue;
    const share = allocationByBrand[brand] ?? 1;
    if (share <= 0) continue;
    const sums = emptyMkt();
    for (const metric of MKT_METRICS) {
      const row = cube.data[ci][cube.metricIdx[metric]];
      let acc = 0;
      for (const pi of pIdx) acc += row[pi] ?? 0;
      sums[metric] = acc * share;
    }
    out.push({ brand, marketingChannel, sums });
  }
  return out;
}

export function totalSpend(rows: { sums: MktSums }[]): number {
  return rows.reduce((a, r) => a + r.sums.spend, 0);
}

/**
 * Anteil des Marken-Umsatzes, der in der aktuellen Kanal-/Marktauswahl
 * liegt. Dient als Allokationsschlüssel für den Marketing-Spend.
 */
export function brandAllocation(cube: Cube, f: Filters): Partial<Record<Brand, number>> {
  const grossIdx = cube.metricIdx.gross;
  const discountIdx = cube.metricIdx.discount;
  const refundIdx = cube.metricIdx.refundCohort;
  if (grossIdx === undefined || discountIdx === undefined || refundIdx === undefined) return {};

  const pIdx = periodIndices(cube, f);
  const selected: Partial<Record<Brand, number>> = {};
  const total: Partial<Record<Brand, number>> = {};

  for (let ci = 0; ci < cube.combos.length; ci++) {
    const combo = cube.combos[ci];
    let net = 0;
    for (const pi of pIdx) {
      net +=
        (cube.data[ci][grossIdx][pi] ?? 0) -
        (cube.data[ci][discountIdx][pi] ?? 0) -
        (cube.data[ci][refundIdx][pi] ?? 0);
    }
    total[combo.brand] = (total[combo.brand] ?? 0) + net;
    if (matchesCombo(combo, f)) {
      selected[combo.brand] = (selected[combo.brand] ?? 0) + net;
    }
  }

  const out: Partial<Record<Brand, number>> = {};
  for (const b of BRANDS) {
    out[b] = safeDiv(selected[b] ?? 0, total[b] ?? 0);
  }
  return out;
}

// ─── ROAS / POAS ────────────────────────────────────────────────────────

export interface ChannelEfficiency {
  marketingChannel: MarketingChannel;
  spend: number;
  attributedRevenue: number;
  roas: number;
  cm2: number;
  poas: number;
  returnRate: number;
  orders: number;
  cac: number;
}

/**
 * ROAS und POAS je Marketing-Kanal. POAS rechnet den CM2 der attribuierten
 * Bestellungen gegen den Spend – also nach Retouren, Wareneinsatz,
 * Logistik und Zahlungsgebühren.
 */
export function channelEfficiency(
  rows: { brand: Brand; marketingChannel: MarketingChannel; sums: MktSums }[],
  blendedShippingCost: number,
): ChannelEfficiency[] {
  const byChannel = new Map<MarketingChannel, ChannelEfficiency>();

  for (const row of rows) {
    const s = row.sums;
    const net = s.attrGross - s.attrDiscount - s.attrRefund;
    const cogs = s.attrCogsShipped - s.attrCogsReturned * (1 - UNIT_COSTS.returnWriteOffShare);
    const variable =
      s.attrOrders * (UNIT_COSTS.fulfillmentPerOrder + blendedShippingCost) +
      s.attrReturnedOrders * UNIT_COSTS.returnHandlingPerReturn +
      net * CHANNEL_ASSUMPTIONS.Onlineshop.paymentFeeRate;
    const cm2 = net - cogs - variable;

    const cur =
      byChannel.get(row.marketingChannel) ??
      {
        marketingChannel: row.marketingChannel,
        spend: 0,
        attributedRevenue: 0,
        roas: 0,
        cm2: 0,
        poas: 0,
        returnRate: 0,
        orders: 0,
        cac: 0,
      };

    cur.spend += s.spend;
    cur.attributedRevenue += net;
    cur.cm2 += cm2;
    cur.orders += s.attrOrders;
    // Retourenquote wertbasiert auf den attribuierten Brutto-Umsatz.
    cur.returnRate += s.attrRefund;
    byChannel.set(row.marketingChannel, cur);
  }

  // Zweiter Durchlauf für die Quoten (Brutto-Basis je Kanal).
  const grossByChannel = new Map<MarketingChannel, number>();
  for (const row of rows) {
    grossByChannel.set(
      row.marketingChannel,
      (grossByChannel.get(row.marketingChannel) ?? 0) + row.sums.attrGross,
    );
  }

  return MARKETING_CHANNELS.filter((c) => byChannel.has(c)).map((c) => {
    const e = byChannel.get(c)!;
    return {
      ...e,
      roas: safeDiv(e.attributedRevenue, e.spend),
      poas: safeDiv(e.cm2, e.spend),
      returnRate: safeDiv(e.returnRate, grossByChannel.get(c) ?? 0),
      cac: safeDiv(e.spend, e.orders),
    };
  });
}

// ─── Hilfen für Dimensions-Tabellen ─────────────────────────────────────

export function groupBy<K extends keyof ComboDim>(
  rows: ComboSums[],
  key: K,
): Map<ComboDim[K], ComboSums[]> {
  const map = new Map<ComboDim[K], ComboSums[]>();
  for (const row of rows) {
    const k = row.combo[key];
    const list = map.get(k) ?? [];
    list.push(row);
    map.set(k, list);
  }
  return map;
}

export const BRAND_COLORS: Record<Brand, string> = {
  SNOCKS: "var(--color-brand-snocks)",
  OCEANSAPART: "var(--color-brand-oceansapart)",
  femtis: "var(--color-brand-femtis)",
  "Les Lunes": "var(--color-brand-leslunes)",
};

export function brandCategory(brand: Brand): string {
  return BRAND_ASSUMPTIONS[brand].category;
}

export const BLENDED_SHIPPING = MARKETS.reduce(
  (a, m) => a + MARKET_ASSUMPTIONS[m].revenueShare * MARKET_ASSUMPTIONS[m].shippingCost,
  0,
);
