"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, NAV_ITEMS } from "./nav";

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-card/60 transition-[width] duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-[252px]",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-sm font-bold text-white">
          CM
        </span>
        {!collapsed && (
          <span className="min-w-0 text-[13px] leading-tight font-semibold">
            Contribution Margin
            <span className="block text-[11px] font-normal text-muted-foreground">
              Cockpit · Built for SNOCKS
            </span>
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          return (
            <div key={group} className="mb-5">
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.12em] text-subtle-foreground uppercase">
                  {group}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                          active
                            ? "bg-accent-soft font-semibold text-accent-strong"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        {active && (
                          <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r bg-accent" />
                        )}
                        <Icon className="size-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                        {!collapsed && <span className="truncate">{item.short}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 border-t border-border px-4 py-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        aria-label={collapsed ? "Navigation ausklappen" : "Navigation einklappen"}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <>
            <PanelLeftClose className="size-4" />
            <span>Einklappen</span>
          </>
        )}
      </button>
    </aside>
  );
}

/** Mobile Navigation: horizontal scrollbare Chips unter dem Header. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="scrollbar-none flex gap-1.5 overflow-x-auto border-b border-border bg-card px-4 py-2.5 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[12px] whitespace-nowrap transition-colors",
              active
                ? "border-accent bg-accent-soft font-semibold text-accent-strong"
                : "border-border text-muted-foreground",
            )}
          >
            {item.short}
          </Link>
        );
      })}
    </nav>
  );
}
