import { cn } from "@/lib/utils";

/**
 * Jede Seite beginnt mit einer Zeile Kernaussage – erst die Erkenntnis,
 * dann die Charts.
 */
export function PageHeader({
  title,
  insight,
  children,
  className,
}: {
  title: string;
  insight: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">{title}</h1>
      <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground">
        {insight}
      </p>
      {children}
    </div>
  );
}
