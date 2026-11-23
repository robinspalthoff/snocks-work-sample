import { InfoHint } from "./info-hint";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * Kartenkopf. Lange Erläuterungen gehören in `info` – sie erscheinen dann
 * hinter einem Info-Icon statt die Karte zu füllen. `subtitle` bleibt für
 * die eine Zeile, die beim Lesen des Charts wirklich hilft.
 */
export function CardHeader({
  title,
  subtitle,
  info,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  info?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-5 pt-5 pb-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 text-[13px] font-semibold tracking-tight">
          <span className="min-w-0">{title}</span>
          {info && <InfoHint align="start">{info}</InfoHint>}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground mt-0.5 text-[11.5px] leading-snug">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Dezente Fußnote in einer Karte. Nur noch für kurze Lesehilfen –
 * alles Längere gehört in `CardHeader info`.
 */
export function CardNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-border text-subtle-foreground border-t px-5 py-3 text-[11px] leading-relaxed">
      {children}
    </p>
  );
}
