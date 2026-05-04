import { test, expect, chromium } from "@playwright/test";
import {
  AUTH_STATE,
  BASE_URL,
  REGRESSION_TEST_DATE,
  cohortPath,
} from "./support/test-config";
import { submitServerActionAndFollowRedirect } from "./support/server-action";

// cache/performance spec과 날짜 충돌 방지
const DASHBOARD = cohortPath("study", { date: REGRESSION_TEST_DATE });

// 회귀 테스트 전용 라벨 prefix — 다른 spec의 E2E 데이터와 구분
const TEST_LABEL = "R회귀모임";

// ---------- helpers ----------

/** 모임 상세 페이지에서 삭제 수행 (cache-consistency.spec.ts 패턴 차용) */
async function deleteMeetingFromDetail(page: import("@playwright/test").Page) {
  await openManageModal(page);
  await page
    .locator('[role="dialog"] button:has-text("이 모임 삭제")')
    .click();
  const confirmDialog = page.getByRole("dialog", { name: "삭제할까요?" });
  await expect(confirmDialog).toBeVisible();
  await submitServerActionAndFollowRedirect(page, () =>
    confirmDialog.getByRole("button", { name: "확인" }).click(),
  );
}

async function openManageModal(page: import("@playwright/test").Page) {
  const button = page.getByRole("button", { name: "수정 관리" });
  await expect(button).toBeVisible();
  await expect(async () => {
    await button.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
}

/**
 * 대시보드에서 TEST_LABEL로 시작하는 테스트 데이터를 모두 삭제
 * beforeAll에서 이전 실행 잔여 데이터 cleanup에 사용
 */
async function cleanupByLabel(
  page: import("@playwright/test").Page,
  label: string,
  listUrl: string,
) {
  for (let attempt = 0; attempt < 10; attempt++) {
    await page.goto(listUrl, { waitUntil: "domcontentloaded" });
    const link = page.locator(`a[aria-label*="${label}"]`).first();
    if ((await link.count()) === 0) break;

    await link.click();
    await page.waitForLoadState("domcontentloaded");

    // 삭제 실패는 silent break 금지 — 오염된 테스트 데이터를 그대로 둔 채
    // 본 시나리오를 진행하면 false positive 회귀 통과를 만든다 (fail-fast)
    await deleteMeetingFromDetail(page);
  }
}

/** 모임 상세 페이지에서 총 참여자 수 파싱 */
async function getMeetingParticipantCount(
  page: import("@playwright/test").Page,
): Promise<number> {
  const text = await getSummaryValue(page, "전체 확정");
  const match = text.match(/(\d+)명/);
  if (!match) throw new Error(`참여자 수 파싱 실패: ${text}`);
  return Number(match[1]);
}

async function getSummaryValue(
  page: import("@playwright/test").Page,
  label: "확정" | "대기" | "전체 확정",
): Promise<string> {
  const term = page.locator("dt").filter({ hasText: new RegExp(`^${label}$`) }).first();
  await expect(term).toBeVisible();
  return (await term.locator("xpath=following-sibling::dd[1]").textContent()) ?? "";
}

// ---------- 회귀 테스트: 모임 흐름 ----------

test.describe.serial("회귀: 모임 생성 → 참석 → 취소 → 재등록", () => {
  let meetingDetailUrl = "";

  // 이전 실행에서 남은 테스트 데이터 정리
  test.beforeAll(async () => {
    const browser = await chromium.launch();
    // 수동 context는 config.use.baseURL을 상속받지 않으므로 명시적으로 전달
    // (page.goto의 상대 경로가 정상 해석되어야 cleanup이 실제로 동작)
    const context = await browser.newContext({
      storageState: AUTH_STATE,
      baseURL: BASE_URL,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);

    await cleanupByLabel(page, TEST_LABEL, DASHBOARD);

    await context.close();
    await browser.close();
  });

  // ---- R1: 모임 생성 → 대시보드 반영 ----
  test("R1: 모임 생성 → 대시보드 반영", async ({ page }) => {
    await page.goto(DASHBOARD);

    // FAB 열기
    const fab = page.locator("details:has(summary.fab-pulse)");
    await fab.locator("summary").click();

    // 폼 작성
    await fab.locator('input[name="title"]').fill(`${TEST_LABEL}A`);
    await fab.locator('input[name="location"]').fill("회귀테스트장소");
    await fab.locator('input[data-leader-input="true"]').fill("이순신");
    await fab.locator('button[type="button"]:has-text("추가")').click();

    // 생성 제출
    await submitServerActionAndFollowRedirect(page, () =>
      fab.locator('button[type="submit"]:has-text("생성")').click(),
    );

    // 생성된 모임 카드 노출 확인
    await expect(
      page.locator(`article:has-text("${TEST_LABEL}A")`).first(),
    ).toBeVisible();

    // 상세 페이지 URL 저장
    const link = page
      .locator(`a[aria-label="${TEST_LABEL}A 상세 보기"]`)
      .first();
    meetingDetailUrl = (await link.getAttribute("href")) ?? "";
    expect(meetingDetailUrl).toContain("/meetings/");
  });

  // ---- R2: 참석 등록 ----
  test("R2: 참석 등록 → 참여자 수 반영", async ({ page }) => {
    test.skip(!meetingDetailUrl, "R1 실패로 건너뜀");

    await page.goto(meetingDetailUrl);

    // 현재 참여자 수 기록
    const beforeCount = await getMeetingParticipantCount(page);

    // 퀵 어사인 섹션에서 미할당 멤버 1명 추가
    // isAssigned=false인 버튼을 찾아 클릭 (추가됨 텍스트가 없는 첫 번째)
    const firstQuickAdd = page.getByRole("complementary").getByRole("button", { name: /추가$/ }).first();
    await expect(firstQuickAdd).toBeVisible();
    await submitServerActionAndFollowRedirect(page, () => firstQuickAdd.click());

    // 참여자 수 1명 증가 확인 — expect.poll이 통과하면 이미 증명됨, 중복 단언 제거
    await expect
      .poll(async () => getMeetingParticipantCount(page), {
        timeout: 10_000,
      })
      .toBe(beforeCount + 1);
    const afterCount = beforeCount + 1;

    // 대시보드 카드에서 총참여 수 반영 확인
    await page.goto(DASHBOARD);
    const card = page.locator(`article:has-text("${TEST_LABEL}A")`).first();
    await expect(card.getByText(`전체 확정 ${afterCount}`)).toBeVisible();
  });

  // ---- R3: 참석 취소 → 재등록 ----
  test("R3: 참석 취소 → 재등록 → 정합성 확인", async ({ page }) => {
    test.skip(!meetingDetailUrl, "R1 실패로 건너뜀");

    await page.goto(meetingDetailUrl);

    const beforeCount = await getMeetingParticipantCount(page);

    // 참여자 제거
    const participantButton = page
      .locator("section")
      .filter({ hasText: "참여자 관리" })
      .getByRole("button")
      .filter({ hasNotText: /^추가$/ })
      .first();
    await expect(participantButton).toBeVisible();
    await participantButton.click();
    await page.getByRole("dialog").getByRole("button", { name: "참여 제외" }).click();
    await submitServerActionAndFollowRedirect(page, () =>
      page.getByRole("dialog", { name: "제외할까요?" }).getByRole("button", { name: "확인" }).click(),
    );

    // 참여자 수 -1 확인 — expect.poll이 통과하면 증명됨, 중복 단언 제거
    await expect
      .poll(async () => getMeetingParticipantCount(page), {
        timeout: 10_000,
      })
      .toBe(beforeCount - 1);

    // 동일 멤버 재등록 — 이전에 제거된 슬롯이 다시 미할당 상태가 됨
    const firstQuickAdd = page.getByRole("complementary").getByRole("button", { name: /추가$/ }).first();
    await expect(firstQuickAdd).toBeVisible();
    await submitServerActionAndFollowRedirect(page, () => firstQuickAdd.click());

    // 참여자 수 원복 확인 — expect.poll이 통과하면 증명됨, 중복 단언 제거
    await expect
      .poll(async () => getMeetingParticipantCount(page), {
        timeout: 10_000,
      })
      .toBe(beforeCount);

    // 대시보드 카드 총참여 수 정합성 확인
    await page.goto(DASHBOARD);
    const card = page.locator(`article:has-text("${TEST_LABEL}A")`).first();
    await expect(card.getByText(`전체 확정 ${beforeCount}`)).toBeVisible();
  });

  // ---- R4: 모임 삭제 → 목록 제거 ----
  test("R4: 모임 삭제 → 대시보드에서 제거", async ({ page }) => {
    test.skip(!meetingDetailUrl, "R1 실패로 건너뜀");

    await page.goto(meetingDetailUrl);
    await deleteMeetingFromDetail(page);

    // 대시보드에서 해당 모임 카드 사라짐 확인
    await page.goto(DASHBOARD);
    await expect(
      page.locator(`a[aria-label="${TEST_LABEL}A 상세 보기"]`),
    ).toHaveCount(0);
  });
});

test.describe.serial("회귀: 정원 초과 대기 → 승격", () => {
  const WAITLIST_LABEL = `${TEST_LABEL}대기`;
  let meetingDetailUrl = "";

  test.beforeAll(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      storageState: AUTH_STATE,
      baseURL: BASE_URL,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);

    await cleanupByLabel(page, WAITLIST_LABEL, DASHBOARD);

    await context.close();
    await browser.close();
  });

  test("R5: 대기 등록 → 승격 → 확정 표시", async ({ page }) => {
    await page.goto(DASHBOARD);

    const fab = page.locator("details:has(summary.fab-pulse)");
    await fab.locator("summary").click();
    await fab.locator('input[name="title"]').fill(WAITLIST_LABEL);
    await fab.locator('input[name="location"]').fill("회귀테스트장소");
    await fab.locator('input[name="capacity"]').fill("1");
    await fab.locator('input[data-leader-input="true"]').fill("정약용");
    await fab.locator('button[type="button"]:has-text("추가")').click();
    await submitServerActionAndFollowRedirect(page, () =>
      fab.locator('button[type="submit"]:has-text("생성")').click(),
    );

    const link = page
      .locator(`a[aria-label="${WAITLIST_LABEL} 상세 보기"]`)
      .first();
    meetingDetailUrl = (await link.getAttribute("href")) ?? "";
    expect(meetingDetailUrl).toContain("/meetings/");
    await page.goto(meetingDetailUrl);
    await expect.poll(async () => getSummaryValue(page, "확정")).toBe("0/1명");
    await expect.poll(async () => getSummaryValue(page, "대기")).toBe("0명");

    await page.getByRole("button", { name: "추가" }).first().click();
    const manualAddDialog = page.getByRole("dialog", { name: "이름으로 추가" });
    await manualAddDialog.locator('textarea[name="names"]').fill("이황, 이이");
    await submitServerActionAndFollowRedirect(page, () =>
      manualAddDialog.getByRole("button", { name: "추가" }).click(),
    );
    await expect.poll(async () => getSummaryValue(page, "확정")).toBe("1/1명");
    await expect.poll(async () => getSummaryValue(page, "대기")).toBe("1명");
    await expect(page.getByText("이이")).toBeVisible();

    await page.getByRole("button", { name: "이황" }).click();
    await submitServerActionAndFollowRedirect(page, () =>
      page.getByRole("dialog", { name: "이황" }).getByRole("button", { name: "대기로 전환" }).click(),
    );
    await expect.poll(async () => getSummaryValue(page, "확정")).toBe("0/1명");
    await expect.poll(async () => getSummaryValue(page, "대기")).toBe("2명");

    await submitServerActionAndFollowRedirect(page, () =>
      page.locator('li:has-text("이이") button:has-text("확정")').click(),
    );

    await expect.poll(async () => getSummaryValue(page, "확정")).toBe("1/1명");
    await expect.poll(async () => getSummaryValue(page, "대기")).toBe("1명");
    await expect(page.locator("section").filter({ hasText: "대기 인원" }).getByText("이황")).toBeVisible();

    await deleteMeetingFromDetail(page);
    await page.goto(DASHBOARD);
    await expect(
      page.locator(`a[aria-label="${WAITLIST_LABEL} 상세 보기"]`),
    ).toHaveCount(0);
  });
});
