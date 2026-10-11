"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  latest: (
    <path d="M3 4h10M3 8h10M3 12h6" strokeLinecap="round" />
  ),
  history: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  settings: (
    <>
      <path d="M3 5h10M3 11h10" strokeLinecap="round" />
      <circle cx="6" cy="5" r="1.6" fill="white" />
      <circle cx="10" cy="11" r="1.6" fill="white" />
    </>
  ),
};

const ITEMS = [
  { href: "/", label: "This week", icon: ICONS.latest, match: (p: string) => p === "/" },
  { href: "/digests", label: "Past digests", icon: ICONS.history, match: (p: string) => p.startsWith("/digests") },
  { href: "/settings", label: "Settings", icon: ICONS.settings, match: (p: string) => p.startsWith("/settings") },
];

type Orientation = "vertical" | "horizontal";

/** Active-state nav. Must sit inside <Suspense> (usePathname on dynamic routes). */
export function Nav({ orientation }: { orientation: Orientation }) {
  return <NavLinks orientation={orientation} pathname={usePathname()} />;
}

/** Plain links; also the Suspense fallback (no active state). */
export function NavLinks({ orientation, pathname }: { orientation: Orientation; pathname: string | null }) {
  const vertical = orientation === "vertical";

  return (
    <nav aria-label="Main">
      <ul className={vertical ? "space-y-1" : "flex gap-1"}>
        {ITEMS.map((item) => {
          const active = pathname !== null && item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  vertical ? "px-3 py-2" : "px-2.5 py-1.5"
                } ${active ? "bg-accent-soft text-accent" : "text-ink-2 hover:bg-canvas hover:text-ink"}`}
              >
                <svg aria-hidden viewBox="0 0 16 16" className={`h-4 w-4 shrink-0 ${vertical ? "" : "hidden sm:block"}`} fill="none" stroke="currentColor" strokeWidth="1.5">
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
