"use client";

import { createContext, useContext } from "react";
import { BRANDS, CHANNELS, MARKETS } from "@/config/assumptions";
import type { Filters } from "@/lib/kpi";

export interface PeriodPreset {
  id: string;
  label: string;
  from: string;
  to: string;
  hint?: string;
}

/**
 * Der Zeitraumfilter arbeitet auf Monatsebene. Das ist im Controlling die
 * natürliche Granularität (Periodenabschluss) und hält die ausgelieferten
 * Datenmengen klein. Tagesauflösung gibt es dort, wo sie etwas aussagt:
 * in den Sales-Event-Fenstern auf der Seite „Shopify vs. Realität“.
 */
export function buildPresets(months: string[]): PeriodPreset[] {
  const first = months[0];
  const last = months[months.length - 1];
  const last12 = months[Math.max(0, months.length - 12)];
  return [
    { id: "all", label: "Gesamtzeitraum", from: first, to: last, hint: "Jan 25 – Nov 26" },
    { id: "ytd2026", label: "2026 YTD", from: "2026-01", to: last, hint: "Jan – Nov 26" },
    { id: "last12", label: "Letzte 12 Monate", from: last12, to: last },
    { id: "fy2025", label: "Geschäftsjahr 2025", from: "2025-01", to: "2025-12" },
    {
      id: "q4-2025",
      label: "Q4 2025",
      from: "2025-10",
      to: "2025-12",
      hint: "Black Week + Nachlauf",
    },
    {
      id: "bw2025",
      label: "Nov + Dez 2025",
      from: "2025-11",
      to: "2025-12",
      hint: "Black Week 2025",
    },
  ];
}

export interface FilterState extends Filters {
  presetId: string | null;
}

export interface FilterContextValue {
  filters: FilterState;
  setPeriod: (from: string, to: string, presetId?: string | null) => void;
  toggle: (dimension: "brands" | "channels" | "markets", value: string) => void;
  setAll: (dimension: "brands" | "channels" | "markets") => void;
  reset: () => void;
  isDefault: boolean;
}

export const FilterContext = createContext<FilterContextValue | null>(null);

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters muss innerhalb von <FilterProvider> benutzt werden");
  return ctx;
}

export function defaultFilters(months: string[]): FilterState {
  return {
    presetId: "all",
    from: months[0],
    to: months[months.length - 1],
    brands: [...BRANDS],
    channels: [...CHANNELS],
    markets: [...MARKETS],
  };
}

/** Kurzbeschreibung der aktiven Auswahl für Überschriften und Fußnoten. */
export function describeFilters(f: FilterState): string {
  const parts: string[] = [];
  if (f.brands.length < BRANDS.length) parts.push(f.brands.join(", "));
  if (f.channels.length < CHANNELS.length) parts.push(f.channels.join(", "));
  if (f.markets.length < MARKETS.length) parts.push(f.markets.join(", "));
  return parts.length ? parts.join(" · ") : "Alle Marken, Kanäle und Märkte";
}
