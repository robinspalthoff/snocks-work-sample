"use client";

import { useState } from "react";
import { FilterBar } from "@/components/filters/filter-bar";
import { C, Legend } from "@/components/charts/chart-kit";
import { Waterfall, type WaterfallStep } from "@/components/charts/waterfall";
import { Card, CardHeader, CardNote } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { CHANNEL_ASSUMPTIONS, UNIT_COSTS } from "@/config/assumptions";
import { eur, eurCompact, pct } from "@/lib/format";
import { useDashboard, type DimensionRow } from "@/lib/use-dashboard";
import type { Cm } from "@/lib/kpi";

type ViewKey = "cohort" | "reported";

export default function ContributionMarginPage() {
  const d = useDashboard();
  const [view, setView] = useState<ViewKey>("cohort");
  const cm = view === "cohort" ? d.real : d.reported;

  const steps: WaterfallStep[] = [
    { label: "Brutto-Umsatz", value: cm.gross, kind: "total" },
    { label: "Rabatte", value: -cm.discount, kind: "deduction" },
    { label: "Erstattungen", value: -cm.refunds, kind: "deduction" },
    { label: "Netto-Umsatz", value: cm.netRevenue, kind: "subtotal" },
    {
      label: "COGS",
      value: -cm.cogs,
      kind: "deduction",
      note: `Landed Cost der behaltenen Ware inkl. ${pct(
        UNIT_COSTS.returnWriteOffShare,
        0,
      )} Abschreibung auf Rückläufer`,
    },
    { label: "CM1", value: cm.cm1, kind: "subtotal" },
    {
      label: "Fulfillment",
      value: -cm.fulfillment,
      kind: "deduction",
      note: `${eur(UNIT_COSTS.fulfillmentPerOrder)} je Bestellung`,
    },
    { label: "Versand", value: -cm.shipping, kind: "deduction", note: "Versandkosten je Markt" },
    {
      label: "Retourenkosten",
      value: -cm.returnHandling,
      kind: "deduction",
      note: `${eur(UNIT_COSTS.returnHandlingPerReturn)} je retournierter Bestellung`,
    },
    {
      label: "Payment",
      value: -cm.paymentFees,
      kind: "deduction",
      note: "gewichteter Zahlarten-Mix im eigenen Shop",
    },
    {
      label: "Provisionen",
      value: -cm.marketplaceFees,
      kind: "deduction",
      note: "Amazon 15 %, Zalando 23 %",
    },
    { label: "CM2", value: cm.cm2, kind: "subtotal" },
    { label: "Marketing", value: -cm.marketing, kind: "deduction", note: "Ad-Spend aller Kanäle" },
    { label: "CM3", value: cm.cm3, kind: "highlight" },
  ];

  const costShare = cm.variableCosts / Math.max(1, cm.netRevenue);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Contribution Margin"
        insight={
          <>
            Von {eurCompact(cm.gross)} Brutto-Umsatz bleiben{" "}
            <strong className="font-semibold text-foreground">{eurCompact(cm.cm3)}</strong> CM3 –{" "}
            {pct(cm.cm3Margin)} vom Netto-Umsatz. Der größte Block nach dem Wareneinsatz sind
            nicht die Marktplatzprovisionen, sondern Logistik und Retourenbearbeitung mit{" "}
            {pct(costShare)} des Netto-Umsatzes.
          </>
        }
      />

      <FilterBar />

      <Card className="mb-6">
        <CardHeader
          title="Vom Brutto-Umsatz zum CM3"
          subtitle="Zwischensummen stehen auf der Nulllinie, Abzüge hängen am laufenden Saldo."
          action={
            <div className="flex items-center gap-3">
              <Legend
                items={[
                  { label: "Zwischensumme", color: C.reported, swatch: "box" },
                  { label: "Abzug", color: C.neutralSoft, swatch: "box" },
                  { label: "CM3", color: C.real, swatch: "box" },
                ]}
              />
              <ViewToggle view={view} onChange={setView} />
            </div>
          }
        />
        <div className="px-2 pb-2">
          <Waterfall steps={steps} reference={cm.netRevenue} />
        </div>
        <CardNote>
          Kontrolle: Netto-Umsatz {eur(cm.netRevenue)} − COGS {eur(cm.cogs)} = CM1 {eur(cm.cm1)};
          CM1 − variable Kosten {eur(cm.variableCosts)} = CM2 {eur(cm.cm2)}; CM2 − Marketing{" "}
          {eur(cm.marketing)} = CM3 {eur(cm.cm3)}.
        </CardNote>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader
            title="Deckungsbeitrag nach Marke"
            subtitle="Alle Werte in der aktuell gewählten Sicht. Prozentangaben beziehen sich auf den Netto-Umsatz."
          />
          <DataTable
            columns={cmColumns(view)}
            rows={d.byBrand}
            footer={totalRow(d.byBrand, cm)}
            minWidth={1020}
          />
        </Card>

        <Card>
          <CardHeader
            title="Deckungsbeitrag nach Kanal"
            subtitle="Marktplätze kosten Provision, liefern aber Reichweite ohne eigenen Marketing-Spend – im CM3 dreht sich das Bild gegenüber dem CM2."
          />
          <DataTable
            columns={cmColumns(view)}
            rows={d.byChannel}
            footer={totalRow(d.byChannel, cm)}
            minWidth={1020}
          />
          <CardNote>
            Marketing wird den Kanälen anteilig nach Netto-Umsatz zugerechnet. In der Praxis würde
            ich hier den tatsächlich kanalbezogenen Spend hinterlegen – Amazon Ads und Zalando ZMS
            getrennt vom Shop-Budget.{" "}
            {Object.entries(CHANNEL_ASSUMPTIONS)
              .map(([k, v]) => `${k}: ${(v.marketplaceFeeRate * 100).toFixed(0)} % Provision`)
              .join(" · ")}
          </CardNote>
        </Card>
      </div>
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: ViewKey; onChange: (v: ViewKey) => void }) {
  return (
    <div className="flex shrink-0 rounded-full border border-border p-0.5 text-[11.5px]">
      {(
        [
          ["cohort", "Bestell-Kohorte"],
          ["reported", "Erstattungsdatum"],
        ] as [ViewKey, string][]
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={
            view === key
              ? "rounded-full bg-accent-soft px-2.5 py-1 font-medium text-accent-strong"
              : "rounded-full px-2.5 py-1 text-muted-foreground"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Tabelle ────────────────────────────────────────────────────────────

function pickCm(row: DimensionRow<string>, view: ViewKey): Cm {
  return view === "cohort" ? row.real : row.reported;
}

function totalRow(rows: DimensionRow<string>[], cm: Cm): DimensionRow<string> {
  return { key: "Gesamt", real: cm, reported: cm } as DimensionRow<string>;
}

function cmColumns(view: ViewKey): Column<DimensionRow<string>>[] {
  const v = (r: DimensionRow<string>) => pickCm(r, view);
  return [
    {
      key: "key",
      header: "",
      render: (r) => (
        <span className="flex items-center gap-2 font-medium">
          {C.brands[r.key] && (
            <span
              aria-hidden
              className="inline-block size-2.5 shrink-0 rounded-sm"
              style={{ background: C.brands[r.key] }}
            />
          )}
          {r.key}
        </span>
      ),
    },
    { key: "gross", header: "Brutto", align: "right", render: (r) => eurCompact(v(r).gross) },
    { key: "disc", header: "Rabatte", align: "right", render: (r) => eurCompact(-v(r).discount) },
    {
      key: "ref",
      header: "Erstattungen",
      align: "right",
      render: (r) => eurCompact(-v(r).refunds),
    },
    { key: "net", header: "Netto-Umsatz", align: "right", render: (r) => eurCompact(v(r).netRevenue) },
    { key: "cogs", header: "COGS", align: "right", render: (r) => eurCompact(-v(r).cogs) },
    {
      key: "cm1",
      header: "CM1",
      align: "right",
      render: (r) => (
        <span>
          {eurCompact(v(r).cm1)}
          <span className="ml-1.5 text-[11px] text-subtle-foreground">{pct(v(r).cm1Margin, 0)}</span>
        </span>
      ),
    },
    {
      key: "var",
      header: "Var. Kosten",
      align: "right",
      title: "Fulfillment, Versand, Retourenbearbeitung, Payment, Marktplatzprovision",
      render: (r) => eurCompact(-v(r).variableCosts),
    },
    {
      key: "cm2",
      header: "CM2",
      align: "right",
      render: (r) => (
        <span>
          {eurCompact(v(r).cm2)}
          <span className="ml-1.5 text-[11px] text-subtle-foreground">{pct(v(r).cm2Margin, 0)}</span>
        </span>
      ),
    },
    { key: "mkt", header: "Marketing", align: "right", render: (r) => eurCompact(-v(r).marketing) },
    {
      key: "cm3",
      header: "CM3",
      align: "right",
      render: (r) => (
        <span className="font-semibold" style={{ color: C.real }}>
          {eurCompact(v(r).cm3)}
          <span className="ml-1.5 text-[11px] font-normal text-subtle-foreground">
            {pct(v(r).cm3Margin, 0)}
          </span>
        </span>
      ),
    },
  ];
}
