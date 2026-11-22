import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
        "flex flex-col gap-2 px-5 pt-5 pb-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6",
        className,
      )}>
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Dezente Fußnote in einer Karte – für Annahmen und Lesehilfen. */
export function CardNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-t border-border px-5 py-3 text-[11px] leading-relaxed text-subtle-foreground">
      {children}
    </p>
  );
}
