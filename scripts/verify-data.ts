/**
 * Prüft den generierten Datensatz – zweistufig.
 *
 *   npm run verify
 *
 * 1. INTERNE KONSISTENZ: Rechnet sich das Modell in sich auf? Summieren
 *    die Aggregate zum Tageswürfel, schließt der Deckungsbeitrags-
 *    wasserfall, laufen beide Retouren-Sichten zusammen?
 * 2. PLAUSIBILITÄT: Liegen die Kennzahlen in Bereichen, die für einen
 *    D2C-Händler dieser Größe realistisch sind? Die Spannen stammen aus
 *    Branchenerfahrung und sind absichtlich weit – sie sollen grobe
 *    Modellfehler fangen, nicht Punktlandungen erzwingen.
 *
 * Der Lauf endet mit Exit-Code 1, sobald eine Prüfung fehlschlägt.
 */
import {
  BRANDS,
  BRAND_ASSUMPTIONS,
  CHANNELS,
  CHANNEL_ASSUMPTIONS,
  MARKETS,
  UNIT_COSTS,
} from "../src/config/assumptions";
import {
  BLENDED_SHIPPING,
  aggregate,
  aggregateMarketing,
  brandAllocation,
  channelEfficiency,
  computeCm,
  decodeCube,
  decodeMarketing,
  totalSpend,
  type Cube,
  type Filters,
  type RawCube,
  type RawMarketingCube,
} from "../src/lib/kpi";

import cubeDayRaw from "../data/cube-daily.json";
import cubeMonthRaw from "../data/cube-month.json";
import marketingMonthRaw from "../data/marketing-month.json";
import cohortsRaw from "../data/cohorts.json";

const cubeDay = decodeCube(cubeDayRaw as unknown as RawCube);
const cubeMonth = decodeCube(cubeMonthRaw as unknown as RawCube);
const marketing = decodeMarketing(marketingMonthRaw as unknown as RawMarketingCube);

const ALL: Filters = {
  from: cubeMonth.periods[0],
  to: cubeMonth.periods[cubeMonth.periods.length - 1],
  brands: [...BRANDS],
  channels: [...CHANNELS],
  markets: [...MARKETS],
};

// ─── Prüfgerüst ─────────────────────────────────────────────────────────

let failures = 0;
let checks = 0;

function section(title: string) {
  console.log(`\n${title}`);
  console.log("─".repeat(title.length));
}

function ok(label: string, detail: string) {
  checks++;
  console.log(`  ✓ ${label.padEnd(46)} ${detail}`);
}

function fail(label: string, detail: string) {
  checks++;
  failures++;
  console.log(`  ✗ ${label.padEnd(46)} ${detail}`);
}

/** Zwei Werte müssen bis auf eine Toleranz übereinstimmen. */
function equal(label: string, a: number, b: number, tolerance: number, unit = "€") {
  const diff = Math.abs(a - b);
  const detail = `${fmt(a)} vs ${fmt(b)} ${unit}, Δ ${fmt(diff)}`;
  if (diff <= tolerance) ok(label, detail);
  else fail(label, `${detail} (zulässig ${fmt(tolerance)})`);
}

