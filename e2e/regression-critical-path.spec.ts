import { expect, test, type Page } from "@playwright/test";
import { submitServerActionAndFollowRedirect } from "./support/server-action";

// 상태 누적형 크리티컬 패스입니다.
// 새 운영 단위 하나를 만들고 그 안에서 운영진/팀/보고/모임/뒷풀이/통계/삭제까지 순차 검증합니다.
// 실제 DB에 쓰기/삭제를 수행하므로 기본 비활성화합니다.
// 수동으로 점검할 때만 RUN_CRITICAL_PATH_E2E=1을 지정하세요. 병렬 실행이나 재시도는 중간 데이터가 겹쳐 오탐/오염이 생길 수 있습니다.

const RUN_ID = Date.now().toString(36);
const UNIT = {
  slug: `e2e-critical-${RUN_ID}`,
  name: `E2E 크리티컬 운영 단위 ${RUN_ID}`,
  accessCode: `access-${RUN_ID}`,
  angelCode: `angel-${RUN_ID}`,
  adminCode: `admin-${RUN_ID}`,
};
const DATE = "2026-10-01";
const NAMES = {
  angel: `크리티컬엔젤-${RUN_ID}`,
  angelEdited: `크리티컬엔젤수정-${RUN_ID}`,
  mentor: `크리티컬멘토-${RUN_ID}`,
  manager: `크리티컬매니저-${RUN_ID}`,
  managerDeleted: `크리티컬삭제매니저-${RUN_ID}`,
  supporter: `크리티컬서포터-${RUN_ID}`,
  buddy: `크리티컬버디-${RUN_ID}`,
  teamA: `크리티컬A팀-${RUN_ID}`,
  teamAEdited: `크리티컬A팀수정-${RUN_ID}`,
  teamB: `크리티컬B팀-${RUN_ID}`,
  teamAngelA: `크리티컬팀엔젤A-${RUN_ID}`,
  teamAngelB: `크리티컬팀엔젤B-${RUN_ID}`,
  memberA: `크리티컬멤버A-${RUN_ID}`,
  memberB: `크리티컬멤버B-${RUN_ID}`,
  reportTitle: `크리티컬 주간보고 ${RUN_ID}`,
  studyTitle: `크리티컬스터디-${RUN_ID}`,
  studyTitleEdited: `크리티컬스터디수정-${RUN_ID}`,
  loopPakTitle: `크리티컬루프팩-${RUN_ID}`,
  afterpartyTitle: `크리티컬뒷풀이-${RUN_ID}`,
  afterpartyTitleEdited: `크리티컬뒷풀이수정-${RUN_ID}`,
};

type OperationRoleLabel = "엔젤" | "멘토" | "매니저" | "서포터" | "버디";

function unitPath(path: string): string {
  return `/cohorts/${UNIT.slug}${path}`;
}

function operationSection(page: Page) {
  return page.locator("section.app-section").filter({ has: page.locator("p", { hasText: /^운영진$/ }) });
}

function rosterSection(page: Page) {
  return page.locator("section.app-section").filter({ has: page.locator("p", { hasText: /^멤버 명단$/ }) });
}

async function waitForSave(page: Page): Promise<void> {
  await expect(page.getByText("저장 중")).toHaveCount(0, { timeout: 10_000 });
}

async function loginGlobalAdmin(page: Page): Promise<void> {
  const password = process.env.APP_PASSWORD?.trim();
  if (!password) throw new Error("APP_PASSWORD가 없어서 전체관리자 E2E를 실행할 수 없습니다.");

  await page.goto("/?adminAuth=open");
  await page.locator('form:has(input[name="authScope"][value="admin"]) input[name="password"]').fill(password);
  await submitServerActionAndFollowRedirect(page, () =>
    page.locator('form:has(input[name="authScope"][value="admin"]) button.login-submit').click()
  );
  await expect(page).toHaveURL(/\/admin$/);
}

