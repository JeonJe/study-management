import Link from "next/link";
import { redirect } from "next/navigation";
import {
  RoleAccessRequired,
  RoleNotConfigured,
} from "@/app/role-page-view";
import { RoleShell } from "@/app/role-shell";
import { ToastNotice } from "@/app/toast-notice";
import {
  deleteAngelWeeklyReportAction,
  submitAngelWeeklyReportAction,
} from "@/app/weekly-report-actions";
import { WeeklyReportEditDialog } from "@/app/weekly-report-edit-dialog";
import { isAuthenticatedForUnit } from "@/lib/auth";
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
import { cohortAwarePath, cohortEntryLoginPath } from "@/lib/cohort-routes";
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

type AngelTeamReportPageProps = {
  params: Promise<{ cycleId: string; teamName: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type AngelTeamReportPageData = {
  cycle: WeeklyReportCycle | null;
  template: WeeklyReportTemplate | null;
  team: TeamMemberGroup | null;
  report: AngelWeeklyReport | null;
  error: boolean;
};

function singleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function decodeTeamName(value: string): string {
  try {
    const decoded = decodeURIComponent(value);
    return decoded === value ? decoded : decodeTeamName(decoded);
  } catch {
    return value;
  }
}

async function loadAngelTeamReportPageData(
  cycleId: string,
  teamName: string,
  unitSlug: string
): Promise<AngelTeamReportPageData> {
  try {
    const [cycle, preset] = await Promise.all([
      getWeeklyReportCycleById(cycleId, unitSlug),
      loadMemberPreset(unitSlug),
    ]);
    const team = preset.teamGroups.find((group) => group.teamName === teamName) ?? null;
    const [reports, template] = cycle
      ? await Promise.all([
          listAngelWeeklyReports(cycle.id, unitSlug),
          getWeeklyReportTemplateById(cycle.templateId, unitSlug),
        ])
      : [[], null];

    const report = reports.find((item) => item.teamName === teamName) ?? null;

    return {
      cycle,
      template,
      team,
      report,
      error: false,
    };
  } catch (error) {
    console.error("Failed to load angel team weekly report data", error);
    return {
      cycle: null,
      template: null,
      team: null,
      report: null,
      error: true,
    };
  }
}

function ReportErrorCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <article className="card-static p-5 sm:p-6">
      <h2 className="text-lg font-extrabold" style={{ color: "var(--ink)" }}>
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-muted)" }}>
        {message}
      </p>
    </article>
  );
}

function shortDateTime(value: string): string {
  return formatShortDateTime(value);
}

