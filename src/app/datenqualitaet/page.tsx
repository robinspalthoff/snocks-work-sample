"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardHeader, CardNote } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { C } from "@/components/charts/chart-kit";
import {
  BASE_DISCOUNT_RATE,
  BRAND_ASSUMPTIONS,
  BRANDS,
  CHANNEL_ASSUMPTIONS,
  CHANNELS,
  DATA_DISCLAIMER,
  MARKET_ASSUMPTIONS,
  MARKETS,
  PAYMENT_MIX,
  RANDOM_SEED,
  REFUND_WINDOW_DAYS,
  SALES_EVENTS,
  TARGET_MER,
  UNIT_COSTS,
} from "@/config/assumptions";
import { cubeMonth, dataQuality, meta } from "@/data/datasets";
import { dateLabel, eur, eurCents, eurCompact, int, monthLabel, pct, ratio } from "@/lib/format";
import { ALL_FILTERS, aggregate, computeCm, safeDiv } from "@/lib/kpi";

type Severity = "ok" | "info" | "warn";

interface Check {
  id: string;
  label: string;
  severity: Severity;
  value: string;
  detail: string;
  action: string;
}

export default function DataQualityPage() {
  const allFilters = {
    ...ALL_FILTERS,
    from: cubeMonth.periods[0],
    to: cubeMonth.periods[cubeMonth.periods.length - 1],
  };
  const rows = aggregate(cubeMonth, allFilters);
  const real = computeCm(rows, "cohort");
  const reported = computeCm(rows, "reported");

  // Noch nicht eingetroffene Erstattungen: Bestellungen der letzten
  // Wochen, deren Retouren erwartet, aber noch nicht gebucht sind.
  const openRefunds = real.refunds - reported.refunds;

  // Konsistenzprüfung des Wasserfalls.
  const waterfallDelta =
    real.netRevenue - real.cogs - real.variableCosts - real.marketing - real.cm3;

  const drift = dataQuality.marketplaceDrift;
  const driftPct =
    drift.reduce((acc, row) => {
      const own = Number(row.Amazon_own) + Number(row.Zalando_own);
      const settle = Number(row.Amazon_settlement) + Number(row.Zalando_settlement);
      return acc + Math.abs(safeDiv(settle - own, own));
    }, 0) / Math.max(1, drift.length);

  const checks: Check[] = [
    {
      id: "late-refunds",
      label: "Erstattungen nach Periodenabschluss",
      severity: "warn",
      value: eurCompact(dataQuality.lateRefunds.value),
      detail: `${int(
        dataQuality.lateRefunds.count,
      )} Erstattungen gehören zu Bestellungen bis ${dateLabel(
        dataQuality.closedThrough,
      )}, wurden aber danach gebucht. In der Sicht nach Erstattungsdatum verschieben sie Marge in einen späteren Monat.`,
      action:
        "Retouren-Rückstellung je offener Kohorte auf Basis der tatsächlichen Verzugsverteilung bilden, statt den Abschluss nachträglich zu korrigieren.",
    },
    {
      id: "open-refunds",
      label: "Erwartete, noch nicht eingetroffene Erstattungen",
      severity: "info",
      value: eurCompact(openRefunds),
      detail: `Bestellungen der letzten ${REFUND_WINDOW_DAYS} Tage, deren Retouren nach der historischen Verzugsverteilung noch kommen. Die Kohortensicht enthält sie bereits, der Standardreport noch nicht.`,
      action:
        "In der Monatsberichterstattung als Rückstellung ausweisen und den Schätzwert gegen den Ist-Verlauf nachhalten.",
    },
    {
      id: "missing-cogs",
      label: "Bestellungen ohne hinterlegte Landed Cost",
      severity: "warn",
      value: pct(dataQuality.missingCogs.share),
      detail: `Hochgerechnet ${int(
        dataQuality.missingCogs.orders,
      )} Bestellungen mit ${eurCompact(
        dataQuality.missingCogs.grossValue,
      )} Brutto-Umsatz. Diese Bestellungen erscheinen im CM1 zu gut, weil der Wareneinsatz fehlt.`,
      action:
        "Pflichtfeld im Artikelstamm, nächtlicher Abgleich neuer SKUs und ein harter Alert, bevor eine SKU live geht.",
    },
    {
      id: "marketplace-drift",
      label: "Abweichung eigene Bestelldaten vs. Marktplatz-Abrechnung",
      severity: "warn",
      value: pct(driftPct),
      detail:
        "Durchschnittliche monatliche Abweichung zwischen dem eigenen Bestellbestand und der Settlement-Datei von Amazon und Zalando. Ursachen sind typischerweise Gebührenkorrekturen, Kulanzgutschriften und Währungsrundungen.",
      action:
        "Monatliche Abstimmung Settlement gegen Order-Daten als fester Schritt im Abschluss, mit Toleranzschwelle und Klärfall-Liste.",
    },
    {
      id: "partial-refunds",
      label: "Teilerstattungen ohne Warenrückfluss",
      severity: "info",
      value: pct(dataQuality.partialRefundsWithoutReturn.share),
      detail: dataQuality.partialRefundsWithoutReturn.note,
      action:
        "Getrennt von echten Retouren führen – sonst wird die Retourenquote überschätzt und die Logistikkosten werden falsch geplant.",
    },
    {
      id: "waterfall",
      label: "Konsistenz der Deckungsbeitragsrechnung",
      severity: Math.abs(waterfallDelta) < 1 ? "ok" : "warn",
      value: Math.abs(waterfallDelta) < 1 ? "bestanden" : eur(waterfallDelta),
      detail:
        "Netto-Umsatz − COGS − variable Kosten − Marketing muss exakt dem CM3 entsprechen. Die Prüfung läuft über den gesamten Datenbestand.",
      action: "Automatisch bei jedem Build – eine Abweichung bricht das Reporting, nicht erst der Abschluss.",
    },
    {
      id: "convergence",
      label: "Konvergenz beider Sichten über den Gesamtzeitraum",
      severity: "ok",
      value: pct(safeDiv(Math.abs(reported.cm3 - real.cm3), Math.abs(real.cm3))),
      detail: `Über den gesamten Zeitraum unterscheiden sich beide Sichten nur noch um ${eurCompact(
        reported.cm3 - real.cm3,
      )}. Das ist der erwartete Rest: Erstattungen zu Bestellungen vor dem 01.01.2025 und offene Retouren am aktuellen Rand.`,
      action: "Dient als Plausibilitätsprüfung des Modells – die Differenz muss gegen null laufen.",
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Datenqualität & KPI-Definitionen"
        insight="Eine Kennzahl ist nur so gut wie ihre Definition und die Daten darunter – beides steht hier offen."
      />

      <Card className="mb-6">
        <CardHeader
          title="Automatische Prüfungen"
          subtitle="Laufen über den gesamten Datenbestand, nicht über den gefilterten Ausschnitt."
        />
        <ul className="px-5 pb-5">
          {checks.map((c) => (
            <li key={c.id} className="border-t border-border py-4 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <SeverityIcon severity={c.severity} />
                <h3 className="text-[13px] font-semibold">{c.label}</h3>
                <span
                  className="tnum ml-auto text-[14px] font-semibold"
                  style={{
                    color:
                      c.severity === "warn"
                        ? C.warning
                        : c.severity === "ok"
                          ? C.positive
                          : undefined,
                  }}
                >
                  {c.value}
                </span>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {c.detail}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-subtle-foreground">
                <strong className="font-medium">Was ich täte:</strong> {c.action}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="Shop- und Marktplatzdaten je Monat"
          subtitle="Eigene Bestelldaten gegen die Abrechnung des Marktplatzes."
        />
        <DataTable columns={driftColumns} rows={drift.slice(-8)} minWidth={720} />
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="KPI-Definitionen"
          subtitle="Genau so sind die Kennzahlen in diesem Dashboard gerechnet."
        />
        <DataTable columns={glossaryColumns} rows={GLOSSARY} minWidth={760} />
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Annahmen je Marke" subtitle="Synthetisch, plausibel geschätzt." />
          <DataTable
            columns={brandAssumptionColumns}
            rows={BRANDS.map((b) => ({ brand: b, ...BRAND_ASSUMPTIONS[b] }))}
            minWidth={620}
          />
        </Card>

        <Card>
          <CardHeader title="Annahmen je Kanal" subtitle="Provisionen und Gebührensätze." />
          <DataTable
            columns={channelAssumptionColumns}
            rows={CHANNELS.map((c) => ({ channel: c, ...CHANNEL_ASSUMPTIONS[c] }))}
            minWidth={620}
          />
          <CardNote>
            Zahlarten-Mix im eigenen Shop:{" "}
            {PAYMENT_MIX.map((p) => `${p.method} ${pct(p.share, 0)} @ ${pct(p.feeRate, 2)}`).join(
              " · ",
            )}{" "}
            = {pct(meta.paymentFeeBlended, 2)} gewichtet.
          </CardNote>
        </Card>

        <Card>
          <CardHeader title="Annahmen je Markt" subtitle="Versandkosten und Retourenverhalten." />
          <DataTable
            columns={marketAssumptionColumns}
            rows={MARKETS.map((m) => ({ market: m, ...MARKET_ASSUMPTIONS[m] }))}
            minWidth={520}
          />
        </Card>

        <Card>
          <CardHeader title="Sales Events" subtitle="Rabatt, Absatz-Uplift und Retouren-Aufschlag." />
          <DataTable columns={eventColumns} rows={SALES_EVENTS} minWidth={620} />
        </Card>
      </div>

      <Card className="mt-4 px-5 py-5">
        <h2 className="text-[13px] font-semibold">Stückkosten und Rahmenwerte</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-2 text-[12.5px] sm:grid-cols-2">
          <Fact label="Fulfillment je Bestellung" value={eurCents(UNIT_COSTS.fulfillmentPerOrder)} />
          <Fact
            label="Retourenbearbeitung je Retoure"
            value={eurCents(UNIT_COSTS.returnHandlingPerReturn)}
          />
          <Fact
            label="Abschreibung auf Rückläufer"
            value={pct(UNIT_COSTS.returnWriteOffShare, 0)}
          />
          <Fact label="Versand gewichtet" value={eurCents(meta.shippingBlended)} />
          <Fact label="Rabatt im Normalgeschäft" value={pct(BASE_DISCOUNT_RATE, 0)} />
          <Fact label="Ziel-MER" value={ratio(TARGET_MER)} />
          <Fact label="Retourenfenster" value={`${REFUND_WINDOW_DAYS} Tage`} />
          <Fact label="Periodenabschluss bis" value={dateLabel(dataQuality.closedThrough)} />
          <Fact label="Datengenerator-Seed" value={String(RANDOM_SEED)} />
          <Fact
            label="Datenumfang"
            value={`${int(meta.days)} Tage · ${int(meta.combos)} Kombinationen · ${int(
              meta.sampleOrders,
            )} Einzelbestellungen`}
          />
        </dl>
        <p className="mt-4 text-[12px] leading-relaxed text-subtle-foreground">
          {DATA_DISCLAIMER}
        </p>
      </Card>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tnum font-medium">{value}</dd>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: Severity }) {
  if (severity === "ok")
    return <CheckCircle2 className="size-4 shrink-0" style={{ color: C.positive }} aria-label="bestanden" />;
  if (severity === "warn")
    return <AlertTriangle className="size-4 shrink-0" style={{ color: C.warning }} aria-label="Hinweis" />;
  return <Info className="size-4 shrink-0 text-muted-foreground" aria-label="Information" />;
}

// ─── Glossar ────────────────────────────────────────────────────────────

interface GlossaryEntry {
  term: string;
  formula: string;
  note: string;
}

const GLOSSARY: GlossaryEntry[] = [
  {
    term: "Brutto-Umsatz",
    formula: "Σ Line-Item-Preise vor Rabatt, netto ohne USt",
    note: "Listenpreise der versandten Ware. Versanderlöse sind nicht enthalten.",
  },
  {
    term: "Netto-Umsatz",
    formula: "Brutto-Umsatz − Rabatte − Erstattungen",
    note: "Ohne USt und ohne Versanderlöse. Die Zuordnung der Erstattungen entscheidet über die Sicht.",
  },
  {
    term: "CM1",
    formula: "Netto-Umsatz − COGS der behaltenen Ware",
    note: "COGS = Landed Cost. Nicht wieder verkäufliche Rückläufer bleiben als Abschreibung im Wareneinsatz.",
  },
  {
    term: "CM2",
    formula: "CM1 − Fulfillment − Versand − Retourenbearbeitung − Payment-Gebühren − Marktplatzgebühren",
    note: "Alle Kosten, die direkt an einer Bestellung hängen.",
  },
  { term: "CM3", formula: "CM2 − Marketingkosten", note: "Marketing als Ad-Spend des Zeitraums." },
  {
    term: "ROAS",
    formula: "attribuierter Bestellwert / Ad-Spend des Kanals",
    note: "Bestellwert nach Rabatt und vor Retouren, so wie die Plattform ihn meldet. Die Summe über alle Kanäle übersteigt den tatsächlichen Umsatz.",
  },
  {
    term: "POAS",
    formula: "CM2 der attribuierten Bestellungen / Ad-Spend",
    note: "Ab 1,00 trägt der Kanal seinen Spend aus dem Deckungsbeitrag 2.",
  },
  {
    term: "MER",
    formula: "gesamter Netto-Umsatz / gesamter Marketing-Spend",
    note: "Attributionsfrei und deshalb die Gegenprobe zum ROAS.",
  },
  {
    term: "Retourenquote",
    formula: "Erstattungen / Brutto-Umsatz",
    note: "Wertbasiert, nicht stückbasiert.",
  },
  { term: "AOV", formula: "Netto-Umsatz / Anzahl Bestellungen", note: "Nach Rabatt und Erstattungen." },
  {
    term: "Reported vs. Real Delta",
    formula: "KPI nach Erstattungsdatum − KPI nach Bestell-Kohorte",
    note: "Positiv bedeutet: der Standardreport zeigt die Periode besser, als sie war.",
  },
];

const glossaryColumns: Column<GlossaryEntry>[] = [
  { key: "term", header: "Kennzahl", width: "150px", render: (r) => <span className="font-medium">{r.term}</span> },
  {
    key: "formula",
    header: "Formel",
    render: (r) => <code className="text-[11.5px] text-foreground">{r.formula}</code>,
  },
  { key: "note", header: "Anmerkung", render: (r) => <span className="text-muted-foreground">{r.note}</span> },
];

// ─── Annahmetabellen ────────────────────────────────────────────────────

type BrandRow = { brand: string } & (typeof BRAND_ASSUMPTIONS)[keyof typeof BRAND_ASSUMPTIONS];

const brandAssumptionColumns: Column<BrandRow>[] = [
  {
    key: "brand",
    header: "Marke",
    render: (r) => (
      <span className="flex items-center gap-2 font-medium">
        <span
          aria-hidden
          className="inline-block size-2.5 rounded-sm"
          style={{ background: C.brands[r.brand] }}
        />
        {r.brand}
      </span>
    ),
  },
  { key: "cat", header: "Kategorie", render: (r) => r.category },
  { key: "share", header: "Umsatzanteil", align: "right", render: (r) => pct(r.revenueShare, 0) },
  { key: "cogs", header: "COGS-Satz", align: "right", render: (r) => pct(r.cogsRate, 0) },
  { key: "ret", header: "Retouren", align: "right", render: (r) => pct(r.returnRate, 0) },
  { key: "aov", header: "AOV Shop", align: "right", render: (r) => eur(r.aovShop) },
  { key: "growth", header: "Wachstum", align: "right", render: (r) => pct(r.growth2026, 0) },
];

type ChannelRow = { channel: string } & (typeof CHANNEL_ASSUMPTIONS)[keyof typeof CHANNEL_ASSUMPTIONS];

const channelAssumptionColumns: Column<ChannelRow>[] = [
  { key: "channel", header: "Kanal", render: (r) => <span className="font-medium">{r.channel}</span> },
  { key: "share", header: "Umsatzanteil", align: "right", render: (r) => pct(r.revenueShare, 0) },
  { key: "fee", header: "Provision", align: "right", render: (r) => pct(r.marketplaceFeeRate, 0) },
  { key: "pay", header: "Payment", align: "right", render: (r) => pct(r.paymentFeeRate, 2) },
  {
    key: "ret",
    header: "Retouren Δ",
    align: "right",
    render: (r) => `${r.returnRateDelta >= 0 ? "+" : "−"}${pct(Math.abs(r.returnRateDelta), 0)}`,
  },
  { key: "note", header: "Anmerkung", render: (r) => <span className="text-muted-foreground">{r.note}</span> },
];

type MarketRow = { market: string } & (typeof MARKET_ASSUMPTIONS)[keyof typeof MARKET_ASSUMPTIONS];

const marketAssumptionColumns: Column<MarketRow>[] = [
  {
    key: "market",
    header: "Markt",
    render: (r) => (
      <span>
        <span className="font-medium">{r.market}</span>{" "}
        <span className="text-[11px] text-subtle-foreground">{r.label}</span>
      </span>
    ),
  },
  { key: "share", header: "Umsatzanteil", align: "right", render: (r) => pct(r.revenueShare, 0) },
  { key: "ship", header: "Versand", align: "right", render: (r) => eurCents(r.shippingCost) },
  {
    key: "ret",
    header: "Retouren Δ",
    align: "right",
    render: (r) =>
      `${r.returnRateDelta >= 0 ? "+" : "−"}${(Math.abs(r.returnRateDelta) * 100).toLocaleString(
        "de-DE",
        { maximumFractionDigits: 1 },
      )} pp`,
  },
];

const eventColumns: Column<(typeof SALES_EVENTS)[number]>[] = [
  {
    key: "label",
    header: "Event",
    render: (r) => (
      <span className={r.isBlackWeek ? "font-semibold text-accent-strong" : "font-medium"}>
        {r.label}
      </span>
    ),
  },
  {
    key: "range",
    header: "Zeitraum",
    render: (r) => (
      <span className="text-muted-foreground">
        {dateLabel(r.start)} – {dateLabel(r.end)}
      </span>
    ),
  },
  { key: "disc", header: "Rabatt", align: "right", render: (r) => pct(r.discountRate, 0) },
  { key: "up", header: "Absatz", align: "right", render: (r) => `+${Math.round(r.volumeUplift * 100)} %` },
  {
    key: "ret",
    header: "Retouren",
    align: "right",
    render: (r) => `+${Math.round(r.returnRateUplift * 100)} %`,
  },
  { key: "spend", header: "Spend", align: "right", render: (r) => `${ratio(r.spendFactor, 2)}×` },
];

// ─── Marktplatz-Abgleich ────────────────────────────────────────────────

type DriftRow = Record<string, number | string> & { month: string };

const driftColumns: Column<DriftRow>[] = [
  { key: "month", header: "Monat", render: (r) => <span className="font-medium">{monthLabel(r.month)}</span> },
  { key: "aown", header: "Amazon eigen", align: "right", render: (r) => eurCompact(Number(r.Amazon_own)) },
  {
    key: "aset",
    header: "Amazon Settlement",
    align: "right",
    render: (r) => eurCompact(Number(r.Amazon_settlement)),
  },
  {
    key: "adiff",
    header: "Δ",
    align: "right",
    render: (r) => (
      <span style={{ color: C.warning }}>
        {pct(safeDiv(Number(r.Amazon_settlement) - Number(r.Amazon_own), Number(r.Amazon_own)), 2)}
      </span>
    ),
  },
  { key: "zown", header: "Zalando eigen", align: "right", render: (r) => eurCompact(Number(r.Zalando_own)) },
  {
    key: "zset",
    header: "Zalando Settlement",
    align: "right",
    render: (r) => eurCompact(Number(r.Zalando_settlement)),
  },
  {
    key: "zdiff",
    header: "Δ",
    align: "right",
    render: (r) => (
      <span style={{ color: C.warning }}>
        {pct(safeDiv(Number(r.Zalando_settlement) - Number(r.Zalando_own), Number(r.Zalando_own)), 2)}
      </span>
    ),
  },
];
