"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, C, GRID, TooltipCard } from "./chart-kit";
import { eur, eurCompact, pct } from "@/lib/format";

export interface WaterfallStep {
  label: string;
  /** Betrag: positiv = Aufbau, negativ = Abzug. Bei Zwischensummen der Saldo. */
  value: number;
  kind: "total" | "subtotal" | "deduction" | "highlight";
  note?: string;
}

interface Bucket {
  label: string;
  base: number;
  bar: number;
  value: number;
  kind: WaterfallStep["kind"];
  share: number;
  note?: string;
}

/**
 * Wasserfall der Deckungsbeitragsrechnung. Zwischensummen stehen auf der
 * Nulllinie, Abzüge hängen am laufenden Saldo – so sieht man sofort,
 * welcher Kostenblock wie viel Marge kostet.
 */
export function Waterfall({
  steps,
  reference,
  height = 340,
}: {
  steps: WaterfallStep[];
  /** Bezugsgröße für die Prozentangabe, in der Regel der Netto-Umsatz. */
  reference: number;
  height?: number;
}) {
  const buckets: Bucket[] = [];
  let running = 0;
  for (const s of steps) {
    if (s.kind === "deduction") {
      const from = running;
      running += s.value;
      buckets.push({
        label: s.label,
        base: Math.min(from, running),
        bar: Math.abs(s.value),
        value: s.value,
        kind: s.kind,
        share: reference ? s.value / reference : 0,
        note: s.note,
      });
    } else {
      running = s.value;
      buckets.push({
        label: s.label,
        base: Math.min(0, s.value),
        bar: Math.abs(s.value),
        value: s.value,
        kind: s.kind,
        share: reference ? s.value / reference : 0,
        note: s.note,
      });
    }
  }

  const colorOf = (kind: WaterfallStep["kind"]) =>
    kind === "highlight" ? C.real : kind === "deduction" ? C.neutralSoft : C.reported;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={buckets} margin={{ top: 12, right: 12, bottom: 48, left: 8 }}>
        <CartesianGrid {...GRID} />
        <XAxis
          dataKey="label"
          {...AXIS}
          interval={0}
          angle={-38}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 10, fill: C.axis }}
        />
        <YAxis
          {...AXIS}
          width={62}
          tickFormatter={(v: number) => eurCompact(v).replace(" €", "")}
        />
        <ReferenceLine y={0} stroke={C.axis} />
        <Tooltip
          cursor={{ fill: "rgba(26,26,26,0.03)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const b = payload[0].payload as Bucket;
            return (
              <TooltipCard
                title={b.label}
                rows={[
                  { label: b.kind === "deduction" ? "Abzug" : "Saldo", value: eur(b.value) },
                  { label: "in % vom Netto-Umsatz", value: pct(b.share), muted: true },
                ]}
                note={b.note}
              />
            );
          }}
        />
        <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="bar" stackId="w" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {buckets.map((b, i) => (
            <Cell key={i} fill={colorOf(b.kind)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
