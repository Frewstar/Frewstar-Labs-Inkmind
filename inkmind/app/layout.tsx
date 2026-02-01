import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-head",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "InkMind — AI Tattoo Design Studio",
  description:
    "Describe your tattoo. See it rendered in your artist's signature style. Book in one tap.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "InkMind" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="mobile-app-shell">
      <body className={`${playfair.variable} ${dmSans.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
