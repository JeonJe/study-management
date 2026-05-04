import Link from "next/link";
import { redirect } from "next/navigation";
import { BackLink } from "@/app/back-link";
import {
  RoleAccessRequired,
  RoleNotConfigured,
} from "@/app/role-page-view";
import { RoleShell } from "@/app/role-shell";
import { isAuthenticatedForUnit } from "@/lib/auth";
import { cohortAwarePath, cohortEntryLoginPath } from "@/lib/cohort-routes";
import {
  type TeamMemberGroup,
  loadMemberPreset,
} from "@/lib/member-store";
import {
  canOpenRolePage,
  getRolePage,
} from "@/lib/role-page";
import {
  getConfiguredRolePages,
  getCurrentRolePageRole,
} from "@/lib/role-session";
import {
  type AngelWeeklyReport,
  type WeeklyReportCycle,
  type WeeklyReportTemplate,
  DEFAULT_WEEKLY_REPORT_TEMPLATE_SECTIONS,
  getWeeklyReportCycleById,
  getWeeklyReportTemplateById,
  listAngelWeeklyReports,
} from "@/lib/weekly-report-store";
import { formatShortDateTime } from "@/lib/date-utils";

type AdminReportCycleDetailPageProps = {
  params: Promise<{ cycleId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type AdminReportCycleDetailData = {
  cycle: WeeklyReportCycle | null;
  template: WeeklyReportTemplate | null;
  teamGroups: TeamMemberGroup[];
  reports: AngelWeeklyReport[];
  error: boolean;
};

function singleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function shortDateTime(value: string): string {
  return formatShortDateTime(value);
}

function formatWeekLabel(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.endsWith("주차") ? normalized : `${normalized}주차`;
}

async function safeLoadCycleDetail(
  cycleId: string,
  unitSlug: string
): Promise<AdminReportCycleDetailData> {
  try {
    const [cycle, preset] = await Promise.all([
      getWeeklyReportCycleById(cycleId, unitSlug),
      loadMemberPreset(unitSlug),
    ]);
    const [reports, template] = cycle
      ? await Promise.all([
          listAngelWeeklyReports(cycle.id, unitSlug),
          getWeeklyReportTemplateById(cycle.templateId, unitSlug),
        ])
      : [[], null];
    return {
      cycle,
      template,
      teamGroups: preset.teamGroups,
      reports,
      error: false,
    };
  } catch (error) {
    console.error("Failed to load admin weekly report cycle detail", error);
    return {
      cycle: null,
      template: null,
      teamGroups: [],
      reports: [],
      error: true,
    };
  }
}

function reportValue(
  report: AngelWeeklyReport,
  key: "summary" | "notes" | "requests" | "actionItems"
): string {
  return report[key] ?? "";
}

function CycleDetailPanel({
  cycle,
  template,
  teamGroups,
  reports,
  loadError,
  unitSlug,
}: {
  cycle: WeeklyReportCycle | null;
  template: WeeklyReportTemplate | null;
  teamGroups: TeamMemberGroup[];
  reports: AngelWeeklyReport[];
  loadError: boolean;
  unitSlug: string;
}) {
  if (loadError) {
    return (
      <section className="card-static p-5 text-sm" style={{ color: "var(--ink-muted)" }}>
        데이터를 불러오지 못했습니다. 데이터베이스 연결을 확인해주세요.
      </section>
    );
  }

  if (!cycle) {
    return (
      <section className="card-static p-5 text-sm" style={{ color: "var(--ink-muted)" }}>
        보고 주차를 찾을 수 없습니다.
      </section>
    );
  }

  const submittedTeamNames = new Set(reports.map((report) => report.teamName));
  const missingTeams = teamGroups.filter((team) => !submittedTeamNames.has(team.teamName));
  const sections = template?.sections ?? DEFAULT_WEEKLY_REPORT_TEMPLATE_SECTIONS;
  const prompt = template?.prompt || cycle.prompt || "팀 분위기, 참여 상황, 도움이 필요한 부분을 자유롭게 적어주세요.";
  const weekLabel = formatWeekLabel(cycle.weekLabel);

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink href={cohortAwarePath(unitSlug, "/admin/reports")}>목록으로</BackLink>
        <Link
          href={cohortAwarePath(unitSlug, `/admin/reports/cycles/${cycle.id}/edit`)}
          className="btn-press rounded-full px-4 py-2 text-sm font-bold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          수정
        </Link>
      </div>

      <article className="card-static p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
              {cycle.title}
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-muted)" }}>
              {weekLabel}
              {cycle.dueDate ? ` · 마감 ${cycle.dueDate}` : ""}
              {template ? ` · 보고 템플릿 ${template.name}` : " · 템플릿 없음"}
            </p>
          </div>
          <span
            className="inline-flex h-9 items-center rounded-full border px-3 text-sm font-extrabold"
            style={{
              borderColor: "rgba(13, 127, 242, 0.22)",
              backgroundColor: "var(--accent-weak)",
              color: "var(--accent-strong)",
            }}
          >
            제출 현황 {submittedTeamNames.size}/{teamGroups.length}
          </span>
        </div>

        <div className="mt-4 rounded-xl border px-4 py-3 text-sm leading-6" style={{ borderColor: "var(--line)", backgroundColor: "var(--surface-alt)", color: "var(--ink-soft)" }}>
          <span className="font-bold" style={{ color: "var(--ink)" }}>
            안내
          </span>
          <span className="ml-2">{prompt}</span>
        </div>
      </article>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-3">
          {reports.length === 0 ? (
            <article className="card-static p-5 text-sm" style={{ color: "var(--ink-muted)" }}>
              제출된 보고가 없습니다.
            </article>
          ) : (
            reports.map((report) => (
              <article key={report.id} className="card-static p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold" style={{ color: "var(--ink)" }}>
                    {report.teamName}
                  </h3>
                  <span className="text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>
                    {report.angelName}
                    {shortDateTime(report.updatedAt) ? ` · ${shortDateTime(report.updatedAt)}` : ""}
                  </span>
                </div>

                <dl className="mt-4 border-t text-sm" style={{ borderColor: "var(--line)" }}>
                  {sections.map((section) => {
                    const value = reportValue(report, section.key);
                    if (!value) return null;
                    return (
                      <div key={section.key} className="grid gap-1 border-b py-4 last:border-b-0 sm:grid-cols-[160px_minmax(0,1fr)]" style={{ borderColor: "var(--line)" }}>
                        <dt className="font-extrabold" style={{ color: "var(--ink)" }}>
                          {section.title}
                        </dt>
                        <dd className="whitespace-pre-wrap leading-6" style={{ color: "var(--ink-soft)" }}>
                          {value}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </article>
            ))
          )}
        </div>

        <aside className="card-static p-5">
          <h3 className="text-base font-extrabold" style={{ color: "var(--ink)" }}>
            미제출 팀
          </h3>
          <p className="mt-1 text-xs leading-5" style={{ color: "var(--ink-muted)" }}>
            현재 등록된 팀 기준
          </p>
          {teamGroups.length === 0 ? (
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--ink-muted)" }}>
              등록된 팀이 없습니다. 멤버 관리에서 팀과 엔젤을 추가하면 이 주차의 보고 대상이 표시됩니다.
            </p>
          ) : missingTeams.length === 0 ? (
            <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
              모든 팀이 제출했습니다.
            </p>
          ) : (
            <div className="mt-3 grid gap-2">
              {missingTeams.map((team) => (
                <div key={team.teamName} className="border-t py-3 first:border-t-0" style={{ borderColor: "var(--line)" }}>
                  <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                    {team.teamName}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                    엔젤 {team.angels.length > 0 ? team.angels.join(", ") : "미지정"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </section>
  );
}

export default async function AdminReportCycleDetailPage({
  params,
  searchParams,
}: AdminReportCycleDetailPageProps) {
  const [routeParams, query] = await Promise.all([params, searchParams]);
  const unitSlug = singleParam(query.unit);
  const detailPath = `/admin/reports/cycles/${encodeURIComponent(routeParams.cycleId)}`;
  if (!unitSlug) {
    redirect("/");
  }

  const authenticated = await isAuthenticatedForUnit(unitSlug);
  if (!authenticated) {
    redirect(cohortEntryLoginPath(unitSlug, { auth: "required", returnPath: cohortAwarePath(unitSlug, detailPath) }));
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
        returnPath={cohortAwarePath(unitSlug, detailPath)}
        unitSlug={unitSlug}
      />
    );
  } else {
    const data = await safeLoadCycleDetail(routeParams.cycleId, unitSlug);
    content = (
      <CycleDetailPanel
        cycle={data.cycle}
        template={data.template}
        teamGroups={data.teamGroups}
        reports={data.reports}
        loadError={data.error}
        unitSlug={unitSlug}
      />
    );
  }

  return (
    <RoleShell
      activeRole="admin"
      title="주간 보고 상세"
      summary="팀별 제출 현황과 보고 내용을 확인합니다."
      unitSlug={singleParam(query.unit)}
    >
      {content}
    </RoleShell>
  );
}
