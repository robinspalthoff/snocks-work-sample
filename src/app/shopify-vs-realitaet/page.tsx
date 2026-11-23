"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
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
import { PageHeader } from "@/components/ui/page-header";
import { BLACK_WEEK_2025, REFUND_WINDOW_DAYS } from "@/config/assumptions";
import { cohorts, cubeWindowDaily } from "@/data/datasets";
import { useFilters } from "@/lib/filters";
import {
  dateLabel,
  dayLabel,
  eur,
  eurCompact,
  eurDelta,
  monthLabel,
  pct,
  pp,
  ppAbs,
} from "@/lib/format";
import { cohortCurve } from "@/lib/cohort";
import { comboIndices } from "@/lib/kpi";
import { useDashboard } from "@/lib/use-dashboard";

const BW_WINDOW = { start: "2025-10-15", end: "2026-01-31" };

export default function ShopifyVsRealityPage() {
  const d = useDashboard();
  const { filters } = useFilters();
  const [compareId, setCompareId] = useState("normal-2025");

  const monthly = d.monthly.map((m) => ({
    month: monthLabel(m.month),
    netReported: Math.round(m.reported.netRevenue),
    netReal: Math.round(m.real.netRevenue),
    marginReported: m.reported.cm3Margin * 100,
    marginReal: m.real.cm3Margin * 100,
  }));

  // ─── Tagesreihe der Erstattungen rund um die Black Week 2025 ──────────
  const daily = useMemo(() => {
    const cIdx = comboIndices(cubeWindowDaily, filters);
    const refCohort = cubeWindowDaily.metricIdx.refundCohort!;
    const refReported = cubeWindowDaily.metricIdx.refundReported!;
    const out: { date: string; label: string; cohort: number; reported: number }[] = [];
    cubeWindowDaily.periods.forEach((day, di) => {
      if (day < BW_WINDOW.start || day > BW_WINDOW.end) return;
      let cohort = 0;
      let reported = 0;
      for (const ci of cIdx) {
        cohort += cubeWindowDaily.data[ci][refCohort][di] ?? 0;
        reported += cubeWindowDaily.data[ci][refReported][di] ?? 0;
      }
      out.push({ date: day, label: dayLabel(day), cohort, reported });
    });
    return out;
  }, [filters]);

  // ─── Kohortenverlauf ──────────────────────────────────────────────────
  const bwIdx = cohorts.cohorts.findIndex((c) => c.highlight);
  const cmpIdx = cohorts.cohorts.findIndex((c) => c.id === compareId);

  const curve = useMemo(() => {
    const bw = cohortCurve(bwIdx, filters);
    const cmp = cmpIdx >= 0 ? cohortCurve(cmpIdx, filters) : null;
    return bw.map((p, i) => ({
      day: p.day,
      bw: p.cm3Margin * 100,
      cmp: cmp ? cmp[i].cm3Margin * 100 : null,
      bwCm3: p.cm3,
      bwReturn: p.returnRate * 100,
    }));
  }, [bwIdx, cmpIdx, filters]);

  const day0 = curve[0];
  const dayEnd = curve[curve.length - 1];
  const decay = day0.bw - dayEnd.bw;

  const cohortRows = cohorts.cohorts.map((c, i) => {
    const points = cohortCurve(i, filters);
    return {
      label: c.label,
      highlight: c.highlight,
      d0: points[0],
      d14: points[14],
      d30: points[30],
      d60: points[points.length - 1],
    };
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Shopify vs. Realität"
        insight={
          <>
            Die Black-Week-2025-Kohorte startet mit{" "}
            <strong className="text-foreground font-semibold">{pct(day0.bw / 100)}</strong>{" "}
            CM3-Marge und landet 60 Tage später bei{" "}
            <strong className="text-foreground font-semibold">{pct(dayEnd.bw / 100)}</strong> – ein
            Margenverfall von{" "}
            <strong className="text-foreground font-semibold">{ppAbs(decay / 100)}</strong>, der im
            Standardreport erst in den Folgemonaten auftaucht.
          </>
        }
      />

      <FilterBar />

      {/* ─── Die Erklärung in drei Sätzen ──────────────────────────────── */}
      <Card className="mb-6 px-5 py-5">
        <h2 className="mb-2 text-[13px] font-semibold">Worum es geht, in drei Sätzen</h2>
        <ol className="text-muted-foreground max-w-3xl list-decimal space-y-1.5 pl-4 text-[13px] leading-relaxed">
          <li>
            Der Standardreport im Shop-Backend bucht eine Erstattung an dem Tag, an dem sie
            ausgeführt wird – nicht an dem Tag, an dem die Bestellung eingegangen ist.
          </li>
          <li>
            Zwischen Bestellung und Erstattung liegen im Schnitt rund zwei Wochen, bei Einzelfällen
            bis zu {REFUND_WINDOW_DAYS} Tage. Nach einem Sales Event sind die Umsätze also schon
            gebucht, die zugehörigen Retouren aber noch nicht.
          </li>
          <li>
            Ergebnis: Der Monat des Sales Events sieht zu gut aus, der Folgemonat zu schlecht – und
            beide Monate führen zu falschen Entscheidungen über Rabatthöhe und Ad-Spend.
          </li>
        </ol>
      </Card>

      {/* ─── Netto-Umsatz: beide Sichten ───────────────────────────────── */}
      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Netto-Umsatz je Monat"
            subtitle="Gleiche Bestellungen, unterschiedliche Zuordnung der Erstattungen."
            action={
              <Legend
                items={[
                  { label: "nach Bestell-Kohorte", color: C.real },
                  { label: "nach Erstattungsdatum", color: C.reported, dashed: true },
                ]}
              />
            }
          />
          <div className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthly} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="month" {...AXIS} interval="preserveStartEnd" minTickGap={18} />
                <YAxis
                  {...AXIS}
                  width={62}
                  tickFormatter={(v: number) => eurCompact(v).replace(" €", "")}
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TooltipCard
                        title={String(label)}
                        rows={[
                          {
                            label: "nach Bestell-Kohorte",
                            value: eur(Number(payload[0].payload.netReal)),
                            color: C.real,
                          },
                          {
                            label: "nach Erstattungsdatum",
                            value: eur(Number(payload[0].payload.netReported)),
                            color: C.reported,
                            dashed: true,
                          },
                        ]}
                        note={`Differenz ${eurDelta(
                          Number(payload[0].payload.netReported) -
                            Number(payload[0].payload.netReal),
                        )}`}
                      />
                    ) : null
                  }
                />
                <Line
                  type="monotone"
                  dataKey="netReported"
                  stroke={C.reported}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="netReal"
                  stroke={C.real}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="CM3-Marge je Monat"
            subtitle="In Prozent vom Netto-Umsatz. Hier wird der Timing-Effekt am deutlichsten."
            action={
              <Legend
                items={[
                  { label: "nach Bestell-Kohorte", color: C.real },
                  { label: "nach Erstattungsdatum", color: C.reported, dashed: true },
                ]}
              />
            }
          />
          <div className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthly} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="month" {...AXIS} interval="preserveStartEnd" minTickGap={18} />
                <YAxis {...AXIS} width={44} tickFormatter={(v: number) => `${v.toFixed(0)} %`} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TooltipCard
                        title={String(label)}
                        rows={[
                          {
                            label: "nach Bestell-Kohorte",
                            value: pct(Number(payload[0].payload.marginReal) / 100),
                            color: C.real,
                          },
                          {
                            label: "nach Erstattungsdatum",
                            value: pct(Number(payload[0].payload.marginReported) / 100),
                            color: C.reported,
                            dashed: true,
                          },
                        ]}
                        note={`Differenz ${pp(
                          (Number(payload[0].payload.marginReported) -
                            Number(payload[0].payload.marginReal)) /
                            100,
                        )}`}
                      />
                    ) : null
                  }
                />
                <Line
                  type="monotone"
                  dataKey="marginReported"
                  stroke={C.reported}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="marginReal"
                  stroke={C.real}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ─── Tagesreihe ────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader
          title="Erstattungen je Tag rund um die Black Week 2025"
          subtitle="Dieselben Erstattungen, einmal am Tag der Bestellung und einmal am Tag der Auszahlung gebucht. Der Abstand zwischen den Kurven ist der Verzug."
          action={
            <Legend
              items={[
                { label: "nach Bestelldatum", color: C.real },
                { label: "nach Erstattungsdatum", color: C.reported, dashed: true },
              ]}
            />
          }

          info={
            <>
              Die rosa Kurve springt mit den Bestellungen der Black Week nach oben. Die graue Kurve
              folgt mit Verzug und erreicht ihren Höhepunkt erst Mitte Dezember – zu einem
              Zeitpunkt, an dem im Report längst ein neuer Monat läuft.
            </>
          }
        />
        <div className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={daily} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
              <CartesianGrid {...GRID} />
              <ReferenceArea
                x1={BLACK_WEEK_2025.start}
                x2={BLACK_WEEK_2025.end}
                fill={C.realSoft}
                fillOpacity={0.9}
                ifOverflow="extendDomain"
                label={{ value: "Black Week", position: "insideTop", fontSize: 10, fill: C.axis }}
              />
              <XAxis
                dataKey="date"
                {...AXIS}
                interval="preserveStartEnd"
                minTickGap={40}
                tickFormatter={(v: string) => dayLabel(v)}
              />
              <YAxis
                {...AXIS}
                width={62}
                tickFormatter={(v: number) => eurCompact(v).replace(" €", "")}
              />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      title={dateLabel(String(payload[0].payload.date))}
                      rows={[
                        {
                          label: "Erstattungen dieser Bestellungen",
                          value: eur(Number(payload[0].payload.cohort)),
                          color: C.real,
                        },
                        {
                          label: "heute ausgeführte Erstattungen",
                          value: eur(Number(payload[0].payload.reported)),
                          color: C.reported,
                          dashed: true,
                        },
                      ]}
                    />
                  ) : null
                }
              />
              <Line
                type="monotone"
                dataKey="reported"
                stroke={C.reported}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="cohort"
                stroke={C.real}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ─── Kohortenverlauf ───────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader
          title={`CM3-Marge der Black-Week-2025-Kohorte über ${REFUND_WINDOW_DAYS} Tage`}
          subtitle={`Alle Bestellungen vom ${dateLabel(BLACK_WEEK_2025.start)} bis ${dateLabel(
            BLACK_WEEK_2025.end,
          )}, verfolgt bis zur letzten Erstattung.`}
          action={
            <div className="flex items-center gap-3">
              <select
                value={compareId}
                onChange={(e) => setCompareId(e.target.value)}
                className="border-border bg-card rounded-md border px-2 py-1 text-[12px]"
                aria-label="Vergleichskohorte"
              >
                {cohorts.cohorts
                  .filter((c) => !c.highlight)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      Vergleich: {c.label}
                    </option>
                  ))}
              </select>
            </div>
          }

          info={
            <>
              Am Bestelltag sieht jede Kohorte gut aus – es ist noch nichts zurückgekommen. Der
              Unterschied ist die Fallhöhe: die Black-Week-Kohorte verliert {ppAbs(decay / 100)},
              weil Rabatt und Retourenquote gleichzeitig hoch sind.
              <br />
              <br />
              Wichtige Einschränkung: Der Kohorte wird der gesamte Ad-Spend des Aktionsfensters
              angelastet. Ein Teil davon gewinnt Kunden, die später wiederkommen – diese Folgekäufe
              zählt die Rechnung nicht mit. Die Black Week steht hier also bewusst streng da. Für
              die Budgetentscheidung wäre die Gegenrechnung der Wiederkaufrate der nächste Schritt.
            </>
          }
        />
        <div className="px-2 pb-2">
          <Legend
            className="px-3 pb-2"
            items={[
              { label: "Black Week 2025", color: C.real },
              {
                label: cohorts.cohorts[cmpIdx]?.label ?? "Vergleich",
                color: C.neutral,
                dashed: true,
              },
            ]}
          />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={curve} margin={{ top: 8, right: 24, bottom: 4, left: 8 }}>
              <CartesianGrid {...GRID} />
              <XAxis
                dataKey="day"
                {...AXIS}
                tickFormatter={(v: number) => `T+${v}`}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis {...AXIS} width={48} tickFormatter={(v: number) => `${v.toFixed(0)} %`} />
              <ReferenceLine y={0} stroke={C.axis} strokeWidth={1} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <TooltipCard
                      title={`${payload[0].payload.day} Tage nach Bestellung`}
                      rows={[
                        {
                          label: "Black Week 2025",
                          value: pct(Number(payload[0].payload.bw) / 100),
                          color: C.real,
                        },
                        ...(payload[0].payload.cmp !== null
                          ? [
                              {
                                label: cohorts.cohorts[cmpIdx]?.label ?? "Vergleich",
                                value: pct(Number(payload[0].payload.cmp) / 100),
                                color: C.neutral,
                                dashed: true,
                              },
                            ]
                          : []),
                        {
                          label: "CM3 absolut",
                          value: eur(Number(payload[0].payload.bwCm3)),
                          muted: true,
                        },
                        {
                          label: "Retourenquote bis hier",
                          value: pct(Number(payload[0].payload.bwReturn) / 100),
                          muted: true,
                        },
                      ]}
                    />
                  ) : null
                }
              />
              <Line
                type="monotone"
                dataKey="cmp"
                stroke={C.neutral}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
                connectNulls
                activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="bw"
                stroke={C.real}
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ─── Kohortentabelle ───────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Kohorten im Vergleich"
          subtitle="CM3-Marge zum jeweiligen Stichtag nach Bestellung. Die letzte Spalte ist der Margenverlust, der im Standardreport erst später sichtbar wird."
        />
        <DataTable columns={cohortColumns} rows={cohortRows} />
      </Card>
    </div>
  );
}