/** Ein Wert muss in einer Spanne liegen. */
function within(label: string, value: number, min: number, max: number, unit = "") {
  const detail = `${fmt(value)}${unit} (erwartet ${fmt(min)}–${fmt(max)}${unit})`;
  if (value >= min && value <= max) ok(label, detail);
  else fail(label, detail);
}

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} Mio`;
  if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString("de-DE");
  return v.toFixed(Math.abs(v) < 10 ? 2 : 1);
}

function pct(v: number): number {
  return v * 100;
}

// ─── Hilfen ─────────────────────────────────────────────────────────────

function cmFor(f: Partial<Filters> = {}) {
  const filters = { ...ALL, ...f };
  const rows = aggregate(cubeMonth, filters);
  const alloc = brandAllocation(cubeMonth, filters);
  const spend = totalSpend(aggregateMarketing(marketing, filters, alloc));
  return {
    real: computeCm(rows, "cohort", spend),
    reported: computeCm(rows, "reported", spend),
    spend,
  };
}

function cubeSum(cube: Cube, metric: Parameters<typeof aggregate>[0] extends never ? never : string) {
  const mi = cube.metricIdx[metric as keyof typeof cube.metricIdx];
  if (mi === undefined) return 0;
  let sum = 0;
  for (let ci = 0; ci < cube.combos.length; ci++) {
    for (const v of cube.data[ci][mi]) sum += v;
  }
  return sum;
}

// ─── 1. Interne Konsistenz ──────────────────────────────────────────────

section("1. Interne Konsistenz");

for (const metric of ["gross", "discount", "refundCohort", "refundReported", "orders"]) {
  const day = cubeSum(cubeDay, metric);
  const month = cubeSum(cubeMonth, metric);
  // Rundung auf ganze Euro je Tag bzw. je Monat ergibt kleine Differenzen.
  equal(`Monatswürfel = Tageswürfel (${metric})`, month, day, Math.max(2000, day * 0.0005));
}

const total = cmFor();

equal(
  "Netto-Umsatz = Brutto − Rabatte − Erstattungen",
  total.real.netRevenue,
  total.real.gross - total.real.discount - total.real.refunds,
  1,
);

equal(
  "CM3 = Netto − COGS − var. Kosten − Marketing",
  total.real.cm3,
  total.real.netRevenue -
    total.real.cogs -
    total.real.variableCosts -
    total.real.marketing,
  1,
);

equal(
  "Var. Kosten = Summe der fünf Kostenblöcke",
  total.real.variableCosts,
  total.real.fulfillment +
    total.real.shipping +
    total.real.returnHandling +
    total.real.paymentFees +
    total.real.marketplaceFees,
  1,
);

// Beide Sichten müssen über den Gesamtzeitraum zusammenlaufen. Übrig
// bleibt nur der Rand: Erstattungen zu Bestellungen vor dem Startdatum
// und noch offene Retouren am aktuellen Ende.
const convergence = Math.abs(total.reported.cm3 - total.real.cm3) / Math.abs(total.real.cm3);
within("Konvergenz beider Sichten (Gesamtzeitraum)", pct(convergence), 0, 3, " %");

// Dimensionsschnitte müssen sich zum Gesamtwert addieren.
for (const [label, key, values] of [
  ["Marken", "brands", BRANDS],
  ["Kanäle", "channels", CHANNELS],
  ["Märkte", "markets", MARKETS],
] as const) {
  const sum = values.reduce(
    (acc, v) => acc + cmFor({ [key]: [v] } as Partial<Filters>).real.netRevenue,
    0,
  );
  equal(`Summe der ${label} = Gesamt-Netto-Umsatz`, sum, total.real.netRevenue, 2);
}

// Die Kohorte muss dieselben Bestellungen enthalten wie der Würfel im
// gleichen Zeitfenster.
{
  const raw = cohortsRaw as unknown as {
    cohorts: { id: string; start: string; end: string }[];
    metrics: string[];
    data: number[][][];
  };
  const idx = raw.cohorts.findIndex((c) => c.id === "blackweek-2025");
  const grossIdx = raw.metrics.indexOf("gross");
  const cohortGross = raw.data[idx].reduce((a, row) => a + row[grossIdx], 0);

  const di = cubeDay.metricIdx.gross!;
  let windowGross = 0;
  cubeDay.periods.forEach((day, i) => {
    if (day >= raw.cohorts[idx].start && day <= raw.cohorts[idx].end) {
      for (let ci = 0; ci < cubeDay.combos.length; ci++) windowGross += cubeDay.data[ci][di][i];
    }
  });
  equal("Kohorte Black Week = Würfel im Zeitfenster", cohortGross, windowGross, 5000);
}

// ─── 2. Plausibilität gegen Branchenwerte ───────────────────────────────

section("2. Größenordnung des Geschäfts");

const y2025 = cmFor({ from: "2025-01", to: "2025-12" });
within("Netto-Umsatz 2025", y2025.real.netRevenue / 1e6, 80, 120, " Mio €");
within("Bestellungen 2025", y2025.real.orders / 1e6, 1.5, 3.5, " Mio");
within("AOV gesamt", total.real.aov, 25, 60, " €");

section("3. Deckungsbeitragsstruktur");

within("CM1-Marge (nach Wareneinsatz)", pct(total.real.cm1Margin), 55, 75, " %");
within("CM2-Marge (nach variablen Kosten)", pct(total.real.cm2Margin), 28, 50, " %");
within("CM3-Marge (nach Marketing)", pct(total.real.cm3Margin), 8, 25, " %");
within(
  "Variable Kosten in % vom Netto-Umsatz",
  pct(total.real.variableCosts / total.real.netRevenue),
  15, 35, " %",
);
within(
  "Logistik je Bestellung in % vom AOV",
  pct((total.real.fulfillment + total.real.shipping) / total.real.orders / total.real.aov),
  10, 28, " %",
);

section("4. Retouren");

within("Retourenquote gesamt", pct(total.real.returnRate), 8, 25, " %");
for (const brand of BRANDS) {
  const r = cmFor({ brands: [brand] }).real.returnRate;
  const base = BRAND_ASSUMPTIONS[brand].returnRate;
  // Kanal- und Marktaufschläge sowie Sales Events heben die Quote an.
  within(`Retourenquote ${brand}`, pct(r), pct(base) * 0.9, pct(base) * 1.9, " %");
}
within(
  "Retourenquote Zalando (Fashion-Plattform)",
  pct(cmFor({ channels: ["Zalando"] }).real.returnRate),
  18, 45, " %",
);

section("5. Marketing");

const alloc = brandAllocation(cubeMonth, ALL);
const mktRows = aggregateMarketing(marketing, ALL, alloc);
const eff = channelEfficiency(mktRows, BLENDED_SHIPPING);

within("Marketing in % vom Netto-Umsatz", pct(total.spend / total.real.netRevenue), 10, 28, " %");
within("MER gesamt", total.real.mer, 3.5, 9);
within(
  "POAS gesamt",
  eff.reduce((a, e) => a + e.cm2, 0) / eff.reduce((a, e) => a + e.spend, 0),
  0.6, 3,
);
for (const e of eff) {
  within(`ROAS ${e.marketingChannel}`, e.roas, 1.2, 9);
  within(`POAS ${e.marketingChannel}`, e.poas, 0.2, 4);
}

section("6. Kanäle und Kostensätze");

for (const channel of CHANNELS) {
  const cm = cmFor({ channels: [channel] }).real;
  const share = cm.netRevenue / total.real.netRevenue;
  within(`Umsatzanteil ${channel}`, pct(share), 8, 75, " %");
  within(`AOV ${channel}`, cm.aov, 18, 75, " €");
}
within(
  "Marktplatzprovision Amazon",
  pct(CHANNEL_ASSUMPTIONS.Amazon.marketplaceFeeRate),
  8, 20, " %",
);
within(
  "Marktplatzprovision Zalando",
  pct(CHANNEL_ASSUMPTIONS.Zalando.marketplaceFeeRate),
  15, 32, " %",
);
within("Fulfillment je Bestellung", UNIT_COSTS.fulfillmentPerOrder, 1.2, 4, " €");
within("Retourenbearbeitung je Retoure", UNIT_COSTS.returnHandlingPerReturn, 2.5, 9, " €");

section("7. Kunden und Saisonalität");

within(
  "Neukundenanteil an allen Bestellungen",
  pct(total.real.newOrders / total.real.orders),
  25, 60, " %",
);

const bwMonth = cmFor({ from: "2025-11", to: "2025-11" });
within(
  "Anteil November 2025 am Jahresumsatz",
  pct(bwMonth.real.netRevenue / y2025.real.netRevenue),
  9, 22, " %",
);

section("8. Die Kernaussage selbst");

const delta = bwMonth.reported.cm3 - bwMonth.real.cm3;
const deltaPp = pct(bwMonth.reported.cm3Margin - bwMonth.real.cm3Margin);
if (delta > 0) ok("Report zeigt den Aktionsmonat zu gut", `+${fmt(delta)} € CM3, +${deltaPp.toFixed(1)} pp`);
else fail("Report zeigt den Aktionsmonat zu gut", `${fmt(delta)} € – Richtung stimmt nicht`);

const dec = cmFor({ from: "2025-12", to: "2025-12" });
const decDelta = dec.reported.cm3 - dec.real.cm3;
if (decDelta < 0)
  ok("Folgemonat trägt die Korrektur", `${fmt(decDelta)} € CM3 im Dezember`);
else fail("Folgemonat trägt die Korrektur", `${fmt(decDelta)} € – erwartet wäre negativ`);

within("Verzerrung im Aktionsmonat", Math.abs(deltaPp), 1, 12, " pp");

// ─── Ergebnis ───────────────────────────────────────────────────────────

console.log(
  `\n${failures === 0 ? "Alle" : `${checks - failures} von ${checks}`} Prüfungen bestanden` +
    (failures ? ` – ${failures} fehlgeschlagen.` : "."),
);
process.exit(failures === 0 ? 0 : 1);
