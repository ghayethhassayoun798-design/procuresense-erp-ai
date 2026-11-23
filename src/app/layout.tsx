import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProcureSense ERP AI",
  description: "Gestion commerciale et recommandations intelligentes pour Samir Trading.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
