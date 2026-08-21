import type { Metadata } from "next";
import { Caveat, Inter, Playfair_Display } from "next/font/google";

import MotionProvider from "@/components/motion/MotionProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

import "./globals.css";

// Typefaces read from the `writewise` Figma file: Playfair Display carries every
// heading (including its italic emphasis runs), Inter handles all body and UI text,
// and Caveat is the handwritten marker voice on decorative labels.
const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
  weight: ["700"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: {
    default: "WriteWise",
    template: "%s · WriteWise",
  },
  description:
    "AI-scored IELTS Writing feedback against the real assessment criteria, in under a minute.",
  openGraph: {
    type: "website",
    siteName: "WriteWise",
    title: "WriteWise — grade IELTS Writing free",
    description:
      "Graded on the 4 official IELTS criteria, with a provisional band and a comment on each criterion in under a minute.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WriteWise — grade IELTS Writing free",
    description:
      "Graded on the 4 official IELTS criteria, with a provisional band in under a minute.",
  },
};

/*
 * Scroll reveals serialise their `hidden` variant into the SSR markup, so a bundle that
 * never loads would leave the page blank. This puts every revealed block back at its
 * resting state when scripting is off.
 */
const NOSCRIPT_REVEAL_CSS =
  "[data-reveal],[data-reveal] *{opacity:1!important;transform:none!important;clip-path:none!important;}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${caveat.variable}`} suppressHydrationWarning>
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
        <noscript>
          <style>{NOSCRIPT_REVEAL_CSS}</style>
        </noscript>

        <a href="#main" className="skip-link">
          Skip to content
        </a>

        {/* Paper grain over the whole document, so the flat cream reads as stock. */}
        <span aria-hidden="true" data-decoration className="grain" />

        <MotionProvider>
          <AuthProvider>{children}</AuthProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