interface CohortRow {
  label: string;
  highlight: boolean;
  d0: { cm3Margin: number; netRevenue: number };
  d14: { cm3Margin: number };
  d30: { cm3Margin: number };
  d60: { cm3Margin: number; cm3: number };
}

const cohortColumns: Column<CohortRow>[] = [
  {
    key: "label",
    header: "Kohorte",
    render: (r) => (
      <span className={r.highlight ? "text-accent-strong font-semibold" : "font-medium"}>
        {r.label}
      </span>
    ),
  },
  { key: "t0", header: "T+0", align: "right", render: (r) => pct(r.d0.cm3Margin) },
  { key: "t14", header: "T+14", align: "right", render: (r) => pct(r.d14.cm3Margin) },
  { key: "t30", header: "T+30", align: "right", render: (r) => pct(r.d30.cm3Margin) },
  { key: "t60", header: "T+60 (final)", align: "right", render: (r) => pct(r.d60.cm3Margin) },
  {
    key: "cm3",
    header: "CM3 final",
    align: "right",
    render: (r) => eurCompact(r.d60.cm3),
  },
  {
    key: "decay",
    header: "Verfall",
    align: "right",
    render: (r) => <span className="text-negative">{pp(r.d60.cm3Margin - r.d0.cm3Margin)}</span>,
  },
];
