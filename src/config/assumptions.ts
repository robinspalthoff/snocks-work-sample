/**
 * Zentrale Annahmen der Arbeitsprobe.
 *
 * ALLE Werte sind synthetisch und plausibel geschätzt – es handelt sich
 * ausdrücklich NICHT um echte Zahlen der SNOCKS GmbH. Der Datengenerator
 * (`scripts/generate-data.ts`) liest ausschließlich aus dieser Datei, und
 * das Dashboard zeigt sie unter „Datenqualität & KPI-Definitionen“ an.
 * Eine Änderung hier ändert Daten und Dashboard konsistent.
 */

export const TODAY = "2026-11-22";
export const DATA_START = "2025-01-01";
export const DATA_END = TODAY;
export const RANDOM_SEED = 20261122;

/** Fenster, in dem Erstattungen eintreffen können (Tage nach Bestellung). */
export const REFUND_WINDOW_DAYS = 60;

// ─── Dimensionen ────────────────────────────────────────────────────────

export const BRANDS = ["SNOCKS", "OCEANSAPART", "femtis", "Les Lunes"] as const;
export type Brand = (typeof BRANDS)[number];

export const CHANNELS = ["Onlineshop", "Amazon", "Zalando"] as const;
export type Channel = (typeof CHANNELS)[number];

export const MARKETS = ["DE", "AT", "CH", "NL", "FR"] as const;
export type Market = (typeof MARKETS)[number];

export const MARKETING_CHANNELS = ["Meta", "Google", "TikTok", "Influencer"] as const;
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

// ─── Marken ─────────────────────────────────────────────────────────────

export interface BrandAssumption {
  /** Anteil am Netto-Umsatz der Gruppe. */
  revenueShare: number;
  /** Jahreswachstum 2026 vs. 2025. */
  growth2026: number;
  /** Landed Cost in % des Brutto-Umsatzes (vor Rabatt). */
  cogsRate: number;
  /** Wertbasierte Retourenquote im Normalgeschäft. */
  returnRate: number;
  /** Durchschnittlicher Bestellwert netto, Referenzkanal Onlineshop. */
  aovShop: number;
  /** Anteil Neukunden an allen Bestellungen. */
  newCustomerShare: number;
  /** Produktkategorie – nur zur Erläuterung im UI. */
  category: string;
  color: string;
}

export const BRAND_ASSUMPTIONS: Record<Brand, BrandAssumption> = {
  SNOCKS: {
    revenueShare: 0.55,
    growth2026: 0.12,
    cogsRate: 0.28,
    returnRate: 0.08,
    aovShop: 38,
    newCustomerShare: 0.42,
    category: "Socken & Basics",
    color: "var(--color-brand-snocks)",
  },
  OCEANSAPART: {
    revenueShare: 0.28,
    growth2026: 0.08,
    cogsRate: 0.34,
    returnRate: 0.29,
    aovShop: 72,
    newCustomerShare: 0.48,
    category: "Activewear",
    color: "var(--color-brand-oceansapart)",
  },
  femtis: {
    revenueShare: 0.09,
    growth2026: 0.26,
    cogsRate: 0.3,
    returnRate: 0.06,
    aovShop: 54,
    newCustomerShare: 0.55,
    category: "Periodenunterwäsche",
    color: "var(--color-brand-femtis)",
  },
  "Les Lunes": {
    revenueShare: 0.08,
    growth2026: 0.34,
    cogsRate: 0.32,
    returnRate: 0.19,
    aovShop: 89,
    newCustomerShare: 0.51,
    category: "Womenswear",
    color: "var(--color-brand-leslunes)",
  },
};

// ─── Kanäle ─────────────────────────────────────────────────────────────

export interface ChannelAssumption {
  revenueShare: number;
  /** Marktplatzprovision in % des Netto-Umsatzes. */
  marketplaceFeeRate: number;
  /** Payment-Gebühren in % des Netto-Umsatzes (nur eigener Shop). */
  paymentFeeRate: number;
  /** Aufschlag auf die Retourenquote in Prozentpunkten. */
  returnRateDelta: number;
  /** AOV-Faktor gegenüber dem Shop-AOV der Marke. */
  aovFactor: number;
  /** Marken, die auf diesem Kanal verkaufen. */
  brands: Brand[];
  markets: Market[];
  note: string;
}

