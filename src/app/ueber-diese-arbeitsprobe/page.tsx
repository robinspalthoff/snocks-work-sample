import Link from "next/link";
import { ArrowUpRight, Code2 } from "lucide-react";
import { GithubLogo, LinkedinLogo } from "@/components/brand/logos";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DATA_DISCLAIMER } from "@/config/assumptions";

const LINKS = {
  github: "https://github.com/robinspalthoff/",
  linkedin: "https://www.linkedin.com/in/robinspalthoff/",
  repo: "https://github.com/robinspalthoff/snocks-work-sample",
};

/**
 * Bewusst Fragen statt eines 90-Tage-Plans: Ohne Kenntnis der
 * Systemlandschaft wäre jeder Plan geraten. Die Fragen zeigen, worauf
 * ich zuerst schauen würde – und warum.
 */
const FIRST_QUESTIONS = [
  {
    question: "Wie sind Retouren heute im Reporting verankert?",
    body: "Landen Erstattungen bei der Ursprungsbestellung oder am Erstattungsdatum? Gibt es für offene Kohorten eine Retouren-Rückstellung? Davon hängt ab, ob ein Monatsabschluss nach 30 Tagen belastbar ist oder erst nach 90.",
  },
  {
    question: "Welche Kostenarten liegen bereits je Bestellung vor?",
    body: "Landed Cost je SKU, Fulfillment, Versand je Markt, Payment-Gebühren, Marktplatzprovision: Was davon ist gepflegt, was wird geschätzt, was fehlt ganz? Ohne diese Schicht ist jeder CM2 eine Hausnummer mit Nachkommastellen.",
  },
  {
    question: "Woran hängt heute die Marketing-Entscheidung?",
    body: "Am ROAS aus den Plattformen oder an einem Deckungsbeitrag je Kanal? Und wer entscheidet im Zweifel – Marketing oder Finance? Die Antwort sagt mehr über die Organisation als über das Reporting.",
  },
  {
    question: "Wo endet das Data Warehouse und wo beginnt Excel?",
    body: "Jede manuelle Brücke zwischen System und Bericht ist beides: ein Kandidat für Automatisierung und ein Risiko im Abschluss. Ich würde sie zuerst sichtbar machen, bevor ich irgendetwas umbaue.",
  },
  {
    question: "Welche Entscheidung ist zuletzt an fehlenden Zahlen gescheitert?",
    body: "Die ehrlichste Frage von allen. Sie zeigt schneller als jedes Systemdiagramm, wo das Reporting wirklich weh tut – und womit man anfangen sollte.",
  },
];

