# Built for SNOCKS · Contribution Margin Cockpit

Bewerbungs-Arbeitsprobe von **Robin Spalthoff** für die Position Financial
Controller:in bei der SNOCKS GmbH.

> **Alle Zahlen in diesem Projekt sind synthetisch.** Sie stammen aus einem
> deterministischen Generator und sind keine echten Zahlen der SNOCKS GmbH.
> Diese Arbeit steht in keiner Verbindung zum Unternehmen und verwendet
> keine Logos, Schriften oder Gestaltungselemente von SNOCKS.

---

## 1. Das Problem

Der Standardreport eines Shopsystems bucht eine Retoure an dem Tag, an dem sie
verarbeitet wird – nicht an dem Tag, an dem die zugehörige Bestellung einging.
Nach einem Sales Event sind die Umsätze deshalb bereits gebucht, die Retouren
aber noch nicht: Der Aktionsmonat sieht zu gut aus, der Folgemonat zu
schlecht. Beide Monate führen zu falschen Entscheidungen über Rabatthöhe und
Ad-Spend.

Das ist dokumentiertes Verhalten, keine Vermutung. Shopify schreibt im
[Help Center zum Sales Report](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report):
*„reversals display as a negative value for the day that they were
processed"*. Von dort stammt auch die Definition, die dieses Dashboard
übernimmt: `Net sales = gross sales − discounts − sales reversals`.

## 2. Was die Daten zeigen

* **Die Black Week verdient nichts.** Alle Bestellungen vom 24.11.–01.12.2025
  starten mit **13,0 % CM3-Marge** und enden 60 Tage später bei **−0,8 %** –
  ein Margenverfall von 13,8 Prozentpunkten. Nach allen Retouren bleibt ein
  CM3 von **−56 Tsd €**.
* **Der Report schmeichelt dem Aktionsmonat.** Für November 2025 weist die
  Sicht nach Erstattungsdatum **16,4 % CM3-Marge** aus, periodengerecht sind
  es **11,8 %** – eine Differenz von **889 Tsd €**. Im Dezember kippt das
  Vorzeichen: dort liegt der Report **606 Tsd €** zu niedrig. Über den
  gesamten Zeitraum von 23 Monaten gleichen sich beide Sichten bis auf 0,7 %
  aus. Es ist ein Periodisierungs-, kein Bewertungsfehler – und fällt deshalb
  im Jahresabschluss nicht auf.
* **ROAS und POAS sagen Gegenteiliges.** TikTok kommt auf **2,27 ROAS**, aber
  nur **0,59 POAS**: Nach Rabatten, 28 % Retourenquote, Wareneinsatz und
  Logistik verdient der Kanal weniger, als er kostet. Google liegt bei 4,76
  ROAS und 2,07 POAS. Wer Budget nach ROAS verschiebt, verschiebt es in die
  falsche Richtung.
* **Der Planer macht die Grenze sichtbar.** Für die Black Week 2026 liegt der
  Break-even-Rabatt bei **31,1 %** – geplant sind 28 %. Der Puffer von
  3,1 Prozentpunkten verschwindet, sobald die Retourenquote um 5 Punkte steigt.

Die Rechnung auf eine einzelne Bestellung heruntergebrochen: von **37,11 €**
Netto-Umsatz bleiben nach Wareneinsatz (12,32 €), Logistik und Retouren
(6,70 €), Gebühren (2,60 €) und Marketing (7,46 €) noch **8,02 € CM3**.

## 3. Wie ich das auf echte Daten umstellen würde

* **Erstattungen an die Ursprungsbestellung binden.** Im Data Warehouse
  `refunds` über die Order-ID an `orders` joinen und jede Kennzahl zweimal
  materialisieren: nach Bestelldatum (steuerungsrelevant) und nach
  Erstattungsdatum (abstimmbar gegen Payment und Buchhaltung). Beide Sichten
  nebeneinander, nicht anstelle voneinander – die Differenz ist selbst eine
  Kennzahl.
* **Offene Kohorten zurückstellen.** Aus der historischen Verzugsverteilung je
  Marke, Kanal und Markt eine Retouren-Rückstellung für Bestellungen der
  letzten 60 Tage bilden. Damit stimmt der Monatsabschluss sofort statt erst
  zwei Monate später. Der Schätzwert wird gegen den Ist-Verlauf nachgehalten –
  diese Abweichung ist die Qualitätsprüfung des Modells.
* **Eine Kostenschicht, viele Berichte.** Landed Cost, Fulfillment-, Versand-,
  Retouren-, Payment- und Marktplatzkosten als eine versionierte Kostenschicht
  im Warehouse, aus der CM1–CM3 abgeleitet werden. Marketing dann je Marke,
  Kanal und Markt, damit POAS gemessen statt allokiert wird. Das Dashboard
  selbst ist austauschbar; der Wert liegt in den Definitionen.

## 4. Was diese Rechnung nicht kann

Drei Einschränkungen, die das Ergebnis mitbestimmen und deshalb hierher
gehören:

* **Kein Kundenwert.** Der Black-Week-Kohorte wird der gesamte Ad-Spend des
  Aktionsfensters angelastet. Ein Teil davon gewinnt Kunden, die später
  wiederkommen; diese Folgekäufe zählt die Rechnung nicht mit. Die Black Week
  steht hier also bewusst streng da. Für eine Budgetentscheidung wäre die
  Gegenrechnung über die Wiederkaufrate der nächste Schritt.