export const CHANNEL_ASSUMPTIONS: Record<Channel, ChannelAssumption> = {
  Onlineshop: {
    revenueShare: 0.65,
    marketplaceFeeRate: 0,
    paymentFeeRate: 0.0216,
    returnRateDelta: 0,
    aovFactor: 1,
    brands: ["SNOCKS", "OCEANSAPART", "femtis", "Les Lunes"],
    markets: ["DE", "AT", "CH", "NL", "FR"],
    note: "Shopify-D2C-Shop. Payment-Gebühr als gewichteter Mix der Zahlarten.",
  },
  Amazon: {
    revenueShare: 0.22,
    marketplaceFeeRate: 0.15,
    paymentFeeRate: 0,
    returnRateDelta: 0.02,
    aovFactor: 0.74,
    brands: ["SNOCKS", "OCEANSAPART", "femtis"],
    markets: ["DE", "AT", "NL", "FR"],
    note: "Provision inkl. Payment. Kleinere Warenkörbe, leicht höhere Retouren.",
  },
  Zalando: {
    revenueShare: 0.13,
    marketplaceFeeRate: 0.23,
    paymentFeeRate: 0,
    returnRateDelta: 0.07,
    aovFactor: 1.18,
    brands: ["SNOCKS", "OCEANSAPART", "Les Lunes"],
    markets: ["DE", "AT", "NL", "FR"],
    note: "Höchste Provision und deutlich höhere Retourenquote (Fashion-Plattform).",
  },
};

/** Zahlarten-Mix im eigenen Shop – ergibt die Payment-Gebühr von 2,16 %. */
export const PAYMENT_MIX = [
  { method: "PayPal", share: 0.38, feeRate: 0.0249 },
  { method: "Kreditkarte", share: 0.24, feeRate: 0.016 },
  { method: "Klarna / Rechnung", share: 0.22, feeRate: 0.0299 },
  { method: "Apple Pay / Sofort", share: 0.16, feeRate: 0.012 },
] as const;

// ─── Märkte ─────────────────────────────────────────────────────────────

export interface MarketAssumption {
  revenueShare: number;
  /** Versandkosten pro Bestellung. */
  shippingCost: number;
  /** Aufschlag auf die Retourenquote in Prozentpunkten. */
  returnRateDelta: number;
  label: string;
}

export const MARKET_ASSUMPTIONS: Record<Market, MarketAssumption> = {
  DE: { revenueShare: 0.62, shippingCost: 3.2, returnRateDelta: 0, label: "Deutschland" },
  AT: { revenueShare: 0.09, shippingCost: 4.5, returnRateDelta: -0.005, label: "Österreich" },
  CH: { revenueShare: 0.07, shippingCost: 7.8, returnRateDelta: -0.015, label: "Schweiz" },
  NL: { revenueShare: 0.11, shippingCost: 4.1, returnRateDelta: 0.015, label: "Niederlande" },
  FR: { revenueShare: 0.11, shippingCost: 4.6, returnRateDelta: 0.02, label: "Frankreich" },
};

// ─── Stückkosten ────────────────────────────────────────────────────────

export const UNIT_COSTS = {
  /** Pick, Pack, Lagerkosten je Bestellung. */
  fulfillmentPerOrder: 2.1,
  /** Bearbeitung je retournierter Bestellung: Rücksendung, Prüfung, Wiedereinlagerung. */
  returnHandlingPerReturn: 4.8,
  /** Anteil der retournierten Ware, der nicht wieder verkäuflich ist. */
  returnWriteOffShare: 0.06,
} as const;

// ─── Marketing ──────────────────────────────────────────────────────────

export interface MarketingChannelAssumption {
  /** Anteil am gesamten Ad-Spend. */
  spendShare: number;
  /** Attribuierter Brutto-Umsatz je Euro Spend (plattformseitig gemeldet). */
  reportedRoas: number;
  /** Retourenquote der über diesen Kanal gewonnenen Bestellungen (absolut). */
  returnRate: number;
  /** Rabatt-Affinität: Faktor auf den Rabattsatz. */
  discountFactor: number;
  note: string;
}

