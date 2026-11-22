# Built for SNOCKS · Contribution Margin Cockpit

**Bewerbungs-Arbeitsprobe von Robin Spalthoff für die Position Financial
Controller:in bei der SNOCKS GmbH.**
Alle Zahlen sind synthetisch. Diese Arbeit steht in keiner Verbindung zur
SNOCKS GmbH und verwendet keine Logos, Schriften oder Gestaltungselemente
des Unternehmens.

---

## 1. Das Problem

Der Standardreport eines Shopsystems bucht eine Erstattung an dem Tag, an dem
sie ausgeführt wird – nicht an dem Tag, an dem die zugehörige Bestellung
eingegangen ist. Nach einem Sales Event sind die Umsätze deshalb bereits
gebucht, die Retouren aber noch nicht: Der Aktionsmonat sieht zu gut aus, der
Folgemonat zu schlecht, und beide Monate führen zu falschen Entscheidungen
über Rabatthöhe und Ad-Spend.

## 2. Was die synthetischen Daten zeigen

* **Die Black Week verdient nichts.** Die Kohorte aller Bestellungen vom
  24.11.–01.12.2025 startet mit **13,0 % CM3-Marge** und endet 60 Tage später
  bei **−0,8 %** – ein Margenverfall von 13,8 Prozentpunkten und am Ende
  **−56 Tsd € CM3**. Im Standardreport ist davon im November nichts zu sehen.
* **Der Report schmeichelt dem Aktionsmonat.** Für November 2025 weist die
  Sicht nach Erstattungsdatum einen um **934 Tsd € zu hohen CM3** aus,
  **+5,6 Prozentpunkte** Marge. Über den gesamten Zeitraum von 23 Monaten
  gleichen sich beide Sichten bis auf 0,4 % aus – der Fehler ist kein
  Bewertungs-, sondern ein Periodisierungsfehler, und genau deshalb fällt er
  im Jahresabschluss nicht auf.
* **ROAS und POAS sagen Gegenteiliges.** TikTok kommt auf **2,27 ROAS**, aber
  nur **0,59 POAS**: Nach Rabatten, 28 % Retourenquote, Wareneinsatz und
  Logistik verdient der Kanal weniger, als er kostet. Google liegt bei 4,76
  ROAS und 2,07 POAS. Wer Budget nach ROAS verschiebt, verschiebt es in die
  falsche Richtung.
* **Der Planer macht die Grenze sichtbar.** Mit den Vorjahreswerten liegt der
  Break-even-Rabatt für die Black Week 2026 bei **31,1 %** – geplant sind
  28 %. Der Puffer beträgt 3,1 Prozentpunkte, und er verschwindet, sobald die
  Retourenquote um 5 Punkte steigt.

Basis: 180,6 Mio € Netto-Umsatz über 23 Monate (94,0 Mio € in 2025, 86,6 Mio €
in 2026 bis zum 22.11.), vier Marken, drei Kanäle, fünf Märkte.

## 3. Wie ich das bei euch auf echte Daten umstellen würde

* **Erstattungen an die Ursprungsbestellung binden.** Im Data Warehouse
  `refunds` über die Order-ID an `orders` joinen und jede Kennzahl zweimal
  materialisieren: nach Bestelldatum (steuerungsrelevant) und nach
  Erstattungsdatum (abstimmbar gegen Payment und Buchhaltung). Beide Sichten
  nebeneinander, nicht anstelle voneinander – die Differenz ist selbst eine
  Kennzahl.
* **Offene Kohorten zurückstellen.** Aus der historischen Verzugsverteilung
  je Marke, Kanal und Markt eine Retouren-Rückstellung für Bestellungen der
  letzten 60 Tage bilden. Damit stimmt der Monatsabschluss sofort und nicht
  erst zwei Monate später. Der Schätzwert wird gegen den Ist-Verlauf
  nachgehalten, die Abweichung ist die Qualitätsprüfung des Modells.
* **Eine Kostenschicht, viele Berichte.** Landed Cost, Fulfillment-, Versand-,
  Retouren-, Payment- und Marktplatzkosten als eine versionierte
  Kostenschicht im Warehouse, aus der CM1–CM3 abgeleitet werden. Marketing
  dann je Marke, Kanal und Markt – damit POAS nicht mehr allokiert werden
  muss, sondern gemessen wird. Das Dashboard selbst bleibt austauschbar; die
  Definitionen sind der Wert.

