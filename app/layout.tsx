import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSR Partnership Radar",
  description: "Weekly CSR partnership signals for corporate partnerships teams.",
};

const nav = [
  { href: "/", label: "Latest" },
  { href: "/digests", label: "Past digests" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <header className="border-b border-gray-200">
          <div className="mx-auto flex max-w-[880px] flex-wrap items-center justify-between gap-2 px-4 py-4">
            <Link href="/" className="text-base font-semibold text-gray-900">
              CSR Partnership Radar
            </Link>
            <nav aria-label="Main">
              <ul className="flex gap-4 text-sm">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-gray-600 hover:text-accent">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-[880px] px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
