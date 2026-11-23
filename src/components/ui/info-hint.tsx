"use client";

import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Erklärtext hinter einem Info-Icon.
 *
 * Die Oberfläche soll zeigen, nicht erklären. Alles, was Kontext ist –
 * Annahmen, Rechenwege, Lesehilfen – liegt hier und erscheint erst, wenn
 * jemand danach sucht. Reagiert auf Hover und auf Tastaturfokus.
 */
export function InfoHint({
  children,
  label = "Erläuterung anzeigen",
  align = "end",
  width = 300,
  className,
}: {
  children: React.ReactNode;
  label?: string;
  align?: "start" | "end";
  width?: number;
  className?: string;
}) {
  return (
    <span className={cn("group/info relative inline-flex", className)}>
      <button
        type="button"
        aria-label={label}
        className="text-subtle-foreground hover:text-foreground focus-visible:text-foreground grid size-5 place-items-center rounded-full transition-colors focus-visible:outline-none"
      >
        <Info className="size-[15px]" strokeWidth={1.9} />
      </button>
      <span
        role="tooltip"
        style={{ width }}
        className={cn(
          "border-border bg-card text-muted-foreground pointer-events-none invisible absolute top-[calc(100%+6px)] z-50 rounded-xl border px-3.5 py-3 text-left text-[12px] leading-relaxed font-normal opacity-0 shadow-[0_8px_30px_rgba(12,18,21,0.12)] transition-opacity duration-150",
          "group-focus-within/info:visible group-focus-within/info:opacity-100 group-hover/info:visible group-hover/info:opacity-100",
          align === "end" ? "right-0" : "left-0",
        )}
      >
        {children}
      </span>
    </span>
  );
}
