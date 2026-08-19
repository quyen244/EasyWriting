import type { Metadata } from "next";

import { AuthProvider } from "@/hooks/useAuth";

import "./globals.css";

export const metadata: Metadata = {
  title: "WriteWise",
  description: "AI-scored IELTS Writing feedback against real criteria.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
