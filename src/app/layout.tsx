import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Built for SNOCKS · Contribution Margin Cockpit",
  description:
    "Bewerbungs-Arbeitsprobe von Robin Spalthoff: Deckungsbeitragsrechnung nach Bestell-Kohorte statt nach Erstattungsdatum. Alle Daten synthetisch.",
  // Arbeitsprobe, kein öffentliches Produkt – bewusst nicht indexierbar.
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
