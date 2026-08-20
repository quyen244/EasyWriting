import type { Metadata } from "next";
import { Geist, Literata } from "next/font/google";

import { AuthProvider } from "@/hooks/useAuth";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

import "./globals.css";

// academic_editorial's typographic pairing (002 T005): Literata carries the editorial
// "academic voice" for headlines, Geist handles everything functional.
const literata = Literata({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-literata",
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: {
    default: "WriteWise",
    template: "%s · WriteWise",
  },
  description:
    "AI-scored IELTS Writing feedback against the real assessment criteria, in under a minute.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${literata.variable} ${geist.variable}`} suppressHydrationWarning>
      <head>
        {/*
          Applies the stored theme before first paint. A React effect would run after
          hydration, by which point a dark-theme user has already seen a white flash.
          `suppressHydrationWarning` above is required because this script legitimately
          mutates <html>'s class list before React reconciles it.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-background text-on-background">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
