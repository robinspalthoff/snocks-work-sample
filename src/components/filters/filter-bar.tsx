"use client";

import { useMemo, useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { BRANDS, CHANNELS, MARKET_ASSUMPTIONS, MARKETS } from "@/config/assumptions";
import { buildPresets, useFilters } from "@/lib/filters";
import { months } from "@/data/datasets";
import { monthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FilterBar({ className }: { className?: string }) {
  const { filters, setPeriod, toggle, setAll, reset, isDefault } = useFilters();
  const presets = useMemo(() => buildPresets(months), []);
  const [customOpen, setCustomOpen] = useState(false);

  return (
    <div className={cn("card mb-6 px-4 py-3.5", className)}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <FilterGroup label="Zeitraum">
          <div className="flex flex-wrap items-center gap-1.5">
            {presets.map((p) => (
              <Chip
                key={p.id}
                active={filters.presetId === p.id}
                onClick={() => {
                  setPeriod(p.from, p.to, p.id);
                  setCustomOpen(false);
                }}
                title={p.hint}
              >
                {p.label}
              </Chip>
            ))}
            <button
              type="button"
              onClick={() => setCustomOpen((o) => !o)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                filters.presetId === null
                  ? "border-accent bg-accent-soft font-medium text-accent-strong"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {filters.presetId === null
                ? `${monthLabel(filters.from)} – ${monthLabel(filters.to)}`
                : "Eigener"}
              <ChevronDown className={cn("size-3 transition-transform", customOpen && "rotate-180")} />
            </button>
          </div>
        </FilterGroup>

        <FilterGroup label="Marke">
          <Chips
            values={[...BRANDS]}
            active={filters.brands}
            onToggle={(v) => toggle("brands", v)}
            onAll={() => setAll("brands")}
          />
        </FilterGroup>

        <FilterGroup label="Kanal">
          <Chips
            values={[...CHANNELS]}
            active={filters.channels}
            onToggle={(v) => toggle("channels", v)}
            onAll={() => setAll("channels")}
          />
        </FilterGroup>

        <FilterGroup label="Markt">
          <Chips
            values={[...MARKETS]}
            active={filters.markets}
            onToggle={(v) => toggle("markets", v)}
            onAll={() => setAll("markets")}
            titles={Object.fromEntries(MARKETS.map((m) => [m, MARKET_ASSUMPTIONS[m].label]))}
          />
        </FilterGroup>

        {!isDefault && (
          <button
            type="button"
            onClick={reset}
            className="ml-auto flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-accent-strong"
          >
            <RotateCcw className="size-3.5" />
            Filter zurücksetzen
          </button>
        )}
      </div>

      {customOpen && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <label className="text-[11px] text-muted-foreground">Von</label>
          <MonthSelect
            value={filters.from}
            options={months}
            onChange={(v) => setPeriod(v, v > filters.to ? v : filters.to, null)}
          />
          <label className="text-[11px] text-muted-foreground">Bis</label>
          <MonthSelect
            value={filters.to}
            options={months}
            onChange={(v) => setPeriod(v < filters.from ? v : filters.from, v, null)}
          />
          <span className="text-[11px] text-subtle-foreground">
            Monatsgenau – im Controlling die Periodengrenze.
          </span>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[10px] font-semibold tracking-[0.1em] text-subtle-foreground uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chips({
  values,
  active,
  onToggle,
  onAll,
  titles,
}: {
  values: string[];
  active: string[];
  onToggle: (v: string) => void;
  onAll: () => void;
  titles?: Record<string, string>;
}) {
  const allActive = active.length === values.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Chip active={allActive} onClick={onAll}>
        Alle
      </Chip>
      {values.map((v) => (
        <Chip
          key={v}
          active={!allActive && active.includes(v)}
          onClick={() => onToggle(v)}
          title={titles?.[v]}
        >
          {v}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[12px] whitespace-nowrap transition-colors",
        active
          ? "border-accent bg-accent-soft font-medium text-accent-strong"
          : "border-border text-muted-foreground hover:border-subtle-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function MonthSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-card px-2 py-1 text-[12px]"
    >
      {options.map((m) => (
        <option key={m} value={m}>
          {monthLabel(m)}
        </option>
      ))}
    </select>
  );
}
