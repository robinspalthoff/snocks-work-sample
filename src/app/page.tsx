import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeEuro, CalendarRange, GitCompareArrows } from "lucide-react";
import { GithubLogo, LinkedinLogo } from "@/components/brand/logos";
import { PROFILE } from "@/components/layout/nav";
import {
  BLACK_WEEK_2025,
  BRANDS,
  CHANNELS,
  MARKETS,
  REFUND_WINDOW_DAYS,
  TODAY,
} from "@/config/assumptions";
import { cohortMetricIdx, cohorts, meta } from "@/data/datasets";
import { computeCm, type ComboSums } from "@/lib/kpi";
import { dateLabel, eurCompact, pct, ppAbs } from "@/lib/format";

/**
 * Startseite: bewusst ruhig. Eine Aussage, drei Einstiege, rechts der
 * Rahmen zum Projekt. Alles Weitere liegt hinter der Navigation.
 *
 * Die Seite rechnet nur mit den kleinen Kohortendateien, nicht mit dem
 * vollen Monatswürfel – so bleibt der Einstieg leicht.
 */
function blackWeekMargins() {
  const idx = cohorts.cohorts.findIndex((c) => c.highlight);
  const spend = cohorts.spend[idx].reduce((a, b) => a + b, 0);

  const at = (share: number) => {
    const rows: ComboSums[] = cohorts.combos.map((combo, ci) => {
      const v = cohorts.data[idx][ci];
      return {
        combo,
        sums: {
          orders: v[cohortMetricIdx.orders],
          newOrders: v[cohortMetricIdx.newOrders],
          gross: v[cohortMetricIdx.gross],
          discount: v[cohortMetricIdx.discount],
          refundCohort: v[cohortMetricIdx.refundTotal] * share,
          refundReported: 0,
          returnedOrdersCohort: v[cohortMetricIdx.returnedOrdersTotal] * share,
          returnedOrdersReported: 0,
          cogsShipped: v[cohortMetricIdx.cogsShipped],
          cogsReturnedCohort: v[cohortMetricIdx.cogsReturnedTotal] * share,
          cogsReturnedReported: 0,
        },
      };
    });
    return computeCm(rows, "cohort", spend);
  };

  const start = at(0);
  const end = at(1);
  return {
    start: start.cm3Margin,
    end: end.cm3Margin,
    decay: start.cm3Margin - end.cm3Margin,
    cm3: end.cm3,
  };
}

const bw = blackWeekMargins();

const TILES = [
  {
    href: "/shopify-vs-realitaet",
    icon: GitCompareArrows,
    title: "Das Problem sehen",
    body: `Warum die Black-Week-Kohorte mit ${pct(bw.start)} Marge startet und bei ${pct(bw.end)} endet.`,
    cta: "Shopify vs. Realität",
  },
  {
    href: "/contribution-margin",
    icon: BadgeEuro,
    title: "Die Marge rechnen",
    body: "Vom Brutto-Umsatz zum CM3 – jeder Kostenblock einzeln, nachrechenbar.",
    cta: "Contribution Margin",
  },
  {
    href: "/black-week-planer",
    icon: CalendarRange,
    title: "Die nächste Aktion planen",
    body: "Rabatt, Absatz, Retouren und Ad-Spend gemeinsam rechnen statt in vier Tabellen.",
    cta: "Black Week 2026",
  },
];