export const MARKETING_ASSUMPTIONS: Record<MarketingChannel, MarketingChannelAssumption> = {
  Meta: {
    spendShare: 0.45,
    reportedRoas: 3.1,
    returnRate: 0.17,
    discountFactor: 1.05,
    note: "Volumenkanal. Solider ROAS, Retouren im Mittelfeld.",
  },
  Google: {
    spendShare: 0.32,
    reportedRoas: 5.2,
    returnRate: 0.11,
    discountFactor: 0.9,
    note: "Brand- und Shopping-Traffic. Hoher ROAS, geringe Retouren.",
  },
  TikTok: {
    spendShare: 0.13,
    reportedRoas: 2.6,
    returnRate: 0.31,
    discountFactor: 1.35,
    note: "Impulskäufe, hohe Rabatt-Affinität und mit Abstand die höchsten Retouren – der Kanal, der im ROAS akzeptabel und im POAS negativ aussieht.",
  },
  Influencer: {
    spendShare: 0.1,
    reportedRoas: 2.9,
    returnRate: 0.21,
    discountFactor: 1.15,
    note: "Pauschalen und Affiliate-Mix. Mittlerer ROAS, überdurchschnittliche Retouren.",
  },
};

/** Ziel-MER im Normalgeschäft (Netto-Umsatz je Euro Marketing-Spend). */
export const TARGET_MER = 5.4;

// ─── Rabatte & Sales Events ─────────────────────────────────────────────

/** Rabattsatz im Normalgeschäft (in % des Brutto-Umsatzes). */
export const BASE_DISCOUNT_RATE = 0.06;

export interface SalesEvent {
  id: string;
  label: string;
  start: string;
  end: string;
  /** Rabattsatz während des Events. */
  discountRate: number;
  /** Absatz-Uplift gegenüber dem Normalniveau. */
  volumeUplift: number;
  /** Relativer Aufschlag auf die Retourenquote. */
  returnRateUplift: number;
  /** Faktor auf den täglichen Ad-Spend. */
  spendFactor: number;
  isBlackWeek?: boolean;
}

export const SALES_EVENTS: SalesEvent[] = [
  { id: "winter-2025", label: "Winter Sale 2025", start: "2025-01-02", end: "2025-01-12", discountRate: 0.22, volumeUplift: 0.55, returnRateUplift: 0.2, spendFactor: 1.3 },
  { id: "easter-2025", label: "Oster-Aktion 2025", start: "2025-04-14", end: "2025-04-21", discountRate: 0.15, volumeUplift: 0.3, returnRateUplift: 0.12, spendFactor: 1.15 },
  { id: "summer-2025", label: "Summer Sale 2025", start: "2025-07-01", end: "2025-07-14", discountRate: 0.25, volumeUplift: 0.6, returnRateUplift: 0.22, spendFactor: 1.35 },
  { id: "singles-2025", label: "Singles Day 2025", start: "2025-11-11", end: "2025-11-11", discountRate: 0.2, volumeUplift: 0.9, returnRateUplift: 0.25, spendFactor: 1.45 },
  { id: "blackweek-2025", label: "Black Week 2025", start: "2025-11-24", end: "2025-12-01", discountRate: 0.28, volumeUplift: 2.4, returnRateUplift: 0.4, spendFactor: 1.6, isBlackWeek: true },
  { id: "xmas-2025", label: "Weihnachtsgeschäft 2025", start: "2025-12-08", end: "2025-12-20", discountRate: 0.08, volumeUplift: 0.7, returnRateUplift: 0.1, spendFactor: 1.4 },
  { id: "winter-2026", label: "Winter Sale 2026", start: "2026-01-02", end: "2026-01-12", discountRate: 0.23, volumeUplift: 0.58, returnRateUplift: 0.2, spendFactor: 1.3 },
  { id: "easter-2026", label: "Oster-Aktion 2026", start: "2026-04-03", end: "2026-04-10", discountRate: 0.15, volumeUplift: 0.32, returnRateUplift: 0.12, spendFactor: 1.15 },
  { id: "summer-2026", label: "Summer Sale 2026", start: "2026-07-01", end: "2026-07-14", discountRate: 0.26, volumeUplift: 0.62, returnRateUplift: 0.22, spendFactor: 1.35 },
  { id: "singles-2026", label: "Singles Day 2026", start: "2026-11-11", end: "2026-11-11", discountRate: 0.21, volumeUplift: 0.95, returnRateUplift: 0.25, spendFactor: 1.45 },
];

/** Der Planungsfall. Liegt nach TODAY und ist deshalb nicht in den Ist-Daten. */
export const BLACK_WEEK_2026 = {
  id: "blackweek-2026",
  label: "Black Week 2026",
  start: "2026-11-23",
  end: "2026-11-30",
  blackFriday: "2026-11-27",
  cyberMonday: "2026-11-30",
} as const;

