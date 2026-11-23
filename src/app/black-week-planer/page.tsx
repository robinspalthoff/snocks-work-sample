"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, C, GRID, TooltipCard } from "@/components/charts/chart-kit";
import { FilterBar } from "@/components/filters/filter-bar";
import { Card, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { BLACK_WEEK_2025, BLACK_WEEK_2026 } from "@/config/assumptions";
import { cubeMonth } from "@/data/datasets";
import { useFilters } from "@/lib/filters";
import { dateLabel, eur, eurCompact, eurDelta, int, pct, ppAbs, ratio } from "@/lib/format";
import { cohortCmAt } from "@/lib/cohort";
import { aggregate, computeCm, type Filters } from "@/lib/kpi";
import {
  breakEvenDiscount,
  buildBaseline,
  runScenario,
  type PlannerInputs,
} from "@/lib/black-week-model";

/** Wachstumsfaktor 2026 vs. 2025 aus den Ist-Daten (Jan–Okt im Vergleich). */
function growthFactor(f: Filters): number {
  const a = computeCm(aggregate(cubeMonth, { ...f, from: "2025-01", to: "2025-10" }), "cohort");
  const b = computeCm(aggregate(cubeMonth, { ...f, from: "2026-01", to: "2026-10" }), "cohort");
  return a.netRevenue > 0 ? b.netRevenue / a.netRevenue : 1;
}

export default function BlackWeekPlannerPage() {
  const { filters } = useFilters();

  const baseline = useMemo(() => {
    const actual = cohortCmAt(0, 60, filters);
    return buildBaseline(actual, growthFactor(filters));
  }, [filters]);

  // Solange nichts geregelt wurde, folgt die Eingabe der Vorbelegung aus den
  // Ist-Daten – ein Filterwechsel aktualisiert sie dann automatisch mit.
  const [custom, setCustom] = useState<PlannerInputs | null>(null);
  const inputs = custom ?? baseline.inputs2025;
  const touched = custom !== null;

  const set = (patch: Partial<PlannerInputs>) => setCustom({ ...inputs, ...patch });

  const base = runScenario(baseline, inputs);
  const best = runScenario(baseline, {
    discountRate: Math.max(0, inputs.discountRate - 0.03),
    volumeUplift: inputs.volumeUplift * 1.25,
    returnRate: Math.max(0.01, inputs.returnRate - 0.03),
    adSpend: inputs.adSpend * 0.9,
  });
  const worst = runScenario(baseline, {
    discountRate: inputs.discountRate + 0.04,
    volumeUplift: inputs.volumeUplift * 0.75,
    returnRate: inputs.returnRate + 0.05,
    adSpend: inputs.adSpend * 1.15,
  });

  const breakEven = breakEvenDiscount(baseline, inputs);

  const sensitivity = useMemo(() => {
    const out: { discount: number; cm3: number }[] = [];
    for (let d = 0; d <= 0.6001; d += 0.01) {
      out.push({
        discount: Math.round(d * 1000) / 10,
        cm3: runScenario(baseline, { ...inputs, discountRate: d }).cm3,
      });
    }
    return out;
  }, [baseline, inputs]);

  // ─── Easter Egg: Break-even überschritten ────────────────────────────
  const [achievement, setAchievement] = useState(false);
  const prevPositive = useRef<boolean | null>(null);
  useEffect(() => {
    const positive = base.cm3 > 0;
    if (prevPositive.current === false && positive) {
      setAchievement(true);
      const t = setTimeout(() => setAchievement(false), 4200);
      return () => clearTimeout(t);
    }
    prevPositive.current = positive;
  }, [base.cm3]);

  const actual = baseline.actual2025;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Black Week Planer 2026"
        insight={
          breakEven !== null ? (
            <>
              Mit den Vorjahreswerten liegt der CM3 der Black Week 2026 bei{" "}
              <strong className="text-foreground font-semibold">{eurCompact(base.cm3)}</strong>.
              Break-even wird bei einem Rabatt von{" "}
              <strong className="text-foreground font-semibold">{pct(breakEven)}</strong> erreicht –
              jeder Prozentpunkt darüber kostet bares Geld.
            </>
          ) : (
            <>
              Mit den aktuellen Einstellungen liegt der CM3 bei{" "}
              <strong className="text-foreground font-semibold">{eurCompact(base.cm3)}</strong>. In
              dieser Konstellation gibt es keinen Rabattsatz, der die Aktion ins Plus bringt –
              Ad-Spend oder Retourenquote müssen sich bewegen.
            </>
          )
        }
      />

      <FilterBar />

      <div className="mb-6 grid gap-4 xl:grid-cols-[360px_1fr]">
        {/* ─── Regler ─────────────────────────────────────────────────── */}
        <Card className="h-fit">
          <CardHeader
            title="Stellschrauben"
            subtitle={`Aktionsfenster ${dateLabel(BLACK_WEEK_2026.start)} – ${dateLabel(
              BLACK_WEEK_2026.end,
            )}`}
            action={
              touched && (
                <button
                  type="button"
                  onClick={() => setCustom(null)}
                  className="text-muted-foreground hover:text-accent-strong flex items-center gap-1.5 text-[12px]"
                >
                  <RotateCcw className="size-3.5" />
                  Vorjahr
                </button>
              )
            }

            info={
              <>
                Vorbelegt mit der Black Week 2025 ({dateLabel(BLACK_WEEK_2025.start)} –{" "}
                {dateLabel(BLACK_WEEK_2025.end)}), hochgerechnet mit dem Wachstum{" "}
                {pct(baseline.growthFactor - 1)} aus den Ist-Daten Jan–Okt. Rabatt und Absatz sind
                bewusst getrennt regelbar – die Preiselastizität ist die Annahme, über die man im
                Planungsmeeting streiten sollte.
              </>
            }
          />
          <div className="space-y-5 px-5 pb-5">
            <Slider
              label="Rabatt"
              value={inputs.discountRate}
              min={0}
              max={0.6}
              step={0.005}
              format={(v) => pct(v)}
              baselineValue={baseline.inputs2025.discountRate}
              onChange={(v) => set({ discountRate: v })}
            />
            <Slider
              label="Absatz-Uplift"
              value={inputs.volumeUplift}
              min={0}
              max={5}
              step={0.05}
              format={(v) => `+${Math.round(v * 100)} %`}
              baselineValue={baseline.inputs2025.volumeUplift}
              onChange={(v) => set({ volumeUplift: v })}
            />
            <Slider
              label="Retourenquote"
              value={inputs.returnRate}
              min={0.02}
              max={0.45}
              step={0.005}
              format={(v) => pct(v)}
              baselineValue={baseline.inputs2025.returnRate}
              onChange={(v) => set({ returnRate: v })}
            />
            <Slider
              label="Ad-Spend"
              value={inputs.adSpend}
              min={0}
              max={Math.max(1, baseline.inputs2025.adSpend * 2.5)}
              step={10_000}
              format={(v) => eurCompact(v)}
              baselineValue={baseline.inputs2025.adSpend}
              onChange={(v) => set({ adSpend: v })}
            />
          </div>
        </Card>

        {/* ─── Ergebnis ───────────────────────────────────────────────── */}
        <div>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="Netto-Umsatz"
              value={eurCompact(base.netRevenue)}
              secondary={`${int(base.orders)} Bestellungen`}
            />
            <KpiCard
              label="CM2"
              value={eurCompact(base.cm2)}
              secondary={pct(base.cm2 / Math.max(1, base.netRevenue))}
            />
            <KpiCard
              label="CM3"
              value={eurCompact(base.cm3)}
              secondary={pct(base.cm3Margin)}
              delta={`${eurDelta(base.cm3 - actual.cm3)} vs. 2025`}
              deltaTone={base.cm3 >= actual.cm3 ? "positive" : "negative"}
              accent
            />
            <KpiCard
              label="Break-even-Rabatt"
              value={breakEven !== null ? pct(breakEven) : "—"}
              secondary={
                breakEven !== null
                  ? `${ppAbs(breakEven - inputs.discountRate)} Puffer`
                  : "kein Rabatt rettet es"
              }
              deltaTone={
                breakEven !== null && breakEven > inputs.discountRate ? "positive" : "negative"
              }
            />
          </div>

          <Card>
            <CardHeader
              title="CM3 in Abhängigkeit vom Rabattsatz"
              subtitle="Alle anderen Regler bleiben stehen. Der Punkt ist die aktuelle Einstellung, die Nulllinie der Break-even."
            />
            <div className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={sensitivity} margin={{ top: 8, right: 20, bottom: 4, left: 8 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis
                    dataKey="discount"
                    {...AXIS}
                    tickFormatter={(v: number) => `${v} %`}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    {...AXIS}
                    width={62}
                    tickFormatter={(v: number) => eurCompact(v).replace(" €", "")}
                  />
                  <ReferenceLine y={0} stroke={C.axis} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <TooltipCard
                          title={`${payload[0].payload.discount} % Rabatt`}
                          rows={[
                            {
                              label: "CM3",
                              value: eur(Number(payload[0].payload.cm3)),
                              color: C.real,
                            },
                          ]}
                        />
                      ) : null
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="cm3"
                    stroke={C.real}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ReferenceDot
                    x={Math.round(inputs.discountRate * 1000) / 10}
                    y={base.cm3}
                    r={5}
                    fill={C.real}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Szenarien ─────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader
          title="Base, Best und Worst nebeneinander"
          subtitle="Best: 3 pp weniger Rabatt, 25 % mehr Absatz, 3 pp weniger Retouren, 10 % weniger Spend. Worst: 4 pp mehr Rabatt, 25 % weniger Absatz, 5 pp mehr Retouren, 15 % mehr Spend."

          info={
            <>
              Zum Vergleich die tatsächliche Black Week 2025 nach allen Retouren:{" "}
              {eurCompact(actual.netRevenue)} Netto-Umsatz, {eurCompact(actual.cm3)} CM3 (
              {pct(actual.cm3Margin)}), Retourenquote {pct(actual.returnRate)}.
            </>
          }
        />
        <div className="bg-border grid gap-px md:grid-cols-3">
          {(
            [
              ["Worst Case", worst, false],
              ["Base Case", base, true],
              ["Best Case", best, false],
            ] as const
          ).map(([label, s, highlight]) => (
            <div
              key={label}
              className={highlight ? "bg-accent-soft/40 px-5 py-4" : "bg-card px-5 py-4"}
            >
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                {label}
              </p>
              <p
                className="tnum mt-2 text-[26px] leading-none font-semibold"
                style={{ color: s.cm3 < 0 ? C.negative : highlight ? C.real : undefined }}
              >
                {eurCompact(s.cm3)}
              </p>
              <p className="tnum text-muted-foreground mt-1 text-[12px]">
                {pct(s.cm3Margin)} CM3-Marge
              </p>
              <dl className="mt-3 space-y-1 text-[12px]">
                <Row label="Netto-Umsatz" value={eurCompact(s.netRevenue)} />
                <Row label="Bestellungen" value={int(s.orders)} />
                <Row label="CM2" value={eurCompact(s.cm2)} />
                <Row label="Ad-Spend" value={eurCompact(s.marketing)} />
                <Row label="MER" value={ratio(s.mer)} />
                <Row label="POAS" value={ratio(s.poas)} />
              </dl>
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Easter Egg ────────────────────────────────────────────────── */}
      {achievement && (
        <div
          role="status"
          className="animate-toast-in border-accent/40 bg-card fixed right-5 bottom-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-[0_10px_40px_rgba(26,26,26,0.15)]"
        >
          <span className="bg-accent-soft grid size-9 place-items-center rounded-lg">
            <Trophy className="text-accent-strong size-4" />
          </span>
          <span className="text-[12.5px]">
            <strong className="block font-semibold">Achievement unlocked</strong>
            <span className="text-muted-foreground">Break-even gefunden</span>
          </span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tnum font-medium">{value}</dd>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  baselineValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  baselineValue: number;
  onChange: (v: number) => void;
}) {
  const changed = Math.abs(value - baselineValue) > step / 2;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-[12px] font-medium">{label}</label>
        <span
          className="tnum text-[13px] font-semibold"
          style={{ color: changed ? C.real : undefined }}
        >
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#cc5b8b]"
        aria-label={label}
      />
      <p className="text-subtle-foreground mt-1 text-[10.5px]">Vorjahr: {format(baselineValue)}</p>
    </div>
  );
}
