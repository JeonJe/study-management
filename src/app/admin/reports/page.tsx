import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteConfirmButton } from "@/app/delete-confirm-button";
import {
  RoleAccessRequired,
  RoleNotConfigured,
} from "@/app/role-page-view";
import { RoleShell } from "@/app/role-shell";
import { ToastNotice } from "@/app/toast-notice";
import { deleteWeeklyReportTemplateAction } from "@/app/weekly-report-actions";
import { isAuthenticatedForUnit } from "@/lib/auth";
import { cohortAwarePath, cohortEntryLoginPath } from "@/lib/cohort-routes";
import {
  canOpenRolePage,
  getRolePage,
} from "@/lib/role-page";
import {
  getConfiguredRolePages,
  getCurrentRolePageRole,
} from "@/lib/role-session";
import {
  type WeeklyReportTemplate,
  type WeeklyReportCycleWithReports,
  listWeeklyReportTemplates,
  listWeeklyReportOverview,
} from "@/lib/weekly-report-store";

type AdminReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function singleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatWeekLabel(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.endsWith("주차") ? normalized : `${normalized}주차`;
}

async function safeListWeeklyReportOverview(unitSlug: string): Promise<{
  cycles: WeeklyReportCycleWithReports[];
  templates: WeeklyReportTemplate[];
  error: boolean;
}> {
  try {
    const [cycles, templates] = await Promise.all([
      listWeeklyReportOverview(unitSlug),
      listWeeklyReportTemplates(unitSlug),
    ]);

    return {
      cycles,
      templates,
      error: false,
    };
  } catch (error) {
    console.error("Failed to load weekly report overview", error);
    return {
      cycles: [],
      templates: [],
      error: true,
    };
  }
}

