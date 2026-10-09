import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: {
    default: "RajaLaptop – Komputer & Elektronik Terpercaya",
    template: "%s | RajaLaptop",
  },
  description:
    "RajaLaptop – Toko komputer dan elektronik terpercaya di Jawa Tengah & DIY. Laptop, PC, aksesoris, service center, trade-in, dan konsultasi gratis.",
  keywords: [
    "laptop",
    "komputer",
    "elektronik",
    "toko laptop",
    "service laptop",
    "harga laptop",
    "promo laptop",
    "gaming laptop",
  ],
  openGraph: {
    title: "RajaLaptop – Komputer & Elektronik Terpercaya",
    description:
      "Temukan laptop, PC, aksesoris terbaik dengan harga terjangkau.",
    type: "website",
    locale: "id_ID",
  },
};

import { SettingsProvider } from "@/app/context/SettingsContext";
import AppShell from "@/app/components/AppShell";

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SettingsProvider>
          <AppShell>{children}</AppShell>
        </SettingsProvider>
      </body>
    </html>
  );
}