export default function HomePage() {
  return (
    <div className="animate-fade-up mx-auto grid max-w-[1400px] gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      {/* ─── Begrüßung ──────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center px-2 py-10 text-center lg:py-16">
        <Starburst />

        <h1 className="mt-8 text-[40px] leading-[1.05] font-semibold tracking-tight sm:text-[52px]">
          Willkommen.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-[15px] leading-relaxed">
          Eine Arbeitsprobe zur Deckungsbeitragsrechnung im D2C-Handel. Sie zeigt, warum
          Standardreports nach einem Sales Event zu gut aussehen – und wie die Zahlen aussehen, wenn
          man Retouren der Bestellung zuordnet, zu der sie gehören.
        </p>

        <div className="mt-10 grid w-full gap-3 sm:grid-cols-3">
          {TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.href}
                href={tile.href}
                className="group card flex flex-col px-5 py-5 text-left transition-shadow hover:shadow-[0_4px_20px_rgba(12,18,21,0.07)]"
              >
                <Icon className="text-foreground size-5" strokeWidth={1.8} />
                <h2 className="mt-4 text-[14px] font-semibold">{tile.title}</h2>
                <p className="text-muted-foreground mt-1.5 flex-1 text-[12.5px] leading-relaxed">
                  {tile.body}
                </p>
                <span className="text-foreground mt-4 inline-flex items-center gap-1 text-[12px] font-medium">
                  {tile.cta}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/overview"
          className="text-muted-foreground hover:text-foreground mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
        >
          Oder direkt zu allen Kennzahlen im Overview
          <ArrowRight className="size-3.5" />
        </Link>
      </section>

      {/* ─── Rahmen zum Projekt ─────────────────────────────────────────── */}
      <aside className="flex flex-col gap-3">
        {/* Die Kernaussage steht oben und trägt ein umlaufendes Leuchten –
            sie ist der Grund, warum es diese Arbeitsprobe gibt. */}
        <div className="glow-card rounded-[var(--radius)]">
          <div className="card px-5 py-5">
            <h2 className="text-[13px] font-semibold">Die Kernaussage</h2>
            <p className="text-muted-foreground mt-2.5 text-[12.5px] leading-relaxed">
              Shopify bucht eine Retoure an dem Tag, an dem sie verarbeitet wird – nicht an dem der
              Bestellung. Die Black-Week-Kohorte {dateLabel(BLACK_WEEK_2025.start)} verliert dadurch
              über {REFUND_WINDOW_DAYS} Tage{" "}
              <strong className="text-foreground font-semibold">{ppAbs(bw.decay)}</strong> Marge,
              sichtbar erst im Folgemonat.
            </p>
            <Link
              href="/shopify-vs-realitaet"
              className="text-accent-strong mt-3 inline-flex items-center gap-1 text-[12px] font-medium hover:underline"
            >
              Beleg ansehen
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="card px-5 py-5">
          <div className="flex items-center gap-3">
            <Image
              src={PROFILE.photo}
              alt=""
              width={44}
              height={44}
              className="size-11 rounded-full object-cover"
            />
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold">{PROFILE.name}</span>
              <span className="text-muted-foreground block text-[12px]">{PROFILE.role}</span>
            </span>
          </div>
          <p className="text-muted-foreground mt-4 text-[12.5px] leading-relaxed">
            Amazon Operations, Start-up-Gründerteam, eigene Beratung: Ich kenne Zahlen vom Hallenboden und aus der Unternehmersicht. 
            Mit mir bekommt ihr keinen klassischen Controller, sondern jemanden, der Marge, Logistikkosten und KPIs versteht und die Auswertung gleich selbst baut.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <SmallLink href={PROFILE.linkedin} icon={<LinkedinLogo className="size-3.5" />}>
              LinkedIn
            </SmallLink>
            <SmallLink href={PROFILE.repo} icon={<GithubLogo className="size-3.5" />}>
              Quellcode
            </SmallLink>
            <Link
              href="/ueber-diese-arbeitsprobe"
              className="border-border text-muted-foreground hover:border-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors"
            >
              Mehr zur Arbeitsprobe
            </Link>
          </div>
        </div>

        <div className="card px-5 py-5">
          <h2 className="text-[13px] font-semibold">Der Datensatz</h2>
          <dl className="mt-3 space-y-2 text-[12.5px]">
            <Fact label="Datenstand" value={dateLabel(TODAY)} />
            <Fact label="Zeitraum" value={`${meta.months} Monate ab Jan 2025`} />
            <Fact label="Netto-Umsatz" value={eurCompact(meta.netRevenueTotal)} />
            <Fact label="Marken" value={BRANDS.join(", ")} compact />
            <Fact label="Kanäle" value={CHANNELS.join(", ")} compact />
            <Fact label="Märkte" value={MARKETS.join(", ")} compact />
            <Fact label="Retourenfenster" value={`${REFUND_WINDOW_DAYS} Tage`} />
          </dl>
          <p className="border-border text-subtle-foreground mt-4 border-t pt-3 text-[11.5px] leading-relaxed">
            Alle Zahlen sind synthetisch und stammen aus einem deterministischen Generator mit
            festem Seed. Keine echten Zahlen der SNOCKS GmbH.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Fact({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div
      className={compact ? "flex flex-col gap-0.5" : "flex items-baseline justify-between gap-4"}
    >
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className={compact ? "text-foreground text-[12px]" : "tnum font-medium"}>{value}</dd>
    </div>
  );
}

function SmallLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="border-border text-muted-foreground hover:border-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors"
    >
      {icon}
      {children}
      <ArrowUpRight className="size-3" />
    </a>
  );
}

/** Dekorative Marke – weich, zurückhaltend, ohne Aussage. */
function Starburst() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden className="overflow-visible">
      <defs>
        <radialGradient id="sb-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f2c7da" />
          <stop offset="32%" stopColor="#cc5b8b" stopOpacity="0.8" />
          <stop offset="68%" stopColor="#8f63c8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#06638c" stopOpacity="0.08" />
        </radialGradient>
        <filter id="sb-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Weicher Schein hinter dem Stern */}
      <path
        d="M70 6C70 41 99 70 134 70C99 70 70 99 70 134C70 99 41 70 6 70C41 70 70 41 70 6Z"
        fill="url(#sb-core)"
        filter="url(#sb-soft)"
        opacity="0.75"
      />
      {/* Der Stern selbst */}
      <path
        d="M70 6C70 41 99 70 134 70C99 70 70 99 70 134C70 99 41 70 6 70C41 70 70 41 70 6Z"
        fill="url(#sb-core)"
      />
    </svg>
  );
}
