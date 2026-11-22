"use client";

import { cn } from "@/lib/utils";

/**
 * Farbrollen der Charts.
 *
 * Pink trägt immer die Aussage („Realität“, also die Kohortensicht).
 * „Reported“ ist ein warmes Dunkelgrau UND gestrichelt – die Unterscheidung
 * hängt damit nicht allein an der Farbe. Die Markenpalette ist gegen
 * Farbfehlsichtigkeit und Kontrast geprüft.
 */
export const C = {
  real: "#cc5b8b",
  realSoft: "#f6e6ee",
  reported: "#5f5a52",
  neutral: "#8e887d",
  neutralSoft: "#b8b2a6",
  neutralFaint: "#d6d1c6",
  grid: "#e2ddd2",
  axis: "#908a80",
  positive: "#4f7a5b",
  negative: "#b4543f",
  warning: "#c08a2e",
  brands: {
    SNOCKS: "#06638c",
    OCEANSAPART: "#c8821a",
    femtis: "#2f9b78",
    "Les Lunes": "#8f63c8",
  } as Record<string, string>,
} as const;

export const AXIS = {
  tick: { fontSize: 11, fill: C.axis },
  stroke: C.grid,
  tickLine: false,
  axisLine: false,
} as const;

export const GRID = {
  stroke: C.grid,
  strokeDasharray: "2 4",
  vertical: false,
} as const;

// ─── Tooltip ────────────────────────────────────────────────────────────

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
  dashed?: boolean;
  muted?: boolean;
}

export function TooltipCard({
  title,
  rows,
  note,
}: {
  title: string;
  rows: TooltipRow[];
  note?: string;
}) {
  return (
    <div className="pointer-events-none rounded-lg border border-border bg-card px-3 py-2 shadow-[0_6px_24px_rgba(26,26,26,0.1)]">
      <p className="mb-1.5 text-[11px] font-semibold">{title}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-[11.5px]">
            {r.color && (
              <span
                aria-hidden
                className="inline-block h-0 w-3.5 shrink-0 rounded-full border-t-2"
                style={{
                  borderColor: r.color,
                  borderStyle: r.dashed ? "dashed" : "solid",
                }}
              />
            )}
            <span className={cn("text-muted-foreground", r.muted && "text-subtle-foreground")}>
              {r.label}
            </span>
            <span className="tnum ml-auto font-medium">{r.value}</span>
          </li>
        ))}
      </ul>
      {note && <p className="mt-1.5 text-[10.5px] text-subtle-foreground">{note}</p>}
    </div>
  );
}

// ─── Legende ────────────────────────────────────────────────────────────

export function Legend({
  items,
  className,
}: {
  items: { label: string; color: string; dashed?: boolean; swatch?: "line" | "box" }[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          {i.swatch === "box" ? (
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-sm"
              style={{ background: i.color }}
            />
          ) : (
            <span
              aria-hidden
              className="inline-block h-0 w-4 border-t-2"
              style={{ borderColor: i.color, borderStyle: i.dashed ? "dashed" : "solid" }}
            />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** Horizontaler Balken mit direkter Beschriftung – ersetzt kleine Charts. */
export function BarRow({
  label,
  value,
  share,
  color,
  negative,
}: {
  label: string;
  value: string;
  /** 0–1, Anteil der Maximalbreite. */
  share: number;
  color: string;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[108px] shrink-0 truncate text-[12px] text-muted-foreground">{label}</span>
      <span className="relative h-5 flex-1 overflow-hidden rounded-[3px] bg-muted">
        <span
          className="absolute inset-y-0 left-0 rounded-[3px]"
          style={{
            width: `${Math.max(1, Math.min(100, share * 100))}%`,
            background: negative ? C.negative : color,
          }}
        />
      </span>
      <span className="tnum w-[88px] shrink-0 text-right text-[12px] font-medium">{value}</span>
    </div>
  );
}
