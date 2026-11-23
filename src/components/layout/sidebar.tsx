"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Sparkles, TreePalm } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, NAV_ITEMS, PROFILE, SILENT_GROUPS } from "./nav";

/**
 * Sidebar und Hauptfenster teilen sich denselben Hintergrund; getrennt wird
 * nur durch die Linie rechts. Die Leiste ist fixiert und scrollt nicht mit,
 * der Einklapp-Schalter sitzt als kleines Icon auf genau dieser Linie.
 */
export function Sidebar({
  collapsed,
  onToggle,
  width,
}: {
  collapsed: boolean;
  onToggle: () => void;
  width: number;
}) {
  const pathname = usePathname();

  return (
    <aside
      style={{ width }}
      className="border-border bg-background fixed inset-y-0 left-0 z-30 hidden flex-col border-r transition-[width] duration-200 lg:flex"
    >
      <Logo collapsed={collapsed} />

      <nav className="scrollbar-slim flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          if (!items.length) return null;
          const silent = SILENT_GROUPS.includes(group);
          return (
            <div key={group} className={silent ? "mb-2" : "mb-5"}>
              {!collapsed && !silent && (
                <p className="text-subtle-foreground mb-1.5 px-3 text-[10px] font-semibold tracking-[0.14em] uppercase">
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
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors",
                          active
                            ? "text-nav-active bg-white font-semibold shadow-[0_1px_2px_rgba(12,18,21,0.05)]"
                            : "text-nav-idle hover:text-foreground hover:bg-white/60",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.1 : 1.7} />
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

      <ProfileCard collapsed={collapsed} />

      {/* Einklappen: kleines Icon auf der Trennlinie, nicht im Inhalt. */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Navigation ausklappen" : "Navigation einklappen"}
        title={collapsed ? "Navigation ausklappen" : "Navigation einklappen"}
        className="border-border text-subtle-foreground hover:text-foreground absolute top-[50%] -right-3 z-40 grid size-6 place-items-center rounded-full border bg-white shadow-[0_1px_3px_rgba(12,18,21,0.1)] transition-colors"
      >
        {collapsed ? (
          <PanelLeftOpen className="size-3.5" />
        ) : (
          <PanelLeftClose className="size-3.5" />
        )}
      </button>
    </aside>
  );
}

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex h-16 shrink-0 items-center gap-2.5 px-5",
        collapsed && "justify-center px-0",
      )}
    >
      <TreePalm className="text-foreground size-6 shrink-0" strokeWidth={1.9} />
      {!collapsed && (
        <span className="min-w-0 text-[13px] leading-tight">
          <span className="block font-bold tracking-[0.1em]">WORK SAMPLE</span>
          <span className="text-subtle-foreground block text-[11.5px]">
            Built for <span className="text-muted-foreground font-bold">SNOCKS</span>
          </span>
        </span>
      )}
    </Link>
  );
}

function ProfileCard({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="flex shrink-0 justify-center px-3 pb-4">
        <span className="relative">
          <Image
            src={PROFILE.photo}
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-full object-cover"
          />
          <StatusDot />
        </span>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-3 pb-4">
      <div className="profile-card rounded-2xl p-3">
        <div className="flex items-center gap-2.5">
          <span className="relative shrink-0">
            <Image
              src={PROFILE.photo}
              alt=""
              width={38}
              height={38}
              priority
              className="size-[38px] rounded-full object-cover"
            />
            <StatusDot />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold">{PROFILE.name}</span>
            <span className="text-muted-foreground block truncate text-[11px]">{PROFILE.role}</span>
          </span>
        </div>

        {/* Führt bewusst nicht zum Lebenslauf. */}
        <a
          href={PROFILE.upgrade}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-btn mt-3 h-11 w-full justify-center py-0 pr-4 pl-4 text-[13px] font-medium text-[#2b2f31]"
        >
          <span className="absolute top-1/2 left-1.5 grid size-8 shrink-0 -translate-y-1/2 place-items-center rounded-full bg-[#2b2f31] shadow-[0_0_6px_rgba(0,0,0,0.28)]">
            <Sparkles className="size-4 text-white" strokeWidth={2} />
          </span>
          Upgrade Now
        </a>
      </div>
    </div>
  );
}

/** Grüner Punkt am Avatar – „gerade erreichbar". */
function StatusDot() {
  return (
    <span
      aria-hidden
      className="absolute right-0 bottom-0 size-[11px] rounded-full border-2 border-white bg-[#22c55e]"
    />
  );
}

/** Mobile Navigation: horizontal scrollbare Chips unter dem Logo. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="border-border flex scrollbar-none gap-1.5 overflow-x-auto border-b px-4 py-2.5 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[12px] whitespace-nowrap transition-colors",
              active
                ? "border-nav-active bg-nav-active font-medium text-white"
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

/** Schmale Kopfzeile nur für Mobile – ersetzt die entfallene Header-Leiste. */
export function MobileBrandBar() {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-4 lg:hidden">
      <TreePalm className="text-foreground size-5" strokeWidth={1.9} />
      <span className="text-[12px] leading-tight">
        <span className="font-bold tracking-[0.1em]">WORK SAMPLE</span>
        <span className="text-muted-foreground">
          {" "}
          · Built for <span className="text-muted-foreground font-bold">SNOCKS</span>
        </span>
      </span>
    </div>
  );
}
