"use client";

import { dateLabel } from "@/lib/format";
import { TODAY } from "@/config/assumptions";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold tracking-tight">
            Built for SNOCKS <span className="text-subtle-foreground">·</span> Contribution
            Margin Cockpit
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Bewerbungs-Arbeitsprobe von Robin Spalthoff · alle Daten synthetisch
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-border px-2.5 py-1">
            Datenstand {dateLabel(TODAY)}
          </span>
          <span className="hidden rounded-full border border-border px-2.5 py-1 sm:inline">
            synthetische Daten
          </span>
        </div>
      </div>
    </header>
  );
}
