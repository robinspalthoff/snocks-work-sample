/** Formatierung, durchgehend de-DE. Alle Beträge sind Netto-Euro. */

const eur0 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const eur2 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const num0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });

/** 1.234.568 € – für Tabellen und Achsen. */
export function eur(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return eur0.format(value);
}

/** 1.234.567,89 € – für Einzelbestellungen und Kostensätze. */
export function eurCents(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return eur2.format(value);
}

/** Kompakt für große KPI-Zahlen: 12,4 Mio €, 842 Tsd €, 940 €. */
export function eurCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}${fix(abs / 1_000_000, 1)} Mio €`;
  if (abs >= 10_000) return `${sign}${fix(abs / 1_000, 0)} Tsd €`;
  return `${sign}${fix(abs, 0)} €`;
}

/** Vorzeichenbehaftet, kompakt – für Deltas. */
export function eurDelta(value: number): string {
  const s = eurCompact(Math.abs(value));
  if (value > 0) return `+${s}`;
  if (value < 0) return `−${s}`;
  return s;
}

export function pct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${fix(value * 100, digits)} %`;
}

/** Prozentpunkte-Delta, z. B. „−2,4 pp“. */
export function pp(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  const s = `${fix(Math.abs(value) * 100, digits)} pp`;
  if (value > 0) return `+${s}`;
  if (value < 0) return `−${s}`;
  return s;
}

export function ratio(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return fix(value, digits);
}

export function int(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return num0.format(Math.round(value));
}

function fix(n: number, digits: number): string {
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const MONTHS = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

/** "2026-11-22" → "22. Nov 2026" */
export function dateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}. ${MONTHS[m - 1]} ${y}`;
}

/** "2026-11-22" → "22. Nov" */
export function dayLabel(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d}. ${MONTHS[m - 1]}`;
}

/** "2026-11" → "Nov 26" */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

/** Prozentpunkte ohne Vorzeichen – wenn der Text die Richtung schon sagt. */
export function ppAbs(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${fix(Math.abs(value) * 100, digits)} pp`;
}
