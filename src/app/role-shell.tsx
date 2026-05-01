import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions";
import { cohortAwarePath } from "@/lib/cohort-routes";
import {
  type RolePageRole,
  listRolePages,
} from "@/lib/role-page";
import { operatingUnitDisplayName } from "@/lib/operating-unit-store";

type RoleShellProps = {
  activeRole: RolePageRole;
  title: string;
  summary: string;
  unitSlug?: string;
  scopeLabel?: string;
  showRoleNav?: boolean;
  children: ReactNode;
};

const navStyle = {
  borderColor: "var(--line)",
  backgroundColor: "var(--surface)",
  color: "var(--ink-soft)",
};

const activeNavStyle = {
  borderColor: "rgba(13, 127, 242, 0.35)",
  backgroundColor: "var(--accent-weak)",
  color: "var(--accent-strong)",
};

export function RoleShell({
  activeRole,
  title,
  summary,
  unitSlug = "",
  scopeLabel,
  showRoleNav = true,
  children,
}: RoleShellProps) {
  const displayScope = scopeLabel ?? operatingUnitDisplayName(unitSlug);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6 lg:px-8 lg:pb-10">
      <header
        className="fixed inset-x-0 top-0 z-40 border-b px-4 py-1.5 sm:px-6 lg:px-8"
        style={{
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          borderColor: "var(--line)",
        }}
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-1.5 sm:flex sm:items-center sm:justify-between sm:gap-2.5">
            <div className="min-w-0">
              <h1
                className="truncate text-lg font-extrabold tracking-tight sm:text-xl"
                style={{ fontFamily: "var(--font-heading), sans-serif", color: "var(--ink)" }}
              >
                {title}
              </h1>
            </div>

            <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--ink-soft)" }}
                aria-label={`현재 항목 ${displayScope}`}
              >
                {displayScope}
              </span>
              {showRoleNav ? (
                <nav className="hidden shrink-0 flex-nowrap items-center gap-1 rounded-lg border p-0.5 sm:flex" style={{ borderColor: "var(--line)", backgroundColor: "var(--surface-alt)" }} aria-label="역할별 페이지 이동">
                  {listRolePages().map((page) => (
                    <Link
                      key={page.role}
                      href={cohortAwarePath(unitSlug, page.path)}
                      aria-current={activeRole === page.role ? "page" : undefined}
                      className="btn-press rounded-md border px-2.5 py-1 text-xs font-semibold transition hover:opacity-85"
                      style={activeRole === page.role ? activeNavStyle : navStyle}
                    >
                      {page.label}
                    </Link>
                  ))}
                </nav>
              ) : null}

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="btn-press shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold transition hover:opacity-90"
                  style={{
                    borderColor: "#fecaca",
                    color: "var(--danger)",
                    backgroundColor: "var(--danger-bg)",
                  }}
                >
                  로그아웃
                </button>
              </form>
            </div>

            {showRoleNav ? (
              <nav className="flex min-w-0 flex-nowrap items-center gap-1 overflow-x-auto rounded-lg border p-0.5 sm:hidden" style={{ borderColor: "var(--line)", backgroundColor: "var(--surface-alt)" }} aria-label="역할별 페이지 이동">
                {listRolePages().map((page) => (
                  <Link
                    key={`mobile-${page.role}`}
                    href={cohortAwarePath(unitSlug, page.path)}
                    aria-current={activeRole === page.role ? "page" : undefined}
                    className="btn-press shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold transition hover:opacity-85"
                    style={activeRole === page.role ? activeNavStyle : navStyle}
                  >
                    {page.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>

        </div>
      </header>
      <div className="h-[130px] sm:h-[50px]" aria-hidden="true" />

      <p className="mb-4 max-w-3xl text-sm font-medium" style={{ color: "var(--ink-muted)" }}>
        {summary}
      </p>

      {children}
    </main>
  );
}