export default function AboutPage() {
  return (
    <div className="animate-fade-up mx-auto max-w-4xl">
      <PageHeader
        title="Über diese Arbeitsprobe"
        insight="Ich habe dieses Dashboard gebaut, weil sich eine Bewerbung als Financial Controller besser zeigen als beschreiben lässt."
      />

      <Card className="mb-6 px-5 py-5">
        <h2 className="text-[15px] font-semibold">Robin Spalthoff</h2>
        <p className="text-muted-foreground mt-1 text-[12.5px]">
          Strategy &amp; Finance Operations
        </p>
        <p className="text-muted-foreground mt-3 max-w-2xl text-[13.5px] leading-relaxed">
          Acht Jahre zwischen Finanzprozess und Technik: Operations bei Amazon, danach als externe
          Finanzfunktion für international aufgestellte Shopify-Marken – Monatsabschluss,
          Umsatzsteuer und OSS, KPI-Reporting. Zuletzt die digitale Transformation bei Licus Finance
          und ein eigenes Venture-Studio für KI-Produkte. Ich bin kein klassischer Controller: Ich
          nehme Zahlen auseinander, bis die Logik dahinter stimmt, und baue die Auswertung dann
          selbst.
        </p>
        <p className="text-muted-foreground mt-3 max-w-2xl text-[13.5px] leading-relaxed">
          Ein Management-Dashboard gegen die Shopify-API – Netto-Umsatz nach Retouren, Rohertrag,
          Deckungsbeitrag, AOV, Retourenquote, Wiederkaufrate – habe ich schon einmal gebaut. Diese
          Arbeitsprobe ist dieselbe Frage, eine Stufe gründlicher gestellt.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ExternalLink href={LINKS.linkedin} icon={<LinkedinLogo className="size-3.5" />}>
            LinkedIn
          </ExternalLink>
          <ExternalLink href={LINKS.github} icon={<GithubLogo className="size-3.5" />}>
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
          <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed">
            Der Standardreport eines Shopsystems bucht Erstattungen am Tag der Erstattung. Nach
            einem Sales Event sieht der Monat deshalb besser aus, als er war, und der Folgemonat
            schlechter. Wer auf dieser Basis über Rabatthöhe und Ad-Spend entscheidet, entscheidet
            mit einem systematischen Fehler. Für ein House of Brands mit mehreren Marken, Kanälen
            und Märkten summiert sich dieser Fehler – und er ist mit sauberer Zuordnung vollständig
            lösbar.
          </p>
        </Card>

        <Card className="px-5 py-5">
          <h2 className="text-[13px] font-semibold">Wie ich vorgegangen bin</h2>
          <ul className="text-muted-foreground mt-2 space-y-1.5 text-[13px] leading-relaxed">
            <li>
              <strong className="text-foreground font-medium">Zeitaufwand:</strong> rund ein
              Arbeitstag, KI-gestützt. Fachliche Modellierung, Annahmen und Interpretation kommen
              von mir, die Umsetzung habe ich mit Claude Code deutlich beschleunigt.
            </li>
            <li>
              <strong className="text-foreground font-medium">Daten:</strong> ein deterministischer
              Generator mit festem Seed. Alle Annahmen stehen an einer Stelle im Code und werden im
              Dashboard angezeigt.
            </li>
            <li>
              <strong className="text-foreground font-medium">Technik:</strong> Next.js, TypeScript,
              Tailwind, Recharts. Kein Backend, keine Datenbank, keine Zugangsdaten – die
              Szenariorechnungen laufen im Browser.
            </li>
            <li>
              <strong className="text-foreground font-medium">Prinzip:</strong> eine einzige
              KPI-Logik im Code, die alle Seiten benutzen. Keine Zahl auf einer Seite, die auf einer
              anderen anders gerechnet wird.
            </li>
          </ul>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Was ich zuerst wissen müsste"
          subtitle="Kein 90-Tage-Plan – den könnte ich von außen nur raten. Stattdessen die Fragen, mit denen ich anfangen würde."
        />
        <ol className="space-y-0 px-5 pb-5">
          {FIRST_QUESTIONS.map((item, i) => (
            <li
              key={item.question}
              className="border-border border-t py-4 first:border-t-0 first:pt-0"
            >
              <h3 className="text-[13.5px] font-semibold">
                {i + 1}. {item.question}
              </h3>
              <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="px-5 py-5">
        <h2 className="text-[13px] font-semibold">Hinweis zu den Daten</h2>
        <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed">{DATA_DISCLAIMER}</p>
        <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed">
          Markennamen werden ausschließlich genannt, um den Kontext der Bewerbung herzustellen.
          Diese Arbeitsprobe verwendet keine Logos, Schriften, Produktbilder oder sonstigen
          Gestaltungselemente der SNOCKS GmbH und steht in keiner Verbindung zu ihr. Die Seite ist
          über <code className="bg-muted rounded px-1 py-0.5 text-[11.5px]">noindex</code> von
          Suchmaschinen ausgenommen.
        </p>
        <p className="mt-3 text-[13px]">
          <Link href="/" className="text-accent-strong font-medium hover:underline">
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
      className="border-border text-muted-foreground hover:border-accent hover:text-accent-strong inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors"
    >
      {icon}
      {children}
      <ArrowUpRight className="size-3" />
    </a>
  );
}
