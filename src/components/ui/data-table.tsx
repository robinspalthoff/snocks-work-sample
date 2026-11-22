import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  width?: string;
  render: (row: T) => React.ReactNode;
  /** Kopfzeile mit Erläuterung. */
  title?: string;
}

export function DataTable<T>({
  columns,
  rows,
  footer,
  className,
  minWidth = 640,
}: {
  columns: Column<T>[];
  rows: T[];
  footer?: T;
  className?: string;
  /** Mindestbreite in px, bevor horizontal gescrollt wird. */
  minWidth?: number;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table
        className="w-full border-collapse text-[12.5px]"
        style={{ minWidth: `${minWidth}px` }}
      >
        <thead>
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th
                key={c.key}
                title={c.title}
                style={{ width: c.width }}
                className={cn(
                  "px-3 py-2 text-[10.5px] font-semibold tracking-[0.06em] text-subtle-foreground uppercase",
                  c.align === "right" ? "text-right" : "text-left",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-3 py-2.5",
                    c.align === "right" && "tnum text-right",
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn("px-3 py-2.5", c.align === "right" && "tnum text-right")}
                >
                  {c.render(footer)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
