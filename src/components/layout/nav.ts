import {
  BadgeEuro,
  CalendarRange,
  GitCompareArrows,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Scale,
  UserRound,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: typeof LayoutDashboard;
  group: "Analyse" | "Planung" | "Grundlagen";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", short: "Overview", icon: LayoutDashboard, group: "Analyse" },
  {
    href: "/shopify-vs-realitaet",
    label: "Shopify vs. Realität",
    short: "Shopify vs. Realität",
    icon: GitCompareArrows,
    group: "Analyse",
  },
  {
    href: "/contribution-margin",
    label: "Contribution Margin",
    short: "Contribution Margin",
    icon: BadgeEuro,
    group: "Analyse",
  },
  {
    href: "/marketing-effizienz",
    label: "Marketing-Effizienz",
    short: "Marketing",
    icon: Megaphone,
    group: "Analyse",
  },
  {
    href: "/black-week-planer",
    label: "Black Week Planer 2026",
    short: "Black Week 2026",
    icon: CalendarRange,
    group: "Planung",
  },
  {
    href: "/soll-ist",
    label: "Soll-Ist",
    short: "Soll-Ist",
    icon: Scale,
    group: "Planung",
  },
  {
    href: "/datenqualitaet",
    label: "Datenqualität & KPI-Definitionen",
    short: "Datenqualität & KPIs",
    icon: ShieldCheck,
    group: "Grundlagen",
  },
  {
    href: "/ueber-diese-arbeitsprobe",
    label: "Über diese Arbeitsprobe",
    short: "Über diese Arbeitsprobe",
    icon: UserRound,
    group: "Grundlagen",
  },
];

export const NAV_GROUPS = ["Analyse", "Planung", "Grundlagen"] as const;
