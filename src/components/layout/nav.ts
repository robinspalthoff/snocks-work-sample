import {
  BadgeEuro,
  CalendarRange,
  GitCompareArrows,
  House,
  LayoutDashboard,
  Megaphone,
  Scale,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: typeof LayoutDashboard;
  group: NavGroup;
}

export const NAV_GROUPS = ["Start", "Analyse", "Planung", "Grundlagen"] as const;
export type NavGroup = (typeof NAV_GROUPS)[number];

/** Gruppen ohne sichtbare Überschrift – „Start“ steht für sich. */
export const SILENT_GROUPS: NavGroup[] = ["Start"];

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", short: "Home", icon: House, group: "Start" },
  {
    href: "/overview",
    label: "Overview",
    short: "Overview",
    icon: LayoutDashboard,
    group: "Analyse",
  },
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
  { href: "/soll-ist", label: "Soll-Ist", short: "Soll-Ist", icon: Scale, group: "Planung" },
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

export const PROFILE = {
  name: "Robin Spalthoff",
  role: "Strategy & Finance Operations",
  /** Zielt auf das GIF – das kleine Osterei hinter „Upgrade Now". */
  upgrade:
    "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjdkMzQ2Z2sxMHFudW5keDRqbmE1MnFxY29yN2ExcGt3NDU2aDdlayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/clnORRzuaBV7rNisCP/giphy.gif",
  photo: "/assets/robin.jpg",
  linkedin: "https://www.linkedin.com/in/robinspalthoff/",
  github: "https://github.com/robinspalthoff/",
  repo: "https://github.com/robinspalthoff/snocks-work-sample",
} as const;
