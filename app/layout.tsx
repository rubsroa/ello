import type { Metadata } from "next";
import "@fontsource-variable/jost";
import "./globals.css";

const siteUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ell’o — Coiffure à Genève", template: "%s | ell’o Genève" },
  description: "Salon de coiffure femme et homme à Genève. Coupes, couleurs, soins et rendez-vous en ligne.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_CH",
    siteName: "ell’o — Coiffure · Genève",
    title: "ell’o — Coiffure à Genève",
    description: "Une maison de coiffure femme et homme au cœur de Genève.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-ivory text-night antialiased">
        <a className="skip-link" href="#main-content">Aller au contenu</a>
        {children}
      </body>
    </html>
  );
}
