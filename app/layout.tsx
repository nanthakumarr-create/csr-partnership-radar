import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { Nav, NavLinks } from "@/components/Nav";
import { RunStatus } from "@/components/RunStatus";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CSR Partnership Radar",
  description: "Weekly CSR partnership signals: who is worth a call this week.",
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md bg-accent text-sm font-bold text-white">
        CR
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-ink">CSR Partnership Radar</span>
        <span className="block text-xs text-ink-3">Weekly partner signals</span>
      </span>
    </Link>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <div className="lg:flex">
          {/* Desktop sidebar */}
          <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-line lg:bg-white">
            <div className="px-5 py-5">
              <Logo />
            </div>
            <div className="flex-1 px-3">
              <Suspense fallback={<NavLinks orientation="vertical" pathname={null} />}>
                <Nav orientation="vertical" />
              </Suspense>
            </div>
            <div className="p-4">
              <Suspense fallback={<div className="h-28 rounded-lg border border-line bg-canvas" />}>
                <RunStatus />
              </Suspense>
            </div>
          </aside>

          {/* Mobile top bar */}
          <header className="border-b border-line bg-white lg:hidden">
            <div className="flex flex-col gap-3 px-4 py-3">
              <Logo />
              <Suspense fallback={<NavLinks orientation="horizontal" pathname={null} />}>
                <Nav orientation="horizontal" />
              </Suspense>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