function WeeklyReportAdminPanel({
  cycles,
  templates,
  created,
  updated,
  templateCreated,
  templateUpdated,
  templateDeleted,
  loadError,
  unitSlug,
}: {
  cycles: WeeklyReportCycleWithReports[];
  templates: WeeklyReportTemplate[];
  created: boolean;
  updated: boolean;
  templateCreated: boolean;
  templateUpdated: boolean;
  templateDeleted: boolean;
  loadError: boolean;
  unitSlug: string;
}) {
  const toastMessage =
    created
      ? "생성 완료"
      : updated
        ? "수정 완료"
        : templateCreated
          ? "생성 완료"
          : templateUpdated
            ? "수정 완료"
            : templateDeleted
              ? "삭제 완료"
              : "";

  return (
    <section id="weekly-reports" className="grid gap-5">
      {toastMessage ? <ToastNotice message={toastMessage} /> : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
            엔젤 주간 보고
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-muted)" }}>
            보고 주차를 만들고 제출 내용을 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={cohortAwarePath(unitSlug, "/admin/reports/templates/new")}
            className="btn-press rounded-full border px-4 py-2 text-sm font-bold"
            style={{
              borderColor: "rgba(13, 127, 242, 0.25)",
              backgroundColor: "var(--accent-weak)",
              color: "var(--accent-strong)",
            }}
          >
            템플릿 만들기
          </Link>
          <Link
            href={cohortAwarePath(unitSlug, "/admin/reports/cycles/new")}
            className="btn-press rounded-full px-4 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            보고 주차 만들기
          </Link>
        </div>
      </div>

      <section className="grid gap-5">
        <div className="card-static overflow-hidden">
          <div className="border-b px-4 py-3 sm:px-5" style={{ borderColor: "var(--line)" }}>
            <h3 className="text-base font-extrabold" style={{ color: "var(--ink)" }}>
              보고 주차
            </h3>
          </div>
          {loadError ? (
            <div className="p-5 text-sm" style={{ color: "var(--ink-muted)" }}>
              데이터를 불러오지 못했습니다. 데이터베이스 연결을 확인해주세요.
            </div>
          ) : cycles.length === 0 ? (
            <div className="p-5 text-sm" style={{ color: "var(--ink-muted)" }}>
              아직 보고 주차가 없습니다.
            </div>
          ) : (
            cycles.map((cycle) => (
              <Link
                key={cycle.id}
                href={cohortAwarePath(unitSlug, `/admin/reports/cycles/${cycle.id}`)}
                className="block border-b p-4 transition last:border-b-0 hover:bg-white/70 sm:p-5"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold" style={{ color: "var(--ink)" }}>
                      {cycle.title}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                      {formatWeekLabel(cycle.weekLabel)}
                      {cycle.dueDate ? ` · 마감 ${cycle.dueDate}` : ""}
                    </p>
                  </div>
                  <span
                    className="rounded-full border px-3 py-1 text-sm font-bold"
                    style={{
                      borderColor: "rgba(13, 127, 242, 0.25)",
                      backgroundColor: "var(--accent-weak)",
                      color: "var(--accent-strong)",
                    }}
                  >
                    제출 {cycle.reportCount}건
                  </span>
                </div>

                <p className="mt-3 line-clamp-1 text-sm leading-6" style={{ color: "var(--ink-muted)" }}>
                  {cycle.prompt || "안내 없음"}
                </p>
              </Link>
            ))
          )}
        </div>

        <div className="card-static overflow-hidden">
          <div className="border-b px-4 py-3 sm:px-5" style={{ borderColor: "var(--line)" }}>
            <h3 className="text-base font-extrabold" style={{ color: "var(--ink)" }}>
              보고 템플릿
            </h3>
          </div>
          {templates.length === 0 ? (
            <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
              저장된 템플릿이 없습니다.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2">
              {templates.map((template) => {
                const editHref = cohortAwarePath(unitSlug, `/admin/reports/templates/${template.id}/edit`);
                return (
                  <article
                    key={template.id}
                    className="grid gap-4 border-b p-4 sm:border-r sm:[&:nth-child(2n)]:border-r-0"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-extrabold" style={{ color: "var(--ink)" }}>
                          {template.name}
                        </p>
                        <span className="rounded-full border px-2 py-0.5 text-xs font-bold" style={{ borderColor: "var(--line)", color: "var(--ink-muted)" }}>
                          {template.sections.length}개 항목
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5" style={{ color: "var(--ink-muted)" }}>
                        {template.prompt}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={editHref}
                        className="btn-press rounded-full border px-3 py-1.5 text-xs font-bold"
                        style={{
                          borderColor: "rgba(13, 127, 242, 0.25)",
                          backgroundColor: "var(--accent-weak)",
                          color: "var(--accent-strong)",
                        }}
                      >
                        수정
                      </Link>
                      <form action={deleteWeeklyReportTemplateAction}>
                        <input type="hidden" name="unit" value={unitSlug} />
                        <input type="hidden" name="templateId" value={template.id} />
                        <DeleteConfirmButton
                          confirmMessage={`"${template.name}" 템플릿을 정말 삭제하시겠습니까?`}
                          className="rounded-full border px-3 py-1.5 text-xs font-bold"
                          style={{
                            borderColor: "#fecaca",
                            backgroundColor: "var(--danger-bg)",
                            color: "var(--danger)",
                          }}
                        >
                          삭제
                        </DeleteConfirmButton>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const query = await searchParams;
  const unitSlug = singleParam(query.unit);
  if (!unitSlug) {
    redirect("/");
  }

  const authenticated = await isAuthenticatedForUnit(unitSlug);
  if (!authenticated) {
    redirect(cohortEntryLoginPath(unitSlug, { auth: "required", returnPath: cohortAwarePath(unitSlug, "/admin/reports") }));
  }

  const currentRole = await getCurrentRolePageRole(unitSlug);
  const page = getRolePage("admin");
  const access = canOpenRolePage("admin", currentRole, getConfiguredRolePages());

  let content;
  if (access === "role-not-configured") {
    content = <RoleNotConfigured label={page.label} />;
  } else if (access === "role-required") {
    content = (
      <RoleAccessRequired
        role="admin"
        label={page.label}
        invalid={singleParam(query.access) === "invalid"}
        returnPath={cohortAwarePath(unitSlug, "/admin/reports")}
        unitSlug={unitSlug}
      />
    );
  } else {
    const overview = await safeListWeeklyReportOverview(unitSlug);
    content = (
      <WeeklyReportAdminPanel
        cycles={overview.cycles}
        templates={overview.templates}
        created={singleParam(query.report) === "created"}
        updated={singleParam(query.report) === "updated"}
        templateCreated={singleParam(query.template) === "created"}
        templateUpdated={singleParam(query.template) === "updated"}
        templateDeleted={singleParam(query.template) === "deleted"}
        loadError={overview.error}
        unitSlug={unitSlug}
      />
    );
  }

  return (
    <RoleShell
      activeRole="admin"
      title="엔젤 주간 보고"
      summary="보고 요청과 제출 내용을 관리합니다."
      unitSlug={unitSlug}
    >
      {content}
    </RoleShell>
  );
}
