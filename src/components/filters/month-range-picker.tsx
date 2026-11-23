"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { monthLabel } from "@/lib/format";
import { buildPresets, type PeriodPreset } from "@/lib/filters";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

/**
 * Zeitraumauswahl auf Monatsebene.
 *
 * Bewusst ein Monatsraster und kein Tageskalender: Der Datensatz ist auf
 * Monatsebene aggregiert, und im Controlling ist der Monat die
 * Periodengrenze. Ein Tageskalender würde eine Genauigkeit vorspiegeln,
 * die die Zahlen dahinter nicht haben.
 */
export function MonthRangePicker({
  months,
  from,
  to,
  presetId,
  onSelect,
  onClose,
}: {
  months: string[];
  from: string;
  to: string;
  presetId: string | null;
  onSelect: (from: string, to: string, presetId: string | null) => void;
  onClose: () => void;
}) {
  const presets = buildPresets(months);
  const [anchor, setAnchor] = useState<string | null>(null);

  const years = Array.from(new Set(months.map((m) => m.slice(0, 4))));
  const available = new Set(months);

  function handleMonth(key: string) {
    if (anchor === null) {
      setAnchor(key);
      onSelect(key, key, null);
      return;
    }
    const start = key < anchor ? key : anchor;
    const end = key < anchor ? anchor : key;
    setAnchor(null);
    onSelect(start, end, null);
    onClose();
  }

  function handlePreset(p: PeriodPreset) {
    setAnchor(null);
    onSelect(p.from, p.to, p.id);
    onClose();
  }

  return (
    <div className="w-[320px] p-1">
      <ul className="space-y-0.5">
        {presets.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => handlePreset(p)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition-colors",
                presetId === p.id
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="flex-1 truncate">{p.label}</span>
              {p.hint && (
                <span className="text-subtle-foreground shrink-0 text-[11px]">{p.hint}</span>
              )}
              {presetId === p.id && <Check className="size-3.5 shrink-0" />}
            </button>
          </li>
        ))}
      </ul>

      <div className="border-border mt-2 border-t px-2.5 pt-2.5">
        <p className="text-subtle-foreground text-[11px]">
          {anchor ? "Endmonat wählen" : "Eigener Zeitraum – Start- und Endmonat anklicken"}
        </p>
      </div>

      <div className="scrollbar-slim mt-1 max-h-[232px] overflow-y-auto px-1 pb-1">
        {years.map((year) => (
          <div key={year} className="mb-1.5">
            <p className="text-subtle-foreground px-1.5 py-1 text-[10.5px] font-semibold tracking-[0.1em]">
              {year}
            </p>
            <div className="grid grid-cols-4 gap-1">
              {MONTH_SHORT.map((label, i) => {
                const key = `${year}-${String(i + 1).padStart(2, "0")}`;
                const exists = available.has(key);
                const inRange = key >= from && key <= to;
                const isEdge = key === from || key === to;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!exists}
                    onClick={() => handleMonth(key)}
                    aria-pressed={inRange}
                    className={cn(
                      "rounded-md py-1.5 text-[11.5px] transition-colors",
                      !exists && "text-border-strong cursor-not-allowed",
                      exists && !inRange && "text-muted-foreground hover:bg-muted",
                      exists && inRange && !isEdge && "bg-accent-soft/70 text-foreground",
                      isEdge && exists && "bg-nav-active font-semibold text-white",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="border-border text-subtle-foreground border-t px-2.5 pt-2 pb-1 text-[11px]">
        Gewählt: {monthLabel(from)} – {monthLabel(to)}
      </p>
    </div>
  );
}
