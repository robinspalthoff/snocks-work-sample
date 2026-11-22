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
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="tnum mt-2 text-[26px] leading-none font-semibold tracking-tight">{value}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        {secondary && <span className="tnum text-[12px] text-muted-foreground">{secondary}</span>}
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
      {hint && <p className="mt-2 text-[10.5px] leading-snug text-subtle-foreground">{hint}</p>}
    </div>
  );
}
