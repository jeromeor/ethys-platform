import type { Metadata } from "next";
import { Inter, Source_Sans_3 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import QueryProvider from "@/lib/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ETHYS — Plateforme de Tracabilite Textile",
  description: "Plateforme ETHYS par TEXTILE LOOP — Tracabilite et certification du fil recycle",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Langue active lue depuis la config next-intl (cookie)
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${sourceSans.variable}`} style={{ margin: 0, fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        <NextIntlClientProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
