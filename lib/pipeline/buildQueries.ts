import type { Settings } from "../types";

export const MAX_QUERIES = 12;
const MAX_SECTOR_QUERIES = 5;
const MAX_REGION_QUERIES = 2;

const quote = (s: string) => `"${s.trim().replace(/"/g, "")}"`;
const clean = (list: string[]) => [...new Set(list.map((s) => s.trim()).filter(Boolean))];

/**
 * Builds Google News search queries from the settings: sectors x CSR terms,
 * signal-specific queries, regions and extra keywords. Never more than MAX_QUERIES.
 */
export function buildQueries(settings: Pick<Settings, "sectors" | "regions" | "extra_keywords">): string[] {
  const sectors = clean(settings.sectors);
  const regions = clean(settings.regions).filter((r) => !/^pan[- ]?india$/i.test(r));
  const keywords = clean(settings.extra_keywords);
  const sectorAny = sectors.length ? `(${sectors.map(quote).join(" OR ")})` : "";

  const queries: string[] = [];

  for (const sector of sectors.slice(0, MAX_SECTOR_QUERIES)) {
    queries.push(`"CSR" ${quote(sector)} India`);
  }

  // Signal-specific queries
  queries.push(`"CSR" ("NGO partner" OR "implementation partner" OR "partner NGOs") ${sectorAny}`.trim());
  queries.push(`("CSR spend" OR "CSR budget" OR "CSR allocation" OR "CSR outlay") ${sectorAny}`.trim());
  queries.push(`("CSR rules" OR "Schedule VII" OR "CSR amendment" OR "MCA" CSR) India`);

  for (const region of regions.slice(0, MAX_REGION_QUERIES)) {
    queries.push(`"CSR" ${quote(region)} ${sectorAny}`.trim());
  }

  for (const keyword of keywords) {
    queries.push(`"CSR" ${quote(keyword)}`);
  }

  return [...new Set(queries)].slice(0, MAX_QUERIES).map((q) => `${q} when:7d`);
}
