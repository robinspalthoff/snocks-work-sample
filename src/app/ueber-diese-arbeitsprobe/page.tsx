import Link from "next/link";
import { ArrowUpRight, Code2, Link2, UserRound } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DATA_DISCLAIMER } from "@/config/assumptions";

const LINKS = {
  github: "https://github.com/robinspalthoff/",
  linkedin: "https://www.linkedin.com/in/robinspalthoff/",
  repo: "https://github.com/robinspalthoff/snocks-work-sample",
};

const NINETY_DAYS = [
  {
    phase: "Tag 1–30",
    title: "Eine Zahl, auf die sich alle einigen",
    body: "Ich würde zuerst die Deckungsbeitragslogik festschreiben: welche Kosten in CM1, CM2 und CM3 gehören, wie Retouren periodengerecht zugeordnet werden und was in Marketing hineinzählt. Eine Seite Definition, abgestimmt mit Finance, Marketing und Supply Chain – danach gibt es keine zwei Wahrheiten mehr in zwei Decks.",
  },
  {
    phase: "Tag 1–30",
    title: "Die Datenquellen sortieren",
    body: "Bestandsaufnahme, was aus Shopify, Amazon, Zalando, dem Fulfillment und den Ad-Plattformen bereits im Data Warehouse liegt und wo Brüche sind: fehlende Landed Cost, Marktplatz-Abrechnungen, die nicht zu den eigenen Bestelldaten passen, Erstattungen nach Periodenabschluss. Diese Lücken sind messbar – die Seite „Datenqualität“ in diesem Dashboard zeigt, wie ich sie sichtbar machen würde.",
  },
  {
    phase: "Tag 30–60",
    title: "Kohorten-Reporting produktiv stellen",
    body: "Das Modell aus dieser Arbeitsprobe auf echte Daten umstellen: Bestellungen und Erstattungen über die Order-ID verknüpfen, Retouren der Ursprungsbestellung zuordnen und für noch offene Kohorten eine Retouren-Rückstellung auf Basis der tatsächlichen Verzugsverteilung bilden. Das ist die Grundlage dafür, dass der Monatsabschluss nicht erst 60 Tage später stimmt.",
  },
  {
    phase: "Tag 30–60",
    title: "Marketing auf POAS umstellen",
    body: "ROAS bleibt die Steuerungsgröße der Plattformen, aber die Budgetentscheidung sollte am POAS hängen. Konkret: CM2 je attribuierter Bestellung je Kanal, wöchentlich, mit dem Marketing-Team gemeinsam gelesen. Kanäle mit hoher Rabatt- und Retourenaffinität fallen dabei sofort auf.",
  },
  {
    phase: "Tag 60–90",
    title: "Planung und Soll-Ist schließen",
    body: "Monatliches Soll-Ist mit Abweichungszerlegung in Preis, Menge, Mix und Retouren – damit eine Abweichung nicht nur benannt, sondern erklärt wird. Und rechtzeitig vor der nächsten Black Week ein Planungsmodell, das Rabatt, Absatz, Retouren und Ad-Spend gemeinsam rechnet, statt sie in vier Tabellen zu trennen.",
  },
];

