"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FilterBar } from "@/components/filters/filter-bar";
import { AXIS, C, GRID, Legend, TooltipCard } from "@/components/charts/chart-kit";
import { Card, CardHeader } from "@/components/ui/card";
import { InfoHint } from "@/components/ui/info-hint";
import { DataTable, type Column } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { BRAND_ASSUMPTIONS, MARKET_ASSUMPTIONS } from "@/config/assumptions";
import { eur, eurCompact, eurDelta, monthLabel, pct, pp, ratio } from "@/lib/format";
import { blendedPoas, useDashboard, type DimensionRow } from "@/lib/use-dashboard";
import { describeFilters, useFilters } from "@/lib/filters";

export default function OverviewPage() {
  const d = useDashboard();
  const { filters } = useFilters();

  const deltaCm3 = d.reported.cm3 - d.real.cm3;
  const deltaMargin = d.reported.cm3Margin - d.real.cm3Margin;
  const deltaNet = d.reported.netRevenue - d.real.netRevenue;
  const poas = blendedPoas(d.efficiency);

  // Über lange Zeiträume gleichen sich beide Sichten aus – die Verzerrung
  // steckt in einzelnen Monaten. Deshalb hier zusätzlich der Spitzenmonat.
  const peak = d.monthly.length
    ? d.monthly.reduce((best, m) =>
        m.reported.cm3 - m.real.cm3 > best.reported.cm3 - best.real.cm3 ? m : best,
      )
    : null;
  const peakDelta = peak ? peak.reported.cm3 - peak.real.cm3 : 0;
  const peakMargin = peak ? peak.reported.cm3Margin - peak.real.cm3Margin : 0;

  const chartData = d.monthly.map((m) => ({
    month: monthLabel(m.month),
    netRevenue: Math.round(m.real.netRevenue),
    cm3Real: Math.round(m.real.cm3),
    cm3Reported: Math.round(m.reported.cm3),
  }));

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Overview"
        insight={
          peak ? (
            <>
              Über den ganzen Zeitraum gleichen sich beide Sichten fast aus (Δ CM3{" "}
              {eurDelta(deltaCm3)}) – die Verzerrung steckt in einzelnen Monaten: im{" "}
              <strong className="text-foreground font-semibold">{monthLabel(peak.month)}</strong>{" "}
              wies der Report einen um{" "}
              <strong className="text-foreground font-semibold">{eurCompact(peakDelta)}</strong> zu
              hohen CM3 aus,{" "}
              <strong className="text-foreground font-semibold">{pp(peakMargin)}</strong> Marge.
            </>
          ) : (
            <>Kein Zeitraum ausgewählt.</>
          )
        }
      />

      <FilterBar />

      {/* ─── Headline: Reported vs. Real ───────────────────────────────── */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-border grid gap-px md:grid-cols-[1fr_1fr_1.1fr]">
          <div className="bg-card px-5 py-5">
            <p className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
              <span
                aria-hidden
                className="inline-block h-0 w-4 border-t-2 border-dashed"
                style={{ borderColor: C.reported }}
              />
              CM3 reported
            </p>
            <p className="tnum mt-2 text-[30px] leading-none font-semibold">
              {eurCompact(d.reported.cm3)}
            </p>
            <p className="tnum text-muted-foreground mt-1.5 text-[12px]">
              {pct(d.reported.cm3Margin)} Marge · Erstattungen am Erstattungsdatum
            </p>
          </div>

          <div className="bg-card px-5 py-5">
            <p className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
              <span
                aria-hidden
                className="inline-block h-0 w-4 border-t-2"
                style={{ borderColor: C.real }}
              />
              CM3 real
            </p>
            <p
              className="tnum mt-2 text-[30px] leading-none font-semibold"
              style={{ color: C.real }}
            >
              {eurCompact(d.real.cm3)}
            </p>
            <p className="tnum text-muted-foreground mt-1.5 text-[12px]">
              {pct(d.real.cm3Margin)} Marge · Erstattungen bei der Ursprungsbestellung
            </p>
          </div>

          <div className="bg-accent-soft/50 px-5 py-5">
            <p className="text-accent-strong flex items-center gap-1 text-[11px] font-medium tracking-wide uppercase">
              Delta reported − real
              <InfoHint align="end" width={320}>
                Beide Spalten rechnen mit identischem Brutto-Umsatz, identischen Rabatten,
                Bestellungen und Marketingkosten. Der einzige Unterschied ist das Datum, dem eine
                Erstattung zugeordnet wird. Aktuelle Auswahl:{" "}
                {describeFilters({ ...filters, presetId: null })}.
              </InfoHint>
            </p>
            <p className="tnum text-accent-strong mt-2 text-[30px] leading-none font-semibold">
              {eurDelta(deltaCm3)}
            </p>
            <p className="tnum text-muted-foreground mt-1.5 text-[12px]">
              {pp(deltaMargin)} CM3-Marge · {eurDelta(deltaNet)} Netto-Umsatz
            </p>
            {peak && (
              <p className="tnum text-muted-foreground mt-1 text-[12px]">
                Spitzenmonat {monthLabel(peak.month)}: {eurDelta(peakDelta)} ({pp(peakMargin)})
              </p>
            )}
            <Link
              href="/shopify-vs-realitaet"
              className="text-accent-strong mt-3 inline-flex items-center gap-1 text-[12px] font-medium hover:underline"
            >
              Woher die Differenz kommt
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </Card>

      {/* ─── KPI-Kacheln ───────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Netto-Umsatz"
          value={eurCompact(d.real.netRevenue)}
          secondary={`${eur(d.real.aov)} AOV`}
          hint="Brutto − Rabatte − Erstattungen"
        />
        <KpiCard
          label="CM1"
          value={eurCompact(d.real.cm1)}
          secondary={pct(d.real.cm1Margin)}
          hint="nach Wareneinsatz der behaltenen Ware"
        />
        <KpiCard
          label="CM2"
          value={eurCompact(d.real.cm2)}
          secondary={pct(d.real.cm2Margin)}
          hint="nach Logistik, Retouren, Payment, Provisionen"
        />
        <KpiCard
          label="CM3"
          value={eurCompact(d.real.cm3)}
          secondary={pct(d.real.cm3Margin)}
          delta={`${eurDelta(-deltaCm3)} vs. reported`}
          deltaTone="negative"
          accent
          hint="nach Marketingkosten"
        />
        <KpiCard
          label="MER"
          value={ratio(d.real.mer)}
          secondary={`${eurCompact(d.spend)} Spend`}
          hint="Netto-Umsatz je € Marketing"
        />
        <KpiCard
          label="POAS"
          value={ratio(poas)}
          secondary={`CM2 je € Spend`}
          deltaTone={poas < 1 ? "negative" : "positive"}
          hint="Deckungsbeitrag 2 der attribuierten Bestellungen"
        />
        <KpiCard
          label="Retourenquote"
          value={pct(d.real.returnRate)}
          secondary={`${pct(d.reported.returnRate)} reported`}
          hint="wertbasiert: Erstattungen / Brutto-Umsatz"
        />
        <KpiCard
          label="Bestellungen"
          value={new Intl.NumberFormat("de-DE", { notation: "compact" }).format(d.real.orders)}
          secondary={`${pct(d.real.newOrders / Math.max(1, d.real.orders))} Neukunden`}
          hint="im gewählten Zeitraum"
        />
      </div>

      {/* ─── Monatsverlauf ─────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader
          title="Netto-Umsatz und CM3 je Monat"
          subtitle="Alles in Euro – eine Achse."
          info={
            <>
              Die gestrichelte Linie ist der Standardreport, die durchgezogene die periodengerechte
              Sicht. Im November 2025 liegt die gestrichelte deutlich über der durchgezogenen: die
              Black-Week-Bestellungen sind gebucht, ihre Retouren treffen erst im Dezember und
              Januar ein.
            </>
          }
          action={
            <Legend
              items={[
                { label: "Netto-Umsatz", color: C.neutralFaint, swatch: "box" },
                { label: "CM3 real", color: C.real },
                { label: "CM3 reported", color: C.reported, dashed: true },
              ]}
            />
          }
        />
        <div className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="month" {...AXIS} interval="preserveStartEnd" minTickGap={16} />
              <YAxis
                {...AXIS}
                width={62}
                tickFormatter={(v: number) => eurCompact(v).replace(" €", "")}
              />
              <Tooltip
                cursor={{ fill: "rgba(26,26,26,0.03)" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      title={String(label)}
                      rows={[
                        {
                          label: "Netto-Umsatz",
                          value: eur(Number(payload[0].payload.netRevenue)),
                          color: C.neutralFaint,
                        },
                        {
                          label: "CM3 real",
                          value: eur(Number(payload[0].payload.cm3Real)),
                          color: C.real,
                        },
                        {
                          label: "CM3 reported",
                          value: eur(Number(payload[0].payload.cm3Reported)),
                          color: C.reported,
                          dashed: true,
                        },
                      ]}
                      note={`Differenz ${eurDelta(
                        Number(payload[0].payload.cm3Reported) - Number(payload[0].payload.cm3Real),
                      )}`}
                    />
                  ) : null
                }
              />
              <Bar
                dataKey="netRevenue"
                fill={C.neutralFaint}
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="cm3Reported"
                stroke={C.reported}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="cm3Real"
                stroke={C.real}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ─── Dimensionen ───────────────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Marken im Vergleich"
            subtitle="Periodengerechte Sicht."
            info={
              <>
                Die Retourenquote erklärt den Großteil der Margenunterschiede. OCEANSAPART liefert
                hohen Umsatz bei deutlich höherer Retourenquote – Activewear mit Größenunsicherheit.
                femtis ist die margenstärkste Marke im Portfolio.
              </>
            }
          />
          <DataTable columns={brandColumns} rows={d.byBrand} />
        </Card>

        <Card>
          <CardHeader
            title="Kanäle und Märkte"
            subtitle="Marktplätze vs. eigener Shop."
            info="Marktplätze tragen Provisionen von 15–23 % und höhere Retouren – der CM2 fällt entsprechend ab. Die Märkte darunter zeigen, wie stark Versandkosten und Retourenverhalten je Land auseinanderlaufen."
          />
          <DataTable columns={channelColumns} rows={d.byChannel} />
          <div className="border-border border-t">
            <DataTable columns={marketColumns} rows={d.byMarket} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Tabellenspalten ────────────────────────────────────────────────────

const brandColumns: Column<DimensionRow<keyof typeof BRAND_ASSUMPTIONS>>[] = [
  {
    key: "brand",
    header: "Marke",
    render: (r) => (
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block size-2.5 shrink-0 rounded-sm"
          style={{ background: C.brands[r.key] }}
        />
        <span className="font-medium">{r.key}</span>
        <span className="text-subtle-foreground hidden text-[11px] sm:inline">
          {BRAND_ASSUMPTIONS[r.key].category}
        </span>
      </span>
    ),
  },
  {
    key: "net",
    header: "Netto-Umsatz",
    align: "right",
    render: (r) => eurCompact(r.real.netRevenue),
  },
  { key: "cm2", header: "CM2 %", align: "right", render: (r) => pct(r.real.cm2Margin) },
  { key: "cm3", header: "CM3 %", align: "right", render: (r) => pct(r.real.cm3Margin) },
  { key: "ret", header: "Retouren", align: "right", render: (r) => pct(r.real.returnRate) },
  {
    key: "delta",
    header: "Δ reported",
    align: "right",
    title: "CM3 nach Erstattungsdatum minus CM3 nach Bestell-Kohorte",
    render: (r) => (
      <span className="text-accent-strong">{eurDelta(r.reported.cm3 - r.real.cm3)}</span>
    ),
  },
];

const channelColumns: Column<DimensionRow<"Onlineshop" | "Amazon" | "Zalando">>[] = [
  { key: "channel", header: "Kanal", render: (r) => <span className="font-medium">{r.key}</span> },
  {
    key: "net",
    header: "Netto-Umsatz",
    align: "right",
    render: (r) => eurCompact(r.real.netRevenue),
  },
  { key: "cm1", header: "CM1 %", align: "right", render: (r) => pct(r.real.cm1Margin) },
  { key: "cm2", header: "CM2 %", align: "right", render: (r) => pct(r.real.cm2Margin) },
  { key: "ret", header: "Retouren", align: "right", render: (r) => pct(r.real.returnRate) },
  { key: "aov", header: "AOV", align: "right", render: (r) => eur(r.real.aov) },
];

const marketColumns: Column<DimensionRow<keyof typeof MARKET_ASSUMPTIONS>>[] = [
  {
    key: "market",
    header: "Markt",
    render: (r) => (
      <span>
        <span className="font-medium">{r.key}</span>{" "}
        <span className="text-subtle-foreground hidden text-[11px] sm:inline">
          {MARKET_ASSUMPTIONS[r.key].label}
        </span>
      </span>
    ),
  },
  {
    key: "net",
    header: "Netto-Umsatz",
    align: "right",
    render: (r) => eurCompact(r.real.netRevenue),
  },
  { key: "cm1", header: "CM1 %", align: "right", render: (r) => pct(r.real.cm1Margin) },
  { key: "cm2", header: "CM2 %", align: "right", render: (r) => pct(r.real.cm2Margin) },
  { key: "ret", header: "Retouren", align: "right", render: (r) => pct(r.real.returnRate) },
  { key: "aov", header: "AOV", align: "right", render: (r) => eur(r.real.aov) },
];
