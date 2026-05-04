import path from "node:path";

export const TEST_OPERATING_UNIT_SLUG =
  process.env.E2E_OPERATING_UNIT_SLUG?.trim() || "loop-pak-3";

export const E2E_OPERATING_UNIT_PASSWORD =
  process.env.E2E_OPERATING_UNIT_PASSWORD?.trim() ||
  process.env.TEST_OPERATING_UNIT_ACCESS_CODE?.trim() ||
  "";

export const E2E_ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD?.trim() ||
  process.env.TEST_OPERATING_UNIT_ADMIN_CODE?.trim() ||
  "";

export const CACHE_TEST_DATE = "2026-03-01";
export const REGRESSION_TEST_DATE = "2026-09-01";
export const DEFAULT_HISTORY_START_DATE = "2026-04-01";
export const DEFAULT_HISTORY_END_DATE = "2026-06-30";
export const HISTORY_FILTER_START_DATE = "2026-03-01";
export const HISTORY_FILTER_END_DATE = "2026-03-31";

export const AUTH_STATE = path.join(__dirname, "..", ".auth", "state.json");
export const BASE_URL =
  requireLocalBaseUrl(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000");

export function requireLocalBaseUrl(value: string): string {
  const parsed = new URL(value);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  if (parsed.protocol !== "http:" || !localHosts.has(parsed.hostname)) {
    throw new Error(
      `E2E는 로컬 서버에서만 실행할 수 있습니다. PLAYWRIGHT_BASE_URL=${value}`
    );
  }
  return value;
}

type CohortSection =
  | "loop-pak"
  | "study"
  | "afterparty"
  | "members"
  | "angel/reports"
  | "admin/reports"
  | "admin/history";

export function cohortPath(
  section: CohortSection,
  params: Record<string, string> = {}
): string {
  const query = new URLSearchParams(params).toString();
  const pathname = `/cohorts/${TEST_OPERATING_UNIT_SLUG}/${section}`;
  return query ? `${pathname}?${query}` : pathname;
}

export function waitForCohortDateUrl(section: "study" | "afterparty"): string {
  return `**/cohorts/${TEST_OPERATING_UNIT_SLUG}/${section}?date=**`;
}

export function isProductionLikeBaseUrl(value: string): boolean {
  return value.includes("offline-study-management.vercel.app") || value.includes("vercel.app");
}