export default function AboutPage() {
  return (
    <div className="animate-fade-up max-w-4xl">
      <PageHeader
        title="Über diese Arbeitsprobe"
        insight="Ich habe dieses Dashboard gebaut, weil sich eine Bewerbung als Financial Controller besser zeigen als beschreiben lässt."
      />

      <Card className="mb-6 px-5 py-5">
        <h2 className="text-[15px] font-semibold">Robin Spalthoff</h2>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          Ich arbeite an der Schnittstelle von Controlling und Technik: Ich denke in
          Deckungsbeiträgen und Periodenabgrenzung, baue die Auswertung aber selbst – statt sie zu
          beauftragen und auf den nächsten Sprint zu warten. Diese Arbeitsprobe ist der Versuch,
          genau das in zwei Minuten zeigbar zu machen.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ExternalLink href={LINKS.linkedin} icon={<Link2 className="size-3.5" />}>
            LinkedIn
          </ExternalLink>
          <ExternalLink href={LINKS.github} icon={<UserRound className="size-3.5" />}>
            GitHub
          </ExternalLink>
          <ExternalLink href={LINKS.repo} icon={<Code2 className="size-3.5" />}>
            Quellcode dieser Arbeitsprobe
          </ExternalLink>
        </div>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="px-5 py-5">
          <h2 className="text-[13px] font-semibold">Warum dieses Thema</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Der Standardreport eines Shopsystems bucht Erstattungen am Tag der Erstattung. Nach
            einem Sales Event sieht der Monat deshalb besser aus, als er war, und der Folgemonat
            schlechter. Wer auf dieser Basis über Rabatthöhe und Ad-Spend entscheidet, entscheidet
            mit einem systematischen Fehler. Für ein House of Brands mit mehreren Marken, Kanälen
            und Märkten summiert sich dieser Fehler – und er ist mit sauberer Zuordnung
            vollständig lösbar.
          </p>
        </Card>

        <Card className="px-5 py-5">
          <h2 className="text-[13px] font-semibold">Wie ich vorgegangen bin</h2>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
            <li>
              <strong className="font-medium text-foreground">Zeitaufwand:</strong> rund ein
              Arbeitstag, KI-gestützt. Fachliche Modellierung, Annahmen und Interpretation kommen
              von mir, die Umsetzung habe ich mit Claude Code deutlich beschleunigt.
            </li>
            <li>
              <strong className="font-medium text-foreground">Daten:</strong> ein
              deterministischer Generator mit festem Seed. Alle Annahmen stehen an einer Stelle im
              Code und werden im Dashboard angezeigt.
            </li>
            <li>
              <strong className="font-medium text-foreground">Technik:</strong> Next.js,
              TypeScript, Tailwind, Recharts. Kein Backend, keine Datenbank, keine Zugangsdaten –
              die Szenariorechnungen laufen im Browser.
            </li>
            <li>
              <strong className="font-medium text-foreground">Prinzip:</strong> eine einzige
              KPI-Logik im Code, die alle Seiten benutzen. Keine Zahl auf einer Seite, die auf
              einer anderen anders gerechnet wird.
            </li>
          </ul>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Was ich in den ersten 90 Tagen tun würde"
          subtitle="Konkret, in der Reihenfolge, in der es mir sinnvoll erscheint – und offen für die Realität, die ich noch nicht kenne."
        />
        <ol className="space-y-0 px-5 pb-5">
          {NINETY_DAYS.map((item, i) => (
            <li
              key={item.title}
              className="border-t border-border py-4 first:border-t-0 first:pt-0"
            >
              <div className="flex items-baseline gap-3">
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                  {item.phase}
                </span>
                <h3 className="text-[13.5px] font-semibold">
                  {i + 1}. {item.title}
                </h3>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="px-5 py-5">
        <h2 className="text-[13px] font-semibold">Hinweis zu den Daten</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{DATA_DISCLAIMER}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Markennamen werden ausschließlich genannt, um den Kontext der Bewerbung herzustellen.
          Diese Arbeitsprobe verwendet keine Logos, Schriften, Produktbilder oder sonstigen
          Gestaltungselemente der SNOCKS GmbH und steht in keiner Verbindung zu ihr. Die Seite ist
          über <code className="rounded bg-muted px-1 py-0.5 text-[11.5px]">noindex</code> von
          Suchmaschinen ausgenommen.
        </p>
        <p className="mt-3 text-[13px]">
          <Link href="/" className="font-medium text-accent-strong hover:underline">
            Zurück zum Overview
          </Link>
        </p>
      </Card>
    </div>
  );
}

function ExternalLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:border-accent hover:text-accent-strong"
    >
      {icon}
      {children}
      <ArrowUpRight className="size-3" />
    </a>
  );
}
