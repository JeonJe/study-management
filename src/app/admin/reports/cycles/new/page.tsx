import { redirect } from "next/navigation";
import { BackLink } from "@/app/back-link";
import { PendingSubmitButton } from "@/app/pending-submit-button";
import {
  RoleAccessRequired,
  RoleNotConfigured,
} from "@/app/role-page-view";
import { RoleShell } from "@/app/role-shell";
import { createWeeklyReportCycleAction } from "@/app/weekly-report-actions";
import { isAuthenticatedForUnit } from "@/lib/auth";
import { cohortAwarePath, cohortEntryLoginPath } from "@/lib/cohort-routes";
import { loadMemberPreset } from "@/lib/member-store";
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
  listWeeklyReportTemplates,
} from "@/lib/weekly-report-store";

const FIELD_CLASS = "h-12 w-full rounded-xl border px-3 text-sm";
const TEXTAREA_CLASS = "min-h-28 w-full rounded-xl border px-3 py-3 text-sm";

type NewCyclePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function singleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

async function safeListTemplates(unitSlug: string): Promise<{
  templates: WeeklyReportTemplate[];
  teamCount: number;
  error: boolean;
}> {
  try {
    const [templates, preset] = await Promise.all([
      listWeeklyReportTemplates(unitSlug),
      loadMemberPreset(unitSlug),
    ]);
    return {
      templates,
      teamCount: preset.teamGroups.length,
      error: false,
    };
  } catch (error) {
    console.error("Failed to load weekly report templates", error);
    return {
      templates: [],
      teamCount: 0,
      error: true,
    };
  }
}

function CycleForm({
  templates,
  teamCount,
  loadError,
  unitSlug,
}: {
  templates: WeeklyReportTemplate[];
  teamCount: number;
  loadError: boolean;
  unitSlug: string;
}) {
  return (
    <section className="mx-auto grid max-w-3xl gap-5">
      <div className="card-static p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
              보고 주차 만들기
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-muted)" }}>
              엔젤이 작성할 주간 보고를 엽니다.
            </p>
          </div>
          <BackLink href={cohortAwarePath(unitSlug, "/admin/reports")}>목록으로</BackLink>
        </div>

        {loadError ? (
          <div className="mt-5 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--line)", color: "var(--ink-muted)" }}>
            템플릿을 불러오지 못했습니다. 템플릿 없이 주차를 만들 수 있습니다.
          </div>
        ) : null}

        {!loadError && teamCount === 0 ? (
          <div className="mt-5 rounded-xl border p-4 text-sm leading-6" style={{ borderColor: "#fde68a", backgroundColor: "#fffbeb", color: "#92400e" }}>
            등록된 팀이 없습니다. 보고 주차는 만들 수 있지만, 팀을 추가한 뒤 이 주차의 보고 대상이 현재 팀 목록 기준으로 표시됩니다.
          </div>
        ) : null}

        <form action={createWeeklyReportCycleAction} className="mt-6 grid gap-5">
          <input type="hidden" name="unit" value={unitSlug} />
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="grid gap-2 text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>
              제목
              <input
                name="title"
                required
                placeholder="4기 3주차 엔젤 보고"
                className={FIELD_CLASS}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>
              주차
              <input
                name="weekLabel"
                required
                placeholder="3주차"
                className={FIELD_CLASS}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>
            사용할 템플릿
            <select
              name="templateId"
              className={FIELD_CLASS}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              defaultValue=""
            >
              <option value="">선택 안 함</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>
              시작일
              <input
                name="startDate"
                type="date"
                className={FIELD_CLASS}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>
              마감일
              <input
                name="dueDate"
                type="date"
                className={FIELD_CLASS}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>
            안내 문구
            <textarea
              name="prompt"
              placeholder="비워두면 선택한 템플릿의 안내를 사용합니다."
              rows={4}
              className={TEXTAREA_CLASS}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            />
          </label>

          <div className="flex justify-end">
            <PendingSubmitButton
              idleLabel="생성"
              pendingLabel="생성 중"
              className="btn-press h-12 min-w-32 rounded-full px-6 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70"
              style={{ backgroundColor: "var(--accent)" }}
            />
          </div>
        </form>
      </div>
    </section>
  );
}

export default async function NewWeeklyReportCyclePage({
  searchParams,
}: NewCyclePageProps) {
  const query = await searchParams;
  const unitSlug = singleParam(query.unit);
  if (!unitSlug) {
    redirect("/");
  }

  const authenticated = await isAuthenticatedForUnit(unitSlug);
  if (!authenticated) {
    redirect(cohortEntryLoginPath(unitSlug, { auth: "required", returnPath: cohortAwarePath(unitSlug, "/admin/reports/cycles/new") }));
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
        returnPath={cohortAwarePath(unitSlug, "/admin/reports/cycles/new")}
        unitSlug={unitSlug}
      />
    );
  } else {
    const { templates, teamCount, error } = await safeListTemplates(unitSlug);
    content = <CycleForm templates={templates} teamCount={teamCount} loadError={error} unitSlug={unitSlug} />;
  }

  return (
    <RoleShell
      activeRole="admin"
      title="보고 주차"
      summary="주차별 엔젤 보고를 생성합니다."
      unitSlug={unitSlug}
    >
      {content}
    </RoleShell>
  );
}