## 4. Technik und Vorgehen

Next.js (App Router), TypeScript, Tailwind, Recharts. Kein Backend, keine
Datenbank, keine Zugangsdaten – die Daten erzeugt ein deterministisches Skript
beim Build, die Szenariorechnungen laufen im Browser.

Eine einzige KPI-Schicht (`src/lib/kpi.ts`) versorgt alle Seiten. Die Sicht
„Bestell-Kohorte vs. Erstattungsdatum“ ist ein Parameter dieser Funktion –
keine Seite rechnet eine Zahl anders als eine andere. Sämtliche Annahmen
stehen in `src/config/assumptions.ts` und werden im Dashboard unter
„Datenqualität & KPI-Definitionen“ angezeigt.

Zeitaufwand: rund ein Arbeitstag, KI-gestützt (Claude Code). Fachliche
Modellierung, Annahmen und Interpretation stammen von mir.

Die Chartfarben sind gegen Farbfehlsichtigkeit geprüft: Die Linien „reported“
und „real“ trennen sich auch bei Rot-Grün-Schwäche (ΔE 10,9 protan) und sind
zusätzlich durch Strichart unterschieden.

## 5. Hinweis zu den Daten

Alle Werte sind **synthetisch und plausibel geschätzt**. Sie stammen aus einem
deterministischen Generator mit festem Seed (`scripts/generate-data.ts`) und
sind ausdrücklich **keine echten Zahlen der SNOCKS GmbH**. Markennamen,
Kanäle und Märkte dienen allein dazu, den Kontext der Bewerbung herzustellen.
Die Seite ist über `noindex` und `robots.txt` von Suchmaschinen ausgenommen.

---

## Setup

```bash
npm install
npm run generate   # erzeugt die synthetischen Daten in data/
npm run dev        # http://localhost:3000
```

`npm run generate` ist deterministisch: gleicher Seed, gleiche Dateien. Das
Verzeichnis `data/` ist deshalb nicht im Repository – es entsteht bei jedem
Build neu.

```bash
npm run build       # erzeugt die Daten und baut die Seite
npm run type-check  # tsc --noEmit
npm run lint
```

### Deploy auf Vercel

1. Auf [vercel.com](https://vercel.com) → **Add New… → Project** → dieses
   GitHub-Repository importieren.
2. Keine Konfiguration nötig: Framework „Next.js“ wird erkannt, der
   Build-Befehl `npm run build` erzeugt die Daten mit.
3. Keine Environment-Variablen erforderlich (siehe `.env.example`).

## Projektstruktur

```
config/assumptions.ts   alle Annahmen an einer Stelle
scripts/generate-data.ts  deterministischer Datengenerator
src/lib/kpi.ts          CM1–CM3, ROAS/POAS/MER, beide Retouren-Sichten
src/lib/cohort.ts       60-Tage-Verlauf einer Bestell-Kohorte
src/lib/variance.ts     Abweichungszerlegung Preis/Menge/Mix/Retouren
src/lib/black-week-model.ts  Szenariorechnung inkl. Break-even-Rabatt
src/app/                die sieben Seiten des Dashboards
```

## Seiten

| Seite | Inhalt |
| --- | --- |
| Overview | KPI-Kacheln, „Reported vs. Real“, Monatsverlauf, Marken und Kanäle |
| Shopify vs. Realität | Beide Sichten im Vergleich, Tagesreihe der Erstattungen, 60-Tage-Kohortenverlauf |
| Contribution Margin | Wasserfall Brutto-Umsatz → CM3, Tabellen nach Marke und Kanal |
| Marketing-Effizienz | ROAS vs. POAS je Kanal und Marke, MER, Attributionsabdeckung |
| Black Week Planer 2026 | Regler für Rabatt, Absatz, Retouren und Ad-Spend; Break-even; Base/Best/Worst |
| Soll-Ist | Plan vs. Ist je Monat mit Zerlegung in Preis, Menge, Mix und Retouren |
| Datenqualität & KPIs | Automatische Prüfungen, Glossar mit allen Formeln, alle Annahmen |
