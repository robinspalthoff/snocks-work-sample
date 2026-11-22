"use client";

import { useCallback, useMemo, useState } from "react";
import { BRANDS, CHANNELS, FOOTER_NOTE, MARKETS } from "@/config/assumptions";
import { FilterContext, defaultFilters, type FilterState } from "@/lib/filters";
import { months } from "@/data/datasets";
import { MobileNav, Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

const DIMENSION_VALUES = {
  brands: BRANDS as readonly string[],
  channels: CHANNELS as readonly string[],
  markets: MARKETS as readonly string[],
} as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => defaultFilters(months));

  const setPeriod = useCallback((from: string, to: string, presetId: string | null = null) => {
    setFilters((f) => ({ ...f, from, to, presetId }));
  }, []);

  const toggle = useCallback(
    (dimension: "brands" | "channels" | "markets", value: string) => {
      setFilters((f) => {
        const current = f[dimension] as string[];
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...DIMENSION_VALUES[dimension]].filter((v) => current.includes(v) || v === value);
        // Leere Auswahl wäre inhaltsleer – dann wieder auf „alle“.
        const resolved = next.length ? next : [...DIMENSION_VALUES[dimension]];
        return { ...f, [dimension]: resolved } as FilterState;
      });
    },
    [],
  );

  const setAll = useCallback((dimension: "brands" | "channels" | "markets") => {
    setFilters((f) => ({ ...f, [dimension]: [...DIMENSION_VALUES[dimension]] }) as FilterState);
  }, []);

  const reset = useCallback(() => setFilters(defaultFilters(months)), []);

  const isDefault =
    filters.brands.length === BRANDS.length &&
    filters.channels.length === CHANNELS.length &&
    filters.markets.length === MARKETS.length &&
    filters.from === months[0] &&
    filters.to === months[months.length - 1];

  const value = useMemo(
    () => ({ filters, setPeriod, toggle, setAll, reset, isDefault }),
    [filters, setPeriod, toggle, setAll, reset, isDefault],
  );

  return (
    <FilterContext.Provider value={value}>
      <div className="flex min-h-screen">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <MobileNav />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
          <footer className="border-t border-border px-4 py-4 text-[11px] text-subtle-foreground sm:px-6 lg:px-8">
            {FOOTER_NOTE}
          </footer>
        </div>
      </div>
    </FilterContext.Provider>
  );
}
