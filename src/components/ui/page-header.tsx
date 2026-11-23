import { InfoHint } from "./info-hint";
import { cn } from "@/lib/utils";

/**
 * Jede Seite beginnt mit einer Zeile Kernaussage – erst die Erkenntnis,
 * dann die Charts. Zusatzkontext liegt hinter dem Info-Icon.
 */
export function PageHeader({
  title,
  insight,
  info,
  action,
  children,
  className,
}: {
  title: string;
  insight: React.ReactNode;
  info?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-[22px]">
            {title}
            {info && <InfoHint align="start">{info}</InfoHint>}
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-3xl text-[13.5px] leading-relaxed">
            {insight}
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}
