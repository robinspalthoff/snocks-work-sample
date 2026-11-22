"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, C, GRID, Legend, TooltipCard } from "@/components/charts/chart-kit";
import { FilterBar } from "@/components/filters/filter-bar";
import { Card, CardHeader, CardNote } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { BRANDS, MARKETING_ASSUMPTIONS, TARGET_MER } from "@/config/assumptions";
import { cubeMonth, marketingMonth } from "@/data/datasets";
import { useFilters } from "@/lib/filters";
import { eur, eurCompact, pct, ratio } from "@/lib/format";
import {
  BLENDED_SHIPPING,
  aggregateMarketing,
  brandAllocation,
  channelEfficiency,
  safeDiv,
  type ChannelEfficiency,
} from "@/lib/kpi";
import { blendedPoas, useDashboard } from "@/lib/use-dashboard";

export default function MarketingPage() {
  const d = useDashboard();
  const { filters } = useFilters();

  const poas = blendedPoas(d.efficiency);
  const worst = [...d.efficiency].sort((a, b) => a.poas - b.poas)[0];
  const bestRoas = [...d.efficiency].sort((a, b) => b.roas - a.roas)[0];

  const chartData = d.efficiency.map((e) => ({
    channel: e.marketingChannel,
    roas: Number(e.roas.toFixed(2)),
    poas: Number(e.poas.toFixed(2)),
  }));

  // POAS je Marke × Marketing-Kanal
  const byBrand = useMemo(() => {
    const alloc = brandAllocation(cubeMonth, filters);
    const rows = aggregateMarketing(marketingMonth, filters, alloc);
    return BRANDS.filter((b) => filters.brands.includes(b)).map((brand) => ({
      brand,
      efficiency: channelEfficiency(
        rows.filter((r) => r.brand === brand),
        BLENDED_SHIPPING,
      ),
    }));
  }, [filters]);

  // Wie viel des tatsächlichen Shop-Bestellwerts die Plattformen für sich
  // reklamieren. Unter 100 % heißt nicht "sauber": organische Bestellungen
  // und Mehrfachzählungen heben sich hier auf. Deshalb bleibt der MER die
  // attributionsfreie Gegenprobe.
  const attributedOrderValue = d.efficiency.reduce((a, e) => a + e.attributedOrderValue, 0);
  const shop = d.byChannel.find((c) => c.key === "Onlineshop")?.real ?? d.real;
  const attributionCoverage = safeDiv(attributedOrderValue, shop.gross - shop.discount);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Marketing-Effizienz"
        insight={
          worst && bestRoas ? (
            <>
              {bestRoas.marketingChannel} liefert mit {ratio(bestRoas.roas)} den besten ROAS –{" "}
              {worst.marketingChannel} kommt auf {ratio(worst.roas)} ROAS, aber nur{" "}
              <strong className="font-semibold text-foreground">
                {ratio(worst.poas)} POAS
              </strong>
              . Nach Retouren, Wareneinsatz und Logistik{" "}
              {worst.poas < 1
                ? "verdient dieser Kanal weniger, als er kostet."
                : "bleibt dort deutlich weniger übrig, als der ROAS verspricht."}
            </>
          ) : (
            <>Kein Marketing-Spend im gewählten Zeitraum.</>
          )
        }
      />

      <FilterBar />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Ad-Spend"
          value={eurCompact(d.spend)}
          secondary={`${pct(safeDiv(d.spend, d.real.netRevenue))} vom Netto-Umsatz`}
        />
        <KpiCard
          label="MER"
          value={ratio(d.real.mer)}
          secondary={`Ziel ${ratio(TARGET_MER)}`}
          deltaTone={d.real.mer >= TARGET_MER ? "positive" : "negative"}
          delta={d.real.mer >= TARGET_MER ? "über Ziel" : "unter Ziel"}
          hint="Netto-Umsatz gesamt / Spend gesamt"
        />
        <KpiCard
          label="POAS (blended)"
          value={ratio(poas)}
          accent
          secondary="CM2 je € Spend"
          hint="ab 1,00 trägt sich der Spend aus dem Deckungsbeitrag 2"
        />
        <KpiCard
          label="Attributionsabdeckung"
          value={pct(attributionCoverage, 0)}
          secondary={`${eurCompact(attributedOrderValue)} attribuiert`}
          hint="Summe der Plattform-Attributionen im Verhältnis zum Bestellwert des eigenen Shops"
        />
      </div>

      <Card className="mb-6">
        <CardHeader
          title="ROAS und POAS je Marketing-Kanal"
          subtitle="Beide Kennzahlen sind Euro je Euro Spend und stehen deshalb auf derselben Achse. Die Linie bei 1,00 ist die Grenze, ab der ein Kanal seinen eigenen Spend aus dem CM2 trägt."
          action={
            <Legend
              items={[
                { label: "ROAS", color: C.neutralSoft, swatch: "box" },
                { label: "POAS", color: C.real, swatch: "box" },
              ]}
            />
          }
        />
        <div className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="channel" {...AXIS} />
              <YAxis {...AXIS} width={44} tickFormatter={(v: number) => ratio(v, 1)} />
              <ReferenceLine
                y={1}
                stroke={C.axis}
                strokeDasharray="4 4"
                label={{ value: "Break-even 1,00", position: "right", fontSize: 10, fill: C.axis }}
              />
              <Tooltip
                cursor={{ fill: "rgba(26,26,26,0.03)" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      title={String(label)}
                      rows={[
                        {
                          label: "ROAS",
                          value: ratio(Number(payload[0].payload.roas)),
                          color: C.neutralSoft,
                        },
                        {
                          label: "POAS",
                          value: ratio(Number(payload[0].payload.poas)),
                          color: C.real,
                        },
                      ]}
                      note={MARKETING_ASSUMPTIONS[label as keyof typeof MARKETING_ASSUMPTIONS]?.note}
                    />
                  ) : null
                }
              />
              <Bar dataKey="roas" fill={C.neutralSoft} radius={[3, 3, 0, 0]} maxBarSize={38} isAnimationActive={false} />
              <Bar dataKey="poas" fill={C.real} radius={[3, 3, 0, 0]} maxBarSize={38} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <CardNote>
          Der Abstand zwischen den beiden Balken ist alles, was zwischen Umsatz und Deckungsbeitrag
          liegt: Rabatte, Retouren, Wareneinsatz, Logistik und Zahlungsgebühren. Er ist pro Kanal
          unterschiedlich groß – und genau deshalb führt eine reine ROAS-Steuerung zu falschen
          Budgetverschiebungen.
        </CardNote>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="Kanäle im Detail"
          subtitle="Attribuierter Bestellwert wie von der Plattform gemeldet, daneben derselbe Wert nach Retouren."
        />
        <DataTable columns={efficiencyColumns} rows={d.efficiency} minWidth={820} />
        <CardNote>
          Die Plattformen reklamieren zusammen {pct(attributionCoverage, 0)} des tatsächlichen
          Shop-Bestellwerts für sich. Das ist kein Gütesiegel: organische Bestellungen und
          Mehrfachzählungen derselben Bestellung heben sich in dieser Zahl gegenseitig auf. Für
          die Budgetsteuerung ist deshalb der Vergleich der Kanäle untereinander belastbar, die
          absolute Höhe nicht – die attributionsfreie Gegenprobe ist der MER.
        </CardNote>
      </Card>

      <Card>
        <CardHeader
          title="POAS je Marke und Kanal"
          subtitle="Wo dieselbe Plattform je nach Marke unterschiedlich wirtschaftlich ist – Retourenquote und Wareneinsatz der Marke schlagen durch."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-[10.5px] font-semibold tracking-[0.06em] text-subtle-foreground uppercase">
                  Marke
                </th>
                {d.efficiency.map((e) => (
                  <th
                    key={e.marketingChannel}
                    className="px-3 py-2 text-right text-[10.5px] font-semibold tracking-[0.06em] text-subtle-foreground uppercase"
                  >
                    {e.marketingChannel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byBrand.map(({ brand, efficiency }) => (
                <tr key={brand} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        aria-hidden
                        className="inline-block size-2.5 rounded-sm"
                        style={{ background: C.brands[brand] }}
                      />
                      {brand}
                    </span>
                  </td>
                  {d.efficiency.map((col) => {
                    const cell = efficiency.find(
                      (e) => e.marketingChannel === col.marketingChannel,
                    );
                    const v = cell?.poas ?? 0;
                    return (
                      <td
                        key={col.marketingChannel}
                        className="tnum px-3 py-2.5 text-right"
                        style={{ color: v < 1 ? C.negative : undefined }}
                      >
                        {ratio(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CardNote>
          Marketing-Spend liegt je Marke und Tag vor, nicht je Markt oder Verkaufskanal. Bei
          aktivem Markt- oder Kanalfilter wird er anteilig nach Netto-Umsatz allokiert – das ist
          eine Allokation, keine Messung.
        </CardNote>
      </Card>
    </div>
  );
}

const efficiencyColumns: Column<ChannelEfficiency>[] = [
  {
    key: "channel",
    header: "Kanal",
    render: (r) => <span className="font-medium">{r.marketingChannel}</span>,
  },
  { key: "spend", header: "Spend", align: "right", render: (r) => eurCompact(r.spend) },
  {
    key: "rev",
    header: "Attr. Bestellwert",
    align: "right",
    title: "Bestellwert nach Rabatt, vor Retouren – die Zahl aus dem Ads-Manager",
    render: (r) => eurCompact(r.attributedOrderValue),
  },
  {
    key: "revnet",
    header: "nach Retouren",
    align: "right",
    render: (r) => eurCompact(r.attributedRevenue),
  },
  { key: "roas", header: "ROAS", align: "right", render: (r) => ratio(r.roas) },
  { key: "cm2", header: "CM2 attribuiert", align: "right", render: (r) => eurCompact(r.cm2) },
  {
    key: "poas",
    header: "POAS",
    align: "right",
    render: (r) => (
      <span className="font-semibold" style={{ color: r.poas < 1 ? C.negative : C.real }}>
        {ratio(r.poas)}
      </span>
    ),
  },
  { key: "ret", header: "Retouren", align: "right", render: (r) => pct(r.returnRate) },
  { key: "cac", header: "CAC", align: "right", render: (r) => eur(r.cac) },
];
