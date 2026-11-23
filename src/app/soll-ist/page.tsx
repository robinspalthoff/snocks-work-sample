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
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { useFilters } from "@/lib/filters";
import { eur, eurCompact, eurDelta, int, monthLabel, pct } from "@/lib/format";
import { monthlyVariance, totalVariance, type VarianceRow } from "@/lib/variance";
import { safeDiv } from "@/lib/kpi";

export default function PlanActualPage() {
  const { filters } = useFilters();

  const rows = useMemo(() => monthlyVariance(filters), [filters]);
  const total = useMemo(() => totalVariance(filters), [filters]);

  const chartData = rows.map((r) => ({
    month: monthLabel(r.key),
    volume: Math.round(r.volume),
    price: Math.round(r.price),
    mix: Math.round(r.mix),
    returns: Math.round(r.returns),
    variance: Math.round(r.variance),
  }));

  const biggest = [
    { label: "Menge", value: total.volume },
    { label: "Preis", value: total.price },
    { label: "Mix", value: total.mix },
    { label: "Retouren", value: total.returns },
  ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Soll-Ist"
        insight={
          <>
            Der Netto-Umsatz liegt{" "}
            <strong className="text-foreground font-semibold">{eurDelta(total.variance)}</strong> (
            {pct(safeDiv(total.variance, total.planNetRevenue))}) gegenüber Plan. Größter
            Einzeltreiber ist der {biggest.label}-Effekt mit {eurDelta(biggest.value)} – eine
            Abweichung ist erst dann eine Information, wenn man weiß, woher sie kommt.
          </>
        }
      />

      <FilterBar />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          label="Plan"
          value={eurCompact(total.planNetRevenue)}
          secondary={`${int(total.planOrders)} Bestellungen`}
        />
        <KpiCard
          label="Ist"
          value={eurCompact(total.actualNetRevenue)}
          secondary={`${int(total.actualOrders)} Bestellungen`}
        />
        <KpiCard
          label="Abweichung"
          value={eurDelta(total.variance)}
          secondary={pct(safeDiv(total.variance, total.planNetRevenue))}
          deltaTone={total.variance >= 0 ? "positive" : "negative"}
          accent
        />
        <KpiCard
          label="AOV Plan / Ist"
          value={eur(total.actualAov)}
          secondary={`Plan ${eur(total.planAov)}`}
          deltaTone={total.actualAov >= total.planAov ? "positive" : "negative"}
        />
        <KpiCard
          label="Retouren Plan / Ist"
          value={pct(total.actualReturnRate)}
          secondary={`Plan ${pct(total.planReturnRate)}`}
          deltaTone={total.actualReturnRate <= total.planReturnRate ? "positive" : "negative"}
        />
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Abweichung je Monat, zerlegt"
          subtitle="Die vier Effekte summieren sich exakt auf die Gesamtabweichung des Netto-Umsatzes."
          action={
            <Legend
              items={[
                { label: "Menge", color: C.reported, swatch: "box" },
                { label: "Preis", color: C.neutral, swatch: "box" },
                { label: "Mix", color: C.neutralSoft, swatch: "box" },
                { label: "Retouren", color: C.real, swatch: "box" },
              ]}
            />
          }

          info={
            <>
              Mengeneffekt = (Ist-Bestellungen − Plan-Bestellungen) × Plan-AOV. Preiseffekt =
              (Ist-AOV − Plan-AOV) × Ist-Bestellungen. Mixeffekt = Verschiebung zwischen Marken mit
              unterschiedlichem Bestellwert. Retoureneffekt = −(Ist-Retourenquote −
              Plan-Retourenquote) × Ist-Bestellwert.
            </>
          }
        />
        <div className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 16, bottom: 4, left: 8 }}
              stackOffset="sign"
            >
              <CartesianGrid {...GRID} />
              <XAxis dataKey="month" {...AXIS} interval="preserveStartEnd" minTickGap={18} />
              <YAxis
                {...AXIS}
                width={62}
                tickFormatter={(v: number) => eurCompact(v).replace(" €", "")}
              />
              <ReferenceLine y={0} stroke={C.axis} />
              <Tooltip
                cursor={{ fill: "rgba(26,26,26,0.03)" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      title={String(label)}
                      rows={[
                        {
                          label: "Menge",
                          value: eur(Number(payload[0].payload.volume)),
                          color: C.reported,
                        },
                        {
                          label: "Preis",
                          value: eur(Number(payload[0].payload.price)),
                          color: C.neutral,
                        },
                        {
                          label: "Mix",
                          value: eur(Number(payload[0].payload.mix)),
                          color: C.neutralSoft,
                        },
                        {
                          label: "Retouren",
                          value: eur(Number(payload[0].payload.returns)),
                          color: C.real,
                        },
                      ]}
                      note={`Summe ${eurDelta(Number(payload[0].payload.variance))}`}
                    />
                  ) : null
                }
              />
              <Bar
                dataKey="volume"
                stackId="v"
                fill={C.reported}
                isAnimationActive={false}
                maxBarSize={28}
              />
              <Bar
                dataKey="price"
                stackId="v"
                fill={C.neutral}
                isAnimationActive={false}
                maxBarSize={28}
              />
              <Bar
                dataKey="mix"
                stackId="v"
                fill={C.neutralSoft}
                isAnimationActive={false}
                maxBarSize={28}
              />
              <Bar
                dataKey="returns"
                stackId="v"
                fill={C.real}
                isAnimationActive={false}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Monatsübersicht"
          subtitle="Plan, Ist und die Zerlegung der Abweichung."

          info={
            <>
              Der Plan liegt je Marke und Monat vor. Bei aktivem Kanal- oder Marktfilter wird er mit
              dem Umsatzanteil der Auswahl skaliert, damit Plan und Ist dieselbe Grundmenge
              beschreiben.
            </>
          }
        />
        <DataTable columns={columns} rows={rows} footer={total} minWidth={900} />
      </Card>
    </div>
  );
}

const columns: Column<VarianceRow>[] = [
  {
    key: "month",
    header: "Monat",
    render: (r) => (
      <span className="font-medium">{r.key === "Gesamt" ? "Gesamt" : monthLabel(r.key)}</span>
    ),
  },
  { key: "plan", header: "Plan", align: "right", render: (r) => eurCompact(r.planNetRevenue) },
  { key: "ist", header: "Ist", align: "right", render: (r) => eurCompact(r.actualNetRevenue) },
  {
    key: "var",
    header: "Abweichung",
    align: "right",
    render: (r) => (
      <span style={{ color: r.variance >= 0 ? C.positive : C.negative }}>
        {eurDelta(r.variance)}
      </span>
    ),
  },
  { key: "vol", header: "Menge", align: "right", render: (r) => eurDelta(r.volume) },
  { key: "price", header: "Preis", align: "right", render: (r) => eurDelta(r.price) },
  { key: "mix", header: "Mix", align: "right", render: (r) => eurDelta(r.mix) },
  {
    key: "ret",
    header: "Retouren",
    align: "right",
    render: (r) => (
      <span style={{ color: r.returns >= 0 ? C.positive : C.negative }}>{eurDelta(r.returns)}</span>
    ),
  },
];
