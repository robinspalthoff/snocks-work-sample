import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  secondary,
  delta,
  deltaTone = "neutral",
  hint,
  accent = false,
  className,
}: {
  label: string;
  value: string;
  secondary?: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  hint?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card flex flex-col justify-between px-4 py-3.5",
        accent && "border-accent/40 bg-accent-soft/40",
        className,
      )}
    >
      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="tnum mt-2 text-[21px] leading-none font-semibold tracking-tight sm:text-[26px]">
        {value}
      </p>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {secondary && <span className="tnum text-muted-foreground text-[12px]">{secondary}</span>}
        {delta && (
          <span
            className={cn(
              "tnum text-[12px] font-medium",
              deltaTone === "positive" && "text-positive",
              deltaTone === "negative" && "text-negative",
              deltaTone === "neutral" && "text-muted-foreground",
            )}
          >
            {delta}
          </span>
        )}
      </div>
      {hint && <p className="text-subtle-foreground mt-2 text-[10.5px] leading-snug">{hint}</p>}
    </div>
  );
}
