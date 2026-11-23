"use client";

import { useCallback, useMemo, useState } from "react";
import { BRANDS, CHANNELS, FOOTER_NOTE, MARKETS } from "@/config/assumptions";
import { FilterContext, defaultFilters, type FilterState } from "@/lib/filters";
import { months } from "@/data/datasets";
import { MobileBrandBar, MobileNav, Sidebar } from "./sidebar";

const DIMENSION_VALUES = {
  brands: BRANDS as readonly string[],
  channels: CHANNELS as readonly string[],
  markets: MARKETS as readonly string[],
} as const;

const SIDEBAR_WIDTH = 256;
const SIDEBAR_WIDTH_COLLAPSED = 72;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => defaultFilters(months));

  const setPeriod = useCallback((from: string, to: string, presetId: string | null = null) => {
    setFilters((f) => ({ ...f, from, to, presetId }));
  }, []);

  /**
   * Auswahllogik einer Dimension.
   *
   * Aus dem Zustand „Alle“ heraus bedeutet ein Klick: zeige NUR diesen Wert.
   * Das ist die Erwartung, wenn jemand auf eine Marke klickt. Erst danach
   * verhält sich die Leiste als Mehrfachauswahl – weitere Klicks nehmen
   * Werte dazu oder heraus. Eine leere Auswahl wäre inhaltsleer und fällt
   * deshalb auf „Alle“ zurück.
   */
  const toggle = useCallback((dimension: "brands" | "channels" | "markets", value: string) => {
    setFilters((f) => {
      const all = DIMENSION_VALUES[dimension];
      const current = f[dimension] as string[];
      const isAll = current.length === all.length;

      let next: string[];
      if (isAll) {
        next = [value];
      } else if (current.includes(value)) {
        next = current.filter((v) => v !== value);
      } else {
        next = all.filter((v) => current.includes(v) || v === value);
      }

      return { ...f, [dimension]: next.length ? next : [...all] } as FilterState;
    });
  }, []);

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

  const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  return (
    <FilterContext.Provider value={value}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} width={width} />

      <div
        className="shell-main flex min-h-screen flex-col transition-[padding] duration-200"
        style={{ "--sidebar-pad": `${width}px` } as React.CSSProperties}
      >
        <MobileBrandBar />
        <MobileNav />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>

        <footer className="text-subtle-foreground px-4 py-5 text-[11px] sm:px-6 lg:px-10">
          {FOOTER_NOTE}
        </footer>
      </div>
    </FilterContext.Provider>
  );
}