* **Marketing wird allokiert, nicht gemessen.** Der Spend liegt je Marke und
  Tag vor, nicht je Markt oder Verkaufskanal. Bei aktivem Filter wird er
  anteilig nach Netto-Umsatz verteilt. Das verzerrt den Kanalvergleich: in
  Wirklichkeit trägt der eigene Shop den größten Teil des Markenbudgets,
  während Amazon und Zalando eigene Werbebudgets haben.
* **CM3 ist kein Gewinn.** Fixkosten – Personal, Miete, Software, Agenturen –
  sind nicht enthalten. CM3 beantwortet, ob ein Kanal, eine Marke oder eine
  Aktion zum Deckungsbeitrag beiträgt, nicht ob das Unternehmen profitabel ist.

## 5. Technik und Vorgehen

Next.js (App Router), TypeScript, Tailwind, Recharts. Kein Backend, keine
Datenbank, keine Zugangsdaten – die Daten erzeugt ein deterministisches Skript
beim Build, die Szenariorechnungen laufen im Browser.

Eine einzige KPI-Schicht (`src/lib/kpi.ts`) versorgt alle Seiten. Die Sicht
„Bestell-Kohorte vs. Erstattungsdatum" ist ein Parameter dieser Funktion –
keine Seite rechnet eine Zahl anders als eine andere. Sämtliche Annahmen
stehen in `src/config/assumptions.ts` und werden im Dashboard unter
„Datenqualität & KPI-Definitionen" offengelegt.

Zeitaufwand: rund ein Arbeitstag, KI-gestützt entwickelt. Fachliche
Modellierung, Annahmen und Interpretation stammen von mir.

Die Chartfarben sind gegen Farbfehlsichtigkeit geprüft: „reported" und „real"
trennen sich auch bei Rot-Grün-Schwäche (ΔE 10,9 protan) und sind zusätzlich
durch die Strichart unterschieden. Lighthouse: Performance 94–98,
Accessibility 100.

## 6. Prüfung der Zahlen

```bash
npm run verify
```

48 automatische Prüfungen in zwei Stufen:

1. **Interne Konsistenz** – summiert der Monatswürfel zum Tageswürfel,
   schließt der Deckungsbeitragswasserfall auf den Cent, addieren sich die
   Dimensionsschnitte zum Gesamtwert, laufen beide Retouren-Sichten über den
   Gesamtzeitraum zusammen?
2. **Plausibilität** – liegen Margen, Retourenquoten, AOV, MER, POAS,
   Kostensätze und Kanalanteile in Bereichen, die für einen D2C-Händler dieser
   Größe realistisch sind?

Der Lauf bricht mit Fehlercode ab, sobald eine Prüfung reißt. Das ist bewusst
Teil des Repos: Ein Modell, dessen Annahmen man verstellen kann, braucht eine
Kontrolle, die beim Verstellen mitläuft.

## 7. Hinweis zu den Daten

Alle Werte sind **synthetisch und plausibel geschätzt**. Sie stammen aus
`scripts/generate-data.ts` mit festem Seed und sind ausdrücklich **keine
echten Zahlen der SNOCKS GmbH**. Markennamen, Kanäle und Märkte dienen allein
dazu, den Kontext der Bewerbung herzustellen. Die Seite ist über `noindex` und
`robots.txt` von Suchmaschinen ausgenommen.

---

## Lokal starten

```bash
npm install
npm run generate   # erzeugt die synthetischen Daten in data/
npm run dev        # http://localhost:3000
```

`npm run generate` ist deterministisch: gleicher Seed, gleiche Dateien. Das
Verzeichnis `data/` liegt deshalb nicht im Repository, sondern entsteht bei
jedem Build neu.

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Daten erzeugen und Seite bauen |
| `npm run verify` | Konsistenz- und Plausibilitätsprüfung der Zahlen |
| `npm run type-check` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Aufbau

```
src/config/assumptions.ts      alle Annahmen an einer Stelle
scripts/generate-data.ts       deterministischer Datengenerator
scripts/verify-data.ts         Konsistenz- und Plausibilitätsprüfung
src/lib/kpi.ts                 CM1–CM3, ROAS/POAS/MER, beide Retouren-Sichten
src/lib/cohort.ts              60-Tage-Verlauf einer Bestell-Kohorte
src/lib/variance.ts            Abweichungszerlegung Preis/Menge/Mix/Retouren
src/lib/black-week-model.ts    Szenariorechnung inkl. Break-even-Rabatt
src/app/                       die Seiten des Dashboards
```

| Seite | Inhalt |
| --- | --- |
| Home | Einstieg, Kernaussage, Rahmen zum Datensatz |
| Overview | KPI-Kacheln, „Reported vs. Real", Monatsverlauf, Marken und Kanäle |
| Shopify vs. Realität | Beide Sichten im Vergleich, Tagesreihe der Erstattungen, 60-Tage-Kohortenverlauf |
| Contribution Margin | Wasserfall Brutto-Umsatz → CM3, Tabellen nach Marke und Kanal |
| Marketing-Effizienz | ROAS vs. POAS je Kanal und Marke, MER, Attributionsabdeckung |
| Black Week Planer 2026 | Regler für Rabatt, Absatz, Retouren und Ad-Spend; Break-even; Base/Best/Worst |
| Soll-Ist | Plan vs. Ist je Monat mit Zerlegung in Preis, Menge, Mix und Retouren |
| Datenqualität & KPIs | Automatische Prüfungen, Glossar mit allen Formeln, alle Annahmen |