function TeamReportForm({
  cycle,
  template,
  team,
  report,
  submitted,
  unsubmitted,
  unitSlug,
}: {
  cycle: WeeklyReportCycle;
  template: WeeklyReportTemplate | null;
  team: TeamMemberGroup;
  report: AngelWeeklyReport | null;
  submitted: boolean;
  unsubmitted: boolean;
  unitSlug: string;
}) {
  const templateText =
    template?.prompt || cycle.prompt || "팀 분위기, 참여 상황, 도움이 필요한 부분을 자유롭게 적어주세요.";
  const templateName = template?.name ?? "기본 템플릿";
  const templateSections = template?.sections ?? DEFAULT_WEEKLY_REPORT_TEMPLATE_SECTIONS;
  const reportListPath = cohortAwarePath(unitSlug, `/angel/reports/${cycle.id}`);
  const returnPath = cohortAwarePath(unitSlug, `/angel/reports/${cycle.id}/teams/${team.teamName}`);
  const defaultAngelName =
    report?.angelName && team.angels.includes(report.angelName)
      ? report.angelName
      : team.angels[0] ?? "";
  const formId = `weekly-report-edit-${cycle.id}-${team.teamName}`;
  const fieldByKey = {
    summary: {
      name: "summary",
      rows: 7,
      value: report?.summary ?? "",
    },
    notes: {
      name: "notes",
      rows: 4,
      value: report?.notes ?? "",
    },
    requests: {
      name: "requests",
      rows: 4,
      value: report?.requests ?? "",
    },
    actionItems: {
      name: "actionItems",
      rows: 4,
      value: report?.actionItems ?? "",
    },
  } as const;

  return (
    <section className="grid gap-4">
      {submitted ? <ToastNotice message="저장 완료" /> : null}
      {unsubmitted ? <ToastNotice message="변경 완료" /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={reportListPath}
          className="rounded-full border px-3 py-1 text-sm font-bold"
          style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
        >
          팀 목록
        </Link>
      </div>

      <article className="card-static p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
              {team.teamName} 보고
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-muted)" }}>
              엔젤 {team.angels.length > 0 ? team.angels.join(", ") : "미지정"}
              {report ? ` · ${report.angelName}${shortDateTime(report.updatedAt) ? ` · ${shortDateTime(report.updatedAt)}` : ""}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {report ? (
              <form action={deleteAngelWeeklyReportAction}>
                <input type="hidden" name="unit" value={unitSlug} />
                <input type="hidden" name="cycleId" value={cycle.id} />
                <input type="hidden" name="reportId" value={report.id} />
                <input type="hidden" name="returnPath" value={returnPath} />
                <button
                  type="submit"
                  className="btn-press rounded-full border px-3 py-1 text-sm font-bold"
                  style={{
                    borderColor: "var(--line)",
                    backgroundColor: "var(--surface)",
                    color: "var(--ink-soft)",
                  }}
                >
                  미제출
                </button>
              </form>
            ) : null}
            <WeeklyReportEditDialog
              triggerLabel={report ? "수정" : "작성"}
              hasReport={Boolean(report)}
              title={`${team.teamName} 보고 ${report ? "수정" : "작성"}`}
              description="저장하면 상세 화면의 보고 내용이 갱신됩니다."
              badge={team.teamName}
              formId={formId}
            >
            <form id={formId} action={submitAngelWeeklyReportAction} className="grid gap-4">
              <input type="hidden" name="unit" value={unitSlug} />
              <input type="hidden" name="cycleId" value={cycle.id} />
              <input type="hidden" name="teamName" value={team.teamName} />
              <input type="hidden" name="returnPath" value={returnPath} />

              <div
                className="grid gap-3 rounded-xl border px-4 py-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start"
                style={{ borderColor: "var(--line)", backgroundColor: "var(--surface-alt)" }}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold" style={{ color: "var(--ink)" }}>
                      보고 템플릿
                    </p>
                    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-bold" style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)", color: "var(--ink-soft)" }}>
                      {templateName}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-soft)" }}>
                    {templateText}
                  </p>
                </div>
                <label className="grid gap-2 text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>
                  작성자
                  {team.angels.length > 0 ? (
                    <select
                      name="angelName"
                      required
                      className="h-11 rounded-xl border bg-white px-3 text-sm"
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                      defaultValue={defaultAngelName}
                    >
                      {team.angels.map((angel) => (
                        <option key={`${team.teamName}-${angel}`} value={angel}>
                          {angel}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="angelName"
                      required
                      placeholder="작성자 이름"
                      defaultValue={report?.angelName ?? ""}
                      className="h-11 rounded-xl border bg-white px-3 text-sm"
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    />
                  )}
                </label>
              </div>

              <section className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "var(--line)" }}>
                {templateSections.map((section, index) => {
                  const field = fieldByKey[section.key];
                  return (
                    <label
                      key={`edit-${section.key}-${index}`}
                      className="grid border-b last:border-b-0 lg:grid-cols-[200px_minmax(0,1fr)]"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <div className="px-4 py-4">
                        <p className="text-sm font-extrabold" style={{ color: "var(--ink)" }}>
                          {section.title}
                        </p>
                        {section.prompt ? (
                          <p className="mt-1 text-xs font-medium leading-5" style={{ color: "var(--ink-muted)" }}>
                            {section.prompt}
                          </p>
                        ) : null}
                      </div>
                      <div className="border-t p-3 lg:border-l lg:border-t-0" style={{ borderColor: "var(--line)" }}>
                        <textarea
                          name={field.name}
                          required={section.required}
                          rows={field.rows}
                          placeholder="내용을 입력하세요."
                          defaultValue={field.value}
                          className="w-full resize-y rounded-lg border px-3 py-3 text-sm font-medium leading-6"
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        />
                      </div>
                    </label>
                  );
                })}
              </section>
            </form>
            </WeeklyReportEditDialog>
          </div>
        </div>

        <div className="mt-5 border-t pt-5" style={{ borderColor: "var(--line)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--ink-muted)" }}>
            보고 템플릿
          </p>
          <span className="mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold" style={{ borderColor: "var(--line)", backgroundColor: "var(--surface-alt)", color: "var(--ink-soft)" }}>
            {templateName}
          </span>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-soft)" }}>
            {templateText}
          </p>
        </div>

        <section className="mt-5 border-t" style={{ borderColor: "var(--line)" }}>
          {templateSections.map((section, index) => {
            const field = fieldByKey[section.key];
            return (
              <div
                key={`readonly-${section.key}-${index}`}
                className="border-b py-4 last:border-b-0"
                style={{ borderColor: "var(--line)" }}
              >
                <h3 className="text-sm font-extrabold" style={{ color: "var(--ink)" }}>
                  {section.title}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7" style={{ color: field.value ? "var(--ink-soft)" : "var(--ink-muted)" }}>
                  {field.value || "아직 작성된 내용이 없습니다."}
                </p>
              </div>
            );
          })}
        </section>
      </article>

    </section>
  );
}

export default async function AngelTeamReportPage({
  params,
  searchParams,
}: AngelTeamReportPageProps) {
  const [routeParams, query] = await Promise.all([params, searchParams]);
  const unitSlug = singleParam(query.unit);
  if (!unitSlug) {
    redirect("/");
  }

  const authenticated = await isAuthenticatedForUnit(unitSlug);
  if (!authenticated) {
    redirect(cohortEntryLoginPath(unitSlug, {
      auth: "required",
      returnPath: cohortAwarePath(
        unitSlug,
        `/angel/reports/${encodeURIComponent(routeParams.cycleId)}/teams/${encodeURIComponent(routeParams.teamName)}`
      ),
    }));
  }

  const currentRole = await getCurrentRolePageRole(unitSlug);
  const page = getRolePage("angel");
  const access = canOpenRolePage("angel", currentRole, getConfiguredRolePages());
  const teamName = decodeTeamName(routeParams.teamName);

  let content;
  if (access === "role-not-configured") {
    content = <RoleNotConfigured label={page.label} />;
  } else if (access === "role-required") {
    content = (
      <RoleAccessRequired
        role="angel"
        label={page.label}
        invalid={singleParam(query.access) === "invalid"}
        returnPath={cohortAwarePath(
          unitSlug,
          `/angel/reports/${encodeURIComponent(routeParams.cycleId)}/teams/${encodeURIComponent(routeParams.teamName)}`
        )}
        unitSlug={unitSlug}
      />
    );
  } else {
    const unitSlug = singleParam(query.unit);
    const data = await loadAngelTeamReportPageData(routeParams.cycleId, teamName, unitSlug);

    if (data.error) {
      content = (
        <ReportErrorCard
          title="데이터를 불러오지 못했습니다"
          message="데이터베이스 연결을 확인한 뒤 다시 시도해주세요."
        />
      );
    } else if (!data.cycle) {
      content = (
        <ReportErrorCard
          title="보고 주차를 찾을 수 없습니다"
          message="주간 보고 목록에서 다시 선택해주세요."
        />
      );
    } else if (!data.team) {
      content = (
        <ReportErrorCard
          title="팀을 찾을 수 없습니다"
          message="팀 목록에서 다시 선택해주세요."
        />
      );
    } else {
      content = (
        <TeamReportForm
          cycle={data.cycle}
          template={data.template}
          team={data.team}
          report={data.report}
          submitted={singleParam(query.report) === "submitted"}
          unsubmitted={singleParam(query.report) === "unsubmitted"}
          unitSlug={unitSlug}
        />
      );
    }
  }

  return (
    <RoleShell
      activeRole="angel"
      title={`${teamName} 주간 보고`}
      summary="보고 내용을 작성합니다."
      unitSlug={unitSlug}
    >
      {content}
    </RoleShell>
  );
}
