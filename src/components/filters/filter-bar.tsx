"use client";

import { Check, ChevronDown, RotateCcw } from "lucide-react";
import {
  BRANDS,
  BRAND_ASSUMPTIONS,
  CHANNELS,
  CHANNEL_ASSUMPTIONS,
  MARKET_ASSUMPTIONS,
  MARKETS,
  type Brand,
  type Channel,
  type Market,
} from "@/config/assumptions";
import { months } from "@/data/datasets";
import { useFilters } from "@/lib/filters";
import { monthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Popover } from "@/components/ui/popover";
import { BrandDot, ChannelMark, MarketFlag } from "./dimension-marks";
import { MonthRangePicker } from "./month-range-picker";

type Dimension = "brands" | "channels" | "markets";

/**
 * Eine Zeile, vier Auswahlfelder. Die frühere Chip-Wand hat die halbe
 * Seite gefüllt, bevor die erste Zahl sichtbar war; hier steht die
 * aktuelle Auswahl im Feld und der Rest liegt im Dropdown.
 */
export function FilterBar({ className }: { className?: string }) {
  const { filters, setPeriod, toggle, setAll, reset, isDefault } = useFilters();

  return (
    <div className={cn("mb-6 flex flex-wrap items-center gap-2", className)}>
      {/* ─── Zeitraum ──────────────────────────────────────────────────── */}
      <Popover
        panelClassName="p-0"
        trigger={({ open, toggle: t }) => (
          <TriggerButton
            label="Zeitraum"
            open={open}
            onClick={t}
            value={`${monthLabel(filters.from)} – ${monthLabel(filters.to)}`}
          />
        )}
      >
        {({ close }) => (
          <MonthRangePicker
            months={months}
            from={filters.from}
            to={filters.to}
            presetId={filters.presetId}
            onSelect={setPeriod}
            onClose={close}
          />
        )}
      </Popover>

      {/* ─── Marke ─────────────────────────────────────────────────────── */}
      <DimensionSelect
        label="Marke"
        dimension="brands"
        all={[...BRANDS]}
        selected={filters.brands}
        onToggle={toggle}
        onAll={setAll}
        renderMark={(v) => <BrandDot brand={v as Brand} />}
        renderHint={(v) => BRAND_ASSUMPTIONS[v as Brand].category}
      />

      {/* ─── Kanal ─────────────────────────────────────────────────────── */}
      <DimensionSelect
        label="Kanal"
        dimension="channels"
        all={[...CHANNELS]}
        selected={filters.channels}
        onToggle={toggle}
        onAll={setAll}
        renderMark={(v) => <ChannelMark channel={v as Channel} />}
        renderHint={(v) => {
          const fee = CHANNEL_ASSUMPTIONS[v as Channel].marketplaceFeeRate;
          return fee > 0 ? `${Math.round(fee * 100)} % Provision` : "eigener Shop";
        }}
      />

      {/* ─── Markt ─────────────────────────────────────────────────────── */}
      <DimensionSelect
        label="Markt"
        dimension="markets"
        all={[...MARKETS]}
        selected={filters.markets}
        onToggle={toggle}
        onAll={setAll}
        renderMark={(v) => <MarketFlag market={v as Market} />}
        renderHint={(v) => MARKET_ASSUMPTIONS[v as Market].label}
        align="end"
      />

      {!isDefault && (
        <button
          type="button"
          onClick={reset}
          className="text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] transition-colors"
        >
          <RotateCcw className="size-3.5" />
          Zurücksetzen
        </button>
      )}
    </div>
  );
}

function DimensionSelect({
  label,
  dimension,
  all,
  selected,
  onToggle,
  onAll,
  renderMark,
  renderHint,
  align = "start",
}: {
  label: string;
  dimension: Dimension;
  all: string[];
  selected: string[];
  onToggle: (d: Dimension, v: string) => void;
  onAll: (d: Dimension) => void;
  renderMark: (value: string) => React.ReactNode;
  renderHint?: (value: string) => string;
  /** Die letzte Auswahl rechts ausrichten, damit sie nicht aus dem Bild läuft. */
  align?: "start" | "end";
}) {
  const allActive = selected.length === all.length;
  const value = allActive
    ? "Alle"
    : selected.length === 1
      ? selected[0]
      : `${selected.length} von ${all.length}`;

  return (
    <Popover
      align={align}
      panelClassName="min-w-[232px]"
      trigger={({ open, toggle: t }) => (
        <TriggerButton
          label={label}
          value={value}
          open={open}
          onClick={t}
          marks={allActive ? [] : selected.slice(0, 3).map(renderMark)}
          muted={allActive}
        />
      )}
    >
      {() => (
        <ul className="space-y-0.5">
          <li>
            <OptionRow active={allActive} onClick={() => onAll(dimension)} label="Alle" bold />
          </li>
          <li aria-hidden className="border-border my-1 border-t" />
          {all.map((v) => (
            <li key={v}>
              <OptionRow
                active={!allActive && selected.includes(v)}
                onClick={() => onToggle(dimension, v)}
                label={v}
                hint={renderHint?.(v)}
                mark={renderMark(v)}
              />
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}

function OptionRow({
  active,
  onClick,
  label,
  hint,
  mark,
  bold,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  mark?: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60",
      )}
    >
      {mark && <span className="flex w-[18px] shrink-0 justify-center">{mark}</span>}
      <span className={cn("flex-1 truncate", (active || bold) && "text-foreground font-medium")}>
        {label}
      </span>
      {hint && <span className="text-subtle-foreground shrink-0 text-[11px]">{hint}</span>}
      <Check className={cn("size-3.5 shrink-0", active ? "opacity-100" : "opacity-0")} />
    </button>
  );
}

function TriggerButton({
  label,
  value,
  open,
  onClick,
  marks = [],
  muted,
}: {
  label: string;
  value: string;
  open: boolean;
  onClick: () => void;
  marks?: React.ReactNode[];
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={cn(
        "bg-card flex items-center gap-2 rounded-full border py-1.5 pr-2.5 pl-3 text-[12.5px] transition-colors",
        open ? "border-foreground" : "border-border hover:border-border-strong",
      )}
    >
      <span className="text-subtle-foreground">{label}</span>
      {marks.length > 0 && (
        <span className="flex items-center gap-1">
          {marks.map((m, i) => (
            <span key={i} className="flex items-center">
              {m}
            </span>
          ))}
        </span>
      )}
      <span className={cn("font-medium", muted ? "text-muted-foreground" : "text-foreground")}>
        {value}
      </span>
      <ChevronDown
        className={cn(
          "text-subtle-foreground size-3.5 shrink-0 transition-transform",
          open && "rotate-180",
        )}
      />
    </button>
  );
}