async function createOperatingUnit(page: Page): Promise<void> {
  await loginGlobalAdmin(page);
  await page.goto("/admin/operating-units");
  if ((await page.getByRole("link", { name: `${UNIT.name} 상세 보기` }).count()) > 0) return;

  await page.getByRole("link", { name: "새 기수 만들기" }).click();
  await page.getByLabel("접속 주소").fill(UNIT.slug);
  await page.getByLabel("이름").fill(UNIT.name);
  await page.getByLabel("설명").fill("크리티컬 패스 E2E 전용 운영 단위");
  await page.getByLabel("입장 코드").fill(UNIT.accessCode);
  await page.getByLabel("엔젤 코드").fill(UNIT.angelCode);
  await page.getByLabel("관리자 코드").fill(UNIT.adminCode);
  await submitServerActionAndFollowRedirect(page, () => page.getByRole("button", { name: "생성" }).click());
  await expect(page.getByRole("link", { name: `${UNIT.name} 상세 보기` })).toBeVisible();
}

async function loginUnitAdmin(page: Page): Promise<void> {
  await page.goto(unitPath(`/entry?returnPath=${encodeURIComponent(unitPath("/admin"))}`));
  await page.getByLabel("입장 코드").fill(UNIT.accessCode);
  await submitServerActionAndFollowRedirect(page, () =>
    page.locator('form:has(input[name="authScope"][value="unit"]) button.login-submit').click()
  );
  await expect(page).toHaveURL(new RegExp(`/cohorts/${UNIT.slug}/admin`));

  await page.getByLabel("비밀번호").fill(UNIT.adminCode);
  await submitServerActionAndFollowRedirect(page, () => page.getByRole("button", { name: "열기" }).click());
  await expect(page.getByText("멤버/팀/엔젤 배정")).toBeVisible();
}

async function deleteOperatingUnit(page: Page): Promise<void> {
  await loginGlobalAdmin(page);
  await page.goto(`/admin/operating-units/${UNIT.slug}`);
  const deleteButton = page.getByRole("button", { name: "삭제" }).first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
  const dialog = page.getByRole("dialog", { name: "기수를 삭제할까요?" });
  await expect(dialog).toBeVisible();
  await submitServerActionAndFollowRedirect(page, () => dialog.getByRole("button", { name: "삭제" }).click());
  await expect(page).toHaveURL(/\/admin\/operating-units\?unit=deleted/);
  await expect(page.getByRole("link", { name: `${UNIT.name} 상세 보기` })).toHaveCount(0);

  await page.goto(unitPath("/entry"));
  await expect(page).toHaveURL(/\/\?entry=unit-not-found/);
  await expect(
    page.getByRole("alert").filter({ hasText: "요청한 입장 페이지를 찾을 수 없습니다." })
  ).toBeVisible();
}