export const BLACK_WEEK_2025 = SALES_EVENTS.find((e) => e.isBlackWeek)!;

// ─── Saisonalität & Rauschen ────────────────────────────────────────────

/** Monatsindex Jan–Dez, 1 = Jahresdurchschnitt. */
export const MONTH_SEASONALITY = [
  0.86, 0.82, 0.9, 0.95, 0.98, 0.94, 1.02, 0.93, 0.97, 1.05, 1.42, 1.16,
];

/** Wochentagsindex Mo–So. */
export const WEEKDAY_SEASONALITY = [1.08, 1.05, 1.02, 1.0, 0.95, 0.88, 1.02];

/** Tägliches Rauschen (Standardabweichung, multiplikativ). */
export const DAILY_NOISE_SD = 0.055;

/** Umsatzniveau 2025 (Netto, Gruppe) – Ankerwert für die Skalierung. */
export const NET_REVENUE_2025_TARGET = 94_000_000;

/**
 * Verteilung der Tage zwischen Bestellung und Erstattung.
 * Rechtsschiefe Verteilung mit Gipfel um Tag 12–16 und langem Ausläufer
 * bis Tag 60 – genau der Grund, warum Shopifys Report nach einem Sales
 * Event zunächst zu gut aussieht.
 */
export const REFUND_DELAY = {
  /** Lognormal: Median = e^mu ≈ 14 Tage. */
  mu: Math.log(14),
  sigma: 0.62,
  minDays: 2,
  maxDays: REFUND_WINDOW_DAYS,
} as const;

/** Anteil der Erstattungen, die Teilerstattungen sind (einzelne Positionen). */
export const PARTIAL_REFUND_SHARE = 0.27;
/** Erstatteter Anteil am Bestellwert bei einer Teilerstattung. */
export const PARTIAL_REFUND_RANGE = { min: 0.35, max: 0.7 } as const;

// ─── Planung (Soll-Ist) ─────────────────────────────────────────────────

/** Planabweichung: so viel optimistischer war der Plan je Monat. */
export const PLAN_OPTIMISM = 0.04;

// ─── UI-Metadaten ───────────────────────────────────────────────────────

export const DATA_DISCLAIMER =
  "Alle Zahlen in diesem Dashboard sind synthetisch und plausibel geschätzt. Sie stammen aus einem deterministischen Generator und sind keine echten Zahlen der SNOCKS GmbH.";

export const FOOTER_NOTE =
  "Bewerbungs-Arbeitsprobe von Robin Spalthoff · alle Daten synthetisch · nicht mit der SNOCKS GmbH verbunden";

/**
 * Markenspezifische Kanal-Affinität: Faktor auf das Produkt aus Marken-
 * und Kanalanteil. SNOCKS ist auf Amazon überproportional stark (Basics,
 * Suchnachfrage), OCEANSAPART auf Zalando (Fashion-Plattform).
 */
export const BRAND_CHANNEL_AFFINITY: Record<Brand, Partial<Record<Channel, number>>> = {
  SNOCKS: { Onlineshop: 1.0, Amazon: 1.35, Zalando: 0.8 },
  OCEANSAPART: { Onlineshop: 1.0, Amazon: 0.7, Zalando: 1.5 },
  femtis: { Onlineshop: 1.1, Amazon: 0.6 },
  "Les Lunes": { Onlineshop: 1.0, Zalando: 1.2 },
};

/** Kohorten, deren 60-Tage-Margenverlauf im Dashboard gezeigt wird. */
export const COHORT_WINDOWS = [
  { id: "blackweek-2025", label: "Black Week 2025", start: "2025-11-24", end: "2025-12-01", highlight: true },
  { id: "pre-blackweek-2025", label: "Nov 2025 vor Black Week", start: "2025-11-01", end: "2025-11-20", highlight: false },
  { id: "summer-2025", label: "Summer Sale 2025", start: "2025-07-01", end: "2025-07-14", highlight: false },
  { id: "normal-2025", label: "Normalgeschäft Sep 2025", start: "2025-09-01", end: "2025-09-30", highlight: false },
] as const;

/** Monate, die im Periodenabschluss bereits geschlossen sind. */
export const CLOSED_THROUGH = "2026-09-30";
