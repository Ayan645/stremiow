import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Stremio tv — Curated Cinema & Streaming",
  description: "An authentic Apple TV-inspired streaming interface layered over the open Stremio protocol and Letterboxd cinephile sync.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#050507] text-white font-sans selection:bg-white/20">
        <Suspense fallback={<div className="h-20" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