async function openOperationDialog(page: Page, label: OperationRoleLabel) {
  await operationSection(page).getByRole("button").filter({ hasText: label }).first().click();
  const dialog = page.getByRole("dialog", { name: label });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function addOperationMember(page: Page, label: OperationRoleLabel, name: string): Promise<void> {
  const dialog = await openOperationDialog(page, label);
  await dialog.getByLabel("이름").fill(name);
  await dialog.getByRole("button", { name: "추가" }).click();
  await waitForSave(page);
  await dialog.getByRole("button", { name: "취소" }).click({ timeout: 1_000 }).catch(() => {});
  await expect(operationSection(page).getByRole("button").filter({ hasText: label }).filter({ hasText: name }).first()).toBeVisible();
}

async function editOperationMember(page: Page, label: OperationRoleLabel, from: string, to: string): Promise<void> {
  const dialog = await openOperationDialog(page, label);
  const rows = dialog.locator("li");
  const count = await rows.count();
  let row = rows.first();
  let found = false;
  for (let index = 0; index < count; index += 1) {
    const candidate = rows.nth(index);
    const value = await candidate.locator("input").first().inputValue().catch(() => "");
    if (value !== from) continue;
    row = candidate;
    found = true;
    break;
  }
  expect(found, `${label} 명단에서 ${from} 행을 찾지 못했습니다.`).toBe(true);

  await row.locator("input").fill(to);
  await row.getByRole("button", { name: "수정" }).click();
  await waitForSave(page);
  await dialog.getByRole("button", { name: "취소" }).click({ timeout: 1_000 }).catch(() => {});
  await expect(operationSection(page).getByRole("button").filter({ hasText: to }).first()).toBeVisible();
}

async function removeOperationMember(page: Page, label: OperationRoleLabel, name: string): Promise<void> {
  const dialog = await openOperationDialog(page, label);
  const rows = dialog.locator("li");
  const count = await rows.count();
  let row = rows.first();
  let found = false;
  for (let index = 0; index < count; index += 1) {
    const candidate = rows.nth(index);
    const value = await candidate.locator("input").first().inputValue().catch(() => "");
    if (value !== name) continue;
    row = candidate;
    found = true;
    break;
  }
  expect(found, `${label} 명단에서 ${name} 행을 찾지 못했습니다.`).toBe(true);

  await row.getByRole("button", { name: "삭제" }).click();
  await waitForSave(page);
  await dialog.getByRole("button", { name: "취소" }).click({ timeout: 1_000 }).catch(() => {});
  await expect(operationSection(page).getByRole("button").filter({ hasText: name })).toHaveCount(0);
}

async function addTeam(page: Page, teamName: string, angel: string, members: string): Promise<void> {
  await rosterSection(page).getByRole("button", { name: "추가" }).click();
  const dialog = page.getByRole("dialog", { name: "팀 추가" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("팀명").fill(teamName);
  await dialog.getByLabel("팀 엔젤").fill(angel);
  await dialog.getByLabel("멤버").fill(members);
  await dialog.getByRole("button", { name: "추가" }).click();
  await waitForSave(page);
  await expect(rosterSection(page).getByRole("button").filter({ hasText: teamName }).first()).toBeVisible();
}

async function editTeam(page: Page): Promise<void> {
  await rosterSection(page).getByRole("button").filter({ hasText: NAMES.teamA }).first().click();
  const dialog = page.getByRole("dialog", { name: "팀 수정" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("팀 이름").fill(NAMES.teamAEdited);
  await dialog.getByPlaceholder("멤버 이름 입력").fill(NAMES.memberB);
  await dialog.getByRole("button", { name: "추가" }).last().click();
  await dialog.getByRole("button", { name: "저장" }).click();
  await waitForSave(page);
  const card = rosterSection(page).getByRole("button").filter({ hasText: NAMES.teamAEdited }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText(NAMES.memberB);
}

async function deleteTeam(page: Page, teamName: string): Promise<void> {
  await rosterSection(page).getByRole("button").filter({ hasText: teamName }).first().click();
  const dialog = page.getByRole("dialog", { name: "팀 수정" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "삭제", exact: true }).click();
  await waitForSave(page);
  await expect(rosterSection(page).getByRole("button").filter({ hasText: teamName })).toHaveCount(0);
}

async function createReportCycle(page: Page): Promise<string> {
  await page.goto(unitPath("/admin/reports/cycles/new"));
  await page.getByLabel("제목").fill(NAMES.reportTitle);
  await page.getByLabel("주차").fill("1주차");
  await page.getByLabel("시작일").fill(DATE);
  await page.getByLabel("마감일").fill("2026-10-07");
  await page.getByLabel("안내 문구").fill("크리티컬 패스 보고 안내");
  await submitServerActionAndFollowRedirect(page, () => page.getByRole("button", { name: "생성" }).click());
  await expect(page.getByText(NAMES.reportTitle)).toBeVisible();
  const href = await page.getByRole("link").filter({ hasText: NAMES.reportTitle }).first().getAttribute("href");
  if (!href) throw new Error("보고 주차 상세 링크를 찾지 못했습니다.");
  return new URL(href, "http://localhost").pathname.split("/").at(-1) ?? "";
}

async function submitWeeklyReport(page: Page, cycleId: string): Promise<void> {
  await page.goto(unitPath(`/angel/reports/${cycleId}/teams/${encodeURIComponent(NAMES.teamAEdited)}`));
  await page.getByRole("button", { name: "작성" }).click();
  const dialog = page.getByRole("dialog", { name: `${NAMES.teamAEdited} 보고 작성` });
  await expect(dialog).toBeVisible();
  await dialog.locator('textarea[name="summary"]').fill("팀 분위기 양호");
  await dialog.locator('textarea[name="notes"]').fill("참여 안정");
  await dialog.locator('textarea[name="requests"]').fill("요청 없음");
  await dialog.locator('textarea[name="actionItems"]').fill("다음 주 유지");
  await submitServerActionAndFollowRedirect(page, () => dialog.getByRole("button", { name: "저장" }).click());
  await expect(page.getByText("저장 완료")).toBeVisible();

  await page.getByRole("button", { name: "수정" }).click();
  const editDialog = page.getByRole("dialog", { name: `${NAMES.teamAEdited} 보고 수정` });
  await editDialog.locator('textarea[name="summary"]').fill("팀 분위기 매우 양호");
  await submitServerActionAndFollowRedirect(page, () => editDialog.getByRole("button", { name: "저장" }).click());
  await expect(page.getByText("팀 분위기 매우 양호")).toBeVisible();
}

async function verifyAdminReportSubmission(page: Page, cycleId: string): Promise<void> {
  await page.goto(unitPath(`/admin/reports/cycles/${cycleId}`));
  await expect(page.getByText(NAMES.teamAEdited).first()).toBeVisible();
  await expect(page.getByText("팀 분위기 매우 양호")).toBeVisible();
  await expect(page.getByText("미제출 팀")).toBeVisible();
}

async function unsubmitWeeklyReport(page: Page, cycleId: string): Promise<void> {
  await page.goto(unitPath(`/angel/reports/${cycleId}/teams/${encodeURIComponent(NAMES.teamAEdited)}`));
  await submitServerActionAndFollowRedirect(page, () => page.getByRole("button", { name: "미제출" }).click());
  await expect(page.getByText("변경 완료")).toBeVisible();
  await expect(page.getByRole("button", { name: "작성" })).toBeVisible();
  await expect(page.getByText("팀 분위기 매우 양호")).toHaveCount(0);
}

async function createMeeting(page: Page, section: "study" | "loop-pak", title: string): Promise<string> {
  await page.goto(unitPath(`/${section}?date=${DATE}`));
  const fab = page.locator("details:has(summary.fab-pulse)");
  await fab.locator("summary").click();
  await fab.locator('input[name="title"]').fill(title);
  await fab.locator('input[name="location"]').fill(`${title} 장소`);
  await fab.locator('input[data-leader-input="true"]').fill(NAMES.memberA);
  await fab.locator('button[type="button"]:has-text("추가")').click();
  await submitServerActionAndFollowRedirect(page, () => fab.locator('button[type="submit"]:has-text("생성")').click());
  await expect(page.locator(`article:has-text("${title}")`).first()).toBeVisible();
  const href = await page.locator(`a[aria-label="${title} 상세 보기"]`).first().getAttribute("href");
  if (!href) throw new Error(`${title} 상세 링크를 찾지 못했습니다.`);
  return href;
}

async function getMeetingParticipantCount(page: Page): Promise<number> {
  const term = page.locator("dt").filter({ hasText: /^전체 확정$/ }).first();
  await expect(term).toBeVisible();
  const text = (await term.locator("xpath=following-sibling::dd[1]").textContent()) ?? "";
  const match = text.match(/(\d+)명/);
  if (!match) throw new Error(`참여자 수 파싱 실패: ${text}`);
  return Number(match[1]);
}

async function quickAddMeetingParticipant(page: Page, detailUrl: string, name: string): Promise<void> {
  await page.goto(detailUrl);
  const beforeCount = await getMeetingParticipantCount(page);
  const quickAdd = page.getByRole("complementary").getByRole("button").filter({ hasText: name }).filter({ hasText: "추가" }).first();
  await expect(quickAdd).toBeVisible();
  await submitServerActionAndFollowRedirect(page, () => quickAdd.click());
  await expect.poll(async () => getMeetingParticipantCount(page), { timeout: 10_000 }).toBe(beforeCount + 1);
  await expect(page.getByRole("complementary").getByRole("button").filter({ hasText: name }).filter({ hasText: "추가됨" }).first()).toBeVisible();
}

async function excludeMeetingParticipant(page: Page, detailUrl: string, name: string): Promise<void> {
  await page.goto(detailUrl);
  const beforeCount = await getMeetingParticipantCount(page);
  const chip = page
    .locator("section")
    .filter({ hasText: "참여자 관리" })
    .getByRole("button")
    .filter({ hasText: name })
    .first();
  await expect(chip).toBeVisible();
  await chip.click();
  await page.getByRole("dialog").getByRole("button", { name: "참여 제외" }).click();
  await submitServerActionAndFollowRedirect(page, () =>
    page.getByRole("dialog", { name: "제외할까요?" }).getByRole("button", { name: "확인" }).click()
  );
  await expect.poll(async () => getMeetingParticipantCount(page), { timeout: 10_000 }).toBe(beforeCount - 1);
  await expect(
    page.getByRole("complementary").getByRole("button").filter({ hasText: name }).filter({ hasText: "추가" }).first()
  ).toBeVisible();
}

async function updateMeeting(page: Page, detailUrl: string, title: string): Promise<void> {
  await page.goto(detailUrl);
  await page.getByRole("button", { name: "수정 관리" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "수정 관리" });
  await expect(dialog).toBeVisible();
  const form = dialog.locator("form#meeting-update-form");
  await form.locator('input[name="title"]').fill(title);
  await submitServerActionAndFollowRedirect(page, () => form.getByRole("button", { name: "저장" }).click());
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

async function deleteMeeting(page: Page, detailUrl: string): Promise<void> {
  await page.goto(detailUrl);
  await page.getByRole("button", { name: "수정 관리" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "수정 관리" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "이 모임 삭제" }).click();
  const confirm = page.getByRole("dialog", { name: "삭제할까요?" });
  await submitServerActionAndFollowRedirect(page, () => confirm.getByRole("button", { name: "확인" }).click());
}

async function createAfterparty(page: Page): Promise<string> {
  await page.goto(unitPath(`/afterparty?date=${DATE}`));
  const fab = page.locator("details:has(summary.fab-pulse)");
  await fab.locator("summary").click();
  await fab.locator('input[name="title"]').fill(NAMES.afterpartyTitle);
  await fab.locator('input[name="location"]').fill("크리티컬뒷풀이장소");
  await submitServerActionAndFollowRedirect(page, () => fab.locator('button[type="submit"]:has-text("생성")').click());
  const href = await page.locator(`a[aria-label="${NAMES.afterpartyTitle} 상세 보기"]`).first().getAttribute("href");
  if (!href) throw new Error("뒷풀이 상세 링크를 찾지 못했습니다.");
  return href;
}

async function getSettledCount(page: Page): Promise<number> {
  const badge = page.locator("span").filter({ hasText: /정산 \d+\/\d+/ }).first();
  await expect(badge).toBeVisible();
  const text = (await badge.textContent()) ?? "";
  const match = text.match(/정산\s*(\d+)\/\d+/);
  if (!match) throw new Error(`정산 카운트 파싱 실패: ${text}`);
  return Number(match[1]);
}

async function addAndToggleAfterpartyParticipant(page: Page, detailUrl: string): Promise<void> {
  await page.goto(detailUrl);
  const participantForm = page
    .locator("section")
    .filter({ hasText: "참여자 관리" })
    .locator('form:has(input[name="names"])')
    .first();
  await participantForm.locator('input[name="names"]').fill(NAMES.memberA);
  await submitServerActionAndFollowRedirect(page, () => participantForm.locator('button[type="submit"]:has-text("추가")').click());
  await expect(page.getByText(NAMES.memberA, { exact: false }).first()).toBeVisible();

  const beforeCount = await getSettledCount(page);
  const unsettledLabel = page.locator("label").filter({ hasText: "미정산" }).first();
  await expect(unsettledLabel).toBeVisible();
  await unsettledLabel.click();
  await expect.poll(async () => getSettledCount(page), { timeout: 10_000 }).toBe(beforeCount + 1);

  const settledLabel = page.locator("label").filter({ hasText: "정산 완료" }).first();
  await expect(settledLabel).toBeVisible();
  await settledLabel.click();
  await expect.poll(async () => getSettledCount(page), { timeout: 10_000 }).toBe(beforeCount);
}

async function updateAndDeleteAfterparty(page: Page, detailUrl: string): Promise<void> {
  await page.goto(detailUrl);
  await page.getByRole("button", { name: "수정 관리" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "수정 관리" });
  await dialog.locator('form#afterparty-update-form input[name="title"]').fill(NAMES.afterpartyTitleEdited);
  await submitServerActionAndFollowRedirect(page, () => dialog.getByRole("button", { name: "정보 저장" }).click());
  await expect(page.getByRole("heading", { level: 1, name: NAMES.afterpartyTitleEdited })).toBeVisible();

  await page.getByRole("button", { name: "수정 관리" }).click();
  const deleteDialog = page.getByRole("dialog").filter({ hasText: "수정 관리" });
  await deleteDialog.getByRole("button", { name: "이 뒷풀이 삭제" }).click();
  const confirm = page.getByRole("dialog", { name: "삭제할까요?" });
  await submitServerActionAndFollowRedirect(page, () => confirm.getByRole("button", { name: "확인" }).click());
}

test.describe.serial("수동 회귀: 새 운영 단위 크리티컬 패스", () => {
  test.describe.configure({ retries: 0 });
  test.skip(
    process.env.RUN_CRITICAL_PATH_E2E !== "1",
    "상태 누적형 쓰기 시나리오라 기본 비활성화합니다. 수동 점검 시 RUN_CRITICAL_PATH_E2E=1로 실행하세요."
  );
  test.setTimeout(180_000);

  test("운영 단위 생성부터 핵심 기능 추가·수정·삭제·통계 확인까지 동작한다", async ({ page }) => {
    try {
      await test.step("CP-01 신규 운영 단위를 만들고 전역 관리자 목록에 반영한다", async () => {
        await createOperatingUnit(page);
      });

      await test.step("CP-02 새 운영 단위 입장 코드와 관리자 코드로 관리자에 진입한다", async () => {
        await loginUnitAdmin(page);
      });

      await test.step("CP-03 팀이 없는 상태에서도 운영진 5개 역할을 추가·수정·삭제한다", async () => {
        await page.goto(unitPath("/members"));
        await expect(page.getByText("팀이 없습니다. 상단의 추가 버튼으로 시작하세요.")).toBeVisible();
        await addOperationMember(page, "엔젤", NAMES.angel);
        await editOperationMember(page, "엔젤", NAMES.angel, NAMES.angelEdited);
        await addOperationMember(page, "멘토", NAMES.mentor);
        await addOperationMember(page, "매니저", NAMES.manager);
        await addOperationMember(page, "매니저", NAMES.managerDeleted);
        await removeOperationMember(page, "매니저", NAMES.managerDeleted);
        await addOperationMember(page, "서포터", NAMES.supporter);
        await addOperationMember(page, "버디", NAMES.buddy);
      });

      await test.step("CP-04 팀 여러 건을 추가하고 팀명/멤버 수정 후 불필요한 팀을 삭제한다", async () => {
        await addTeam(page, NAMES.teamA, NAMES.teamAngelA, NAMES.memberA);
        await addTeam(page, NAMES.teamB, NAMES.teamAngelB, "삭제될 멤버");
        await editTeam(page);
        await deleteTeam(page, NAMES.teamB);
      });

      const cycleId = await test.step("CP-05 엔젤 주간보고 주차를 만들고 작성·수정·관리자 확인·미제출 처리한다", async () => {
        const createdCycleId = await createReportCycle(page);
        await submitWeeklyReport(page, createdCycleId);
        await verifyAdminReportSubmission(page, createdCycleId);
        await unsubmitWeeklyReport(page, createdCycleId);
        return createdCycleId;
      });

      const studyUrl = await test.step("CP-06 스터디 모임을 만들고 참여자 반영·제외·정보 수정을 확인한다", async () => {
        const createdStudyUrl = await createMeeting(page, "study", NAMES.studyTitle);
        await quickAddMeetingParticipant(page, createdStudyUrl, NAMES.memberA);
        await excludeMeetingParticipant(page, createdStudyUrl, NAMES.memberA);
        await quickAddMeetingParticipant(page, createdStudyUrl, NAMES.memberA);
        await updateMeeting(page, createdStudyUrl, NAMES.studyTitleEdited);
        return createdStudyUrl;
      });

      const loopPakUrl = await test.step("CP-07 루프팩 모임을 만들고 참여자 반영을 확인한다", async () => {
        const createdLoopPakUrl = await createMeeting(page, "loop-pak", NAMES.loopPakTitle);
        await quickAddMeetingParticipant(page, createdLoopPakUrl, NAMES.memberB);
        return createdLoopPakUrl;
      });

      const afterpartyUrl = await test.step("CP-08 뒷풀이를 만들고 참여자 추가·정산 토글·수정·삭제를 확인한다", async () => {
        const createdAfterpartyUrl = await createAfterparty(page);
        await addAndToggleAfterpartyParticipant(page, createdAfterpartyUrl);
        await updateAndDeleteAfterparty(page, createdAfterpartyUrl);
        return createdAfterpartyUrl;
      });
      expect(afterpartyUrl).toContain("/afterparty/");
      expect(cycleId).not.toBe("");

      await test.step("CP-09 생성된 참여 데이터로 관리자 참여 통계 화면을 확인한다", async () => {
        await page.goto(unitPath(`/admin/history?start=${DATE}&end=2026-10-31`));
        await expect(page.getByRole("heading", { level: 1, name: "참여 통계" })).toBeVisible();
        await expect(page.getByRole("heading", { level: 3, name: "팀별 참여율" })).toBeVisible();
        await expect(page.getByText(NAMES.teamAEdited).first()).toBeVisible();
      });

      await test.step("CP-10 스터디/루프팩 모임을 삭제하고 목록에서 제거한다", async () => {
        await deleteMeeting(page, studyUrl);
        await deleteMeeting(page, loopPakUrl);
        await page.goto(unitPath(`/study?date=${DATE}`));
        await expect(page.locator(`a[aria-label="${NAMES.studyTitleEdited} 상세 보기"]`)).toHaveCount(0);
        await page.goto(unitPath(`/loop-pak?date=${DATE}`));
        await expect(page.locator(`a[aria-label="${NAMES.loopPakTitle} 상세 보기"]`)).toHaveCount(0);
      });
    } finally {
      await test.step("CP-11 테스트 운영 단위를 삭제해 프로덕션 유사 DB 오염을 남기지 않는다", async () => {
        await deleteOperatingUnit(page);
      });
    }
  });
});
