#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import pg from "pg";

const { Pool } = pg;

const SLUG = "handoff-test";
const UNIT_NAME = "인계 테스트 기수";
const ACCESS_CODE = "handoff-access-123";
const ANGEL_CODE = "handoff-angel-123";
const ADMIN_CODE = "handoff-admin-123";
const SCREENSHOT_DIR = "docs/screenshots/handoff";
const SAMPLE_DATE = "2026-06-06";

function loadEnvFile(filePath) {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) return;

  const raw = fs.readFileSync(resolved, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function authToken(password) {
  return sha256(`saturday-meetup:${password}`);
}

function unitAccessToken(slug, password) {
  return sha256(`saturday-meetup:operating-unit:${slug}:${password}`);
}

function roleToken(slug, role, password) {
  return sha256(`saturday-meetup:operating-unit:${slug}:${role}:${password}`);
}

async function purgeHandoffData(pool) {
  await pool.query(
    `delete from public.angel_weekly_reports
     where cycle_id in (select id from public.weekly_report_cycles where operating_unit_slug = $1)`,
    [SLUG]
  );
  await pool.query(`delete from public.weekly_report_cycles where operating_unit_slug = $1`, [SLUG]);
  await pool.query(`delete from public.weekly_report_templates where operating_unit_slug = $1`, [SLUG]);
  await pool.query(
    `delete from public.afterparty_settlement_participants
     where settlement_id in (
       select s.id
       from public.afterparty_settlements s
       join public.afterparties a on a.id = s.afterparty_id
       where a.operating_unit_slug = $1
     )`,
    [SLUG]
  );
  await pool.query(
    `delete from public.afterparty_settlements
     where afterparty_id in (select id from public.afterparties where operating_unit_slug = $1)`,
    [SLUG]
  );
  await pool.query(
    `delete from public.afterparty_participants
     where afterparty_id in (select id from public.afterparties where operating_unit_slug = $1)`,
    [SLUG]
  );
  await pool.query(`delete from public.afterparties where operating_unit_slug = $1`, [SLUG]);
  await pool.query(
    `delete from public.rsvps
     where meeting_id in (select id from public.meetings where operating_unit_slug = $1)`,
    [SLUG]
  );
  await pool.query(`delete from public.meetings where operating_unit_slug = $1`, [SLUG]);
  await pool.query(`delete from public.member_team_members where operating_unit_slug = $1`, [SLUG]);
  await pool.query(`delete from public.member_teams where operating_unit_slug = $1`, [SLUG]);
  await pool.query(`delete from public.member_angels where operating_unit_slug = $1`, [SLUG]);
  await pool.query(`delete from public.member_special_roles where operating_unit_slug = $1`, [SLUG]);
  await pool.query(`delete from public.operating_units where slug = $1`, [SLUG]);
}

async function resetHandoffData(pool) {
  await pool.query("begin");
  try {
    await pool.query(`
      alter table public.operating_units
        add column if not exists access_password_plaintext text,
        add column if not exists angel_password_hash text,
        add column if not exists angel_password_plaintext text,
        add column if not exists admin_password_hash text,
        add column if not exists admin_password_plaintext text
    `);
    await pool.query(`
      alter table public.meetings
        add column if not exists meeting_kind text not null default 'study'
    `);

    await purgeHandoffData(pool);

    await pool.query(
      `insert into public.operating_units (
         slug,
         name,
         description,
         is_default,
         is_active,
         access_password_hash,
         access_password_plaintext,
         angel_password_hash,
         angel_password_plaintext,
         admin_password_hash,
         admin_password_plaintext
       )
       values ($1, $2, $3, false, true, $4, $5, $6, $7, $8, $9)`,
      [
        SLUG,
        UNIT_NAME,
        "인계 문서와 스크린샷을 위한 가데이터 기수",
        unitAccessToken(SLUG, ACCESS_CODE),
        ACCESS_CODE,
        roleToken(SLUG, "angel", ANGEL_CODE),
        ANGEL_CODE,
        roleToken(SLUG, "admin", ADMIN_CODE),
        ADMIN_CODE,
      ]
    );

    await pool.query(
      `insert into public.member_teams (team_name, angel_name, angel_names, team_order, operating_unit_slug)
       values
         ('인계 1팀', '샘플엔젤01', array['샘플엔젤01'], 1, $1),
         ('인계 2팀', '샘플엔젤02', array['샘플엔젤02'], 2, $1)`,
      [SLUG]
    );
    await pool.query(
      `insert into public.member_team_members (team_name, member_id, member_name, member_order, operating_unit_slug)
       values
         ('인계 1팀', 'handoff-member-01', '샘플멤버01', 1, $1),
         ('인계 1팀', 'handoff-member-02', '샘플멤버02', 2, $1),
         ('인계 2팀', 'handoff-member-03', '샘플멤버03', 1, $1),
         ('인계 2팀', 'handoff-member-04', '샘플멤버04', 2, $1)`,
      [SLUG]
    );
    await pool.query(
      `insert into public.member_angels (angel_name, angel_order, operating_unit_slug)
       values ('샘플엔젤01', 1, $1), ('샘플엔젤02', 2, $1)`,
      [SLUG]
    );
    await pool.query(
      `insert into public.member_special_roles (role, member_name, member_order, operating_unit_slug)
       values
         ('supporter', '샘플서포터01', 1, $1),
         ('buddy', '샘플버디01', 1, $1),
         ('mentor', '샘플멘토01', 1, $1),
         ('manager', '샘플매니저01', 1, $1)`,
      [SLUG]
    );

    const studyMeetingId = randomUUID();
    const loopPakMeetingId = randomUUID();
    await pool.query(
      `insert into public.meetings (
         id, title, meeting_date, start_time, location, description, leaders, capacity, operating_unit_slug, meeting_kind
       )
       values
         ($1, '인계 테스트 스터디', $3, '14:00', '루퍼스 샘플 라운지', '인계 문서용 스터디 일정입니다.', array['샘플방장01'], 3, $4, 'study'),
         ($2, '인계 테스트 루프팩', $3, '10:00', '루퍼스 샘플 강의장', '인계 문서용 루프팩 일정입니다.', array['샘플방장02'], null, $4, 'loop-pak')`,
      [studyMeetingId, loopPakMeetingId, SAMPLE_DATE, SLUG]
    );
    await pool.query(
      `insert into public.rsvps (id, meeting_id, name, role, status, note)
       values
         ($1, $7, '샘플멤버01', 'student', 'confirmed', null),
         ($2, $7, '샘플멤버02', 'student', 'confirmed', null),
         ($3, $7, '샘플엔젤01', 'angel', 'confirmed', null),
         ($4, $7, '샘플멤버03', 'student', 'waitlist', '대기 샘플'),
         ($5, $8, '샘플멤버04', 'student', 'confirmed', null),
         ($6, $8, '샘플서포터01', 'supporter', 'confirmed', null)`,
      [
        randomUUID(),
        randomUUID(),
        randomUUID(),
        randomUUID(),
        randomUUID(),
        randomUUID(),
        studyMeetingId,
        loopPakMeetingId,
      ]
    );

    const afterpartyId = randomUUID();
    await pool.query(
      `insert into public.afterparties (
         id, title, event_date, start_time, location, description, settlement_manager, settlement_account, operating_unit_slug
       )
       values ($1, '인계 테스트 뒷풀이', $2, '19:00', '샘플 다이닝 공간', '인계 문서용 뒷풀이입니다.', '샘플정산자', '토스 0000-0000-0000', $3)`,
      [afterpartyId, SAMPLE_DATE, SLUG]
    );
    const participantIds = [randomUUID(), randomUUID(), randomUUID()];
    await pool.query(
      `insert into public.afterparty_participants (id, afterparty_id, name, role)
       values
         ($1, $4, '샘플멤버01', 'student'),
         ($2, $4, '샘플멤버02', 'student'),
         ($3, $4, '샘플엔젤01', 'angel')`,
      [...participantIds, afterpartyId]
    );
    const settlementIds = [randomUUID(), randomUUID()];
    await pool.query(
      `insert into public.afterparty_settlements (id, afterparty_id, title, settlement_manager, settlement_account, sort_order)
       values
         ($1, $3, '1차 저녁', '샘플정산자', '토스 0000-0000-0000', 1),
         ($2, $3, '2차 카페', '샘플정산자', '토스 0000-0000-0000', 2)`,
      [...settlementIds, afterpartyId]
    );
    await pool.query(
      `insert into public.afterparty_settlement_participants (settlement_id, participant_id, is_settled)
       values
         ($1, $2, true),
         ($1, $3, false),
         ($1, $4, false)`,
      [settlementIds[0], ...participantIds]
    );

    const templateId = randomUUID();
    const cycleId = randomUUID();
    const reportId = randomUUID();
    await pool.query(
      `insert into public.weekly_report_templates (id, name, prompt, sections, is_default, operating_unit_slug)
       values (
         $1,
         '인계 주간보고 템플릿',
         '이번 주 팀 상태를 간단히 기록해주세요.',
         '[{"title":"팀 현황","prompt":"팀 분위기와 참여 상황"},{"title":"도움이 필요한 점","prompt":"운영진 지원이 필요한 내용"}]'::jsonb,
         true,
         $2
       )`,
      [templateId, SLUG]
    );
    await pool.query(
      `insert into public.weekly_report_cycles (id, template_id, title, week_label, start_date, due_date, prompt, operating_unit_slug)
       values ($1, $2, '인계 테스트 1주차 보고', '1주차', $3, $3::date + interval '6 days', '가데이터 주간보고입니다.', $4)`,
      [cycleId, templateId, SAMPLE_DATE, SLUG]
    );
    await pool.query(
      `insert into public.angel_weekly_reports (
         id, cycle_id, angel_name, team_name, summary, notes, requests, action_items
       )
       values ($1, $2, '샘플엔젤01', '인계 1팀', '팀 참여가 안정적입니다.', '특이사항 없음', '다음 모임 장소 확인', '샘플멤버02 팔로업')`,
      [reportId, cycleId]
    );

    await pool.query("commit");

    return {
      studyMeetingId,
      loopPakMeetingId,
      afterpartyId,
      cycleId,
    };
  } catch (error) {
    await pool.query("rollback");
    throw error;
  }
}

async function cleanupHandoffData(pool) {
  await pool.query("begin");
  try {
    await purgeHandoffData(pool);
    await pool.query("commit");
  } catch {
    await pool.query("rollback");
  }
}

async function preparePage(context, authType) {
  await context.clearCookies();
  const cookies = [];
  const baseUrl = new URL(process.env.BASE_URL || "http://localhost:3000");
  const cookieBase = {
    domain: baseUrl.hostname,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
  };

  if (authType === "global") {
    cookies.push({ ...cookieBase, name: "meetup_auth", value: authToken(process.env.APP_PASSWORD) });
  }
  if (authType === "unit" || authType === "angel" || authType === "admin") {
    cookies.push({
      ...cookieBase,
      name: "meetup_auth",
      value: `unit:${encodeURIComponent(SLUG)}:${unitAccessToken(SLUG, ACCESS_CODE)}`,
    });
  }
  if (authType === "angel") {
    cookies.push({
      ...cookieBase,
      name: "meetup_role_access",
      value: `angel.${encodeURIComponent(SLUG)}.${roleToken(SLUG, "angel", ANGEL_CODE)}`,
    });
  }
  if (authType === "admin") {
    cookies.push({
      ...cookieBase,
      name: "meetup_role_access",
      value: `admin.${encodeURIComponent(SLUG)}.${roleToken(SLUG, "admin", ADMIN_CODE)}`,
    });
  }

  if (cookies.length > 0) {
    await context.addCookies(cookies);
  }
}

async function take(page, fileName) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    const existing = document.getElementById("handoff-screenshot-cleanup-style");
    if (existing) return;

    const style = document.createElement("style");
    style.id = "handoff-screenshot-cleanup-style";
    style.textContent = `
      nextjs-portal,
      [data-nextjs-toast],
      [data-nextjs-devtools-button],
      [aria-label="Open Next.js Dev Tools"],
      [title="Open Next.js Dev Tools"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  });
  await page.waitForTimeout(250);
  const filePath = path.join(SCREENSHOT_DIR, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`captured ${filePath}`);
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
  process.env.BASE_URL = process.env.BASE_URL || "http://localhost:3000";

  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL이 필요합니다.");
  if (!process.env.APP_PASSWORD) throw new Error("APP_PASSWORD가 필요합니다.");

  await fs.promises.mkdir(SCREENSHOT_DIR, { recursive: true });

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const ids = await resetHandoffData(pool);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const base = process.env.BASE_URL;

  await preparePage(context, "global");
  await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
  await take(page, "01-global-admin-login.png");
  await page.goto(`${base}/admin/operating-units`, { waitUntil: "networkidle" });
  await take(page, "02-operating-units-list.png");
  await page.goto(`${base}/admin/operating-units/new`, { waitUntil: "networkidle" });
  await page.fill('input[name="slug"]', SLUG);
  await page.fill('input[name="name"]', UNIT_NAME);
  await page.fill('textarea[name="description"]', "인계용 테스트 기수입니다.");
  await page.fill('input[name="accessPassword"]', ACCESS_CODE);
  await page.fill('input[name="angelPassword"]', ANGEL_CODE);
  await page.fill('input[name="adminPassword"]', ADMIN_CODE);
  await take(page, "03-operating-unit-create-form.png");
  await page.goto(`${base}/admin/operating-units/${SLUG}`, { waitUntil: "networkidle" });
  await take(page, "04-operating-unit-detail.png");
  await page.getByRole("button", { name: "삭제" }).click();
  await take(page, "05-operating-unit-delete-confirm.png");

  await preparePage(context, null);
  await page.goto(`${base}/cohorts/${SLUG}/entry?returnPath=%2Fcohorts%2F${SLUG}%2Fstudy`, { waitUntil: "networkidle" });
  await take(page, "06-cohort-entry.png");

  await preparePage(context, "unit");
  await page.goto(`${base}/cohorts/${SLUG}/study?date=${SAMPLE_DATE}`, { waitUntil: "networkidle" });
  await take(page, "07-study-dashboard.png");
  await page.goto(`${base}/cohorts/${SLUG}/meetings/${ids.studyMeetingId}?date=${SAMPLE_DATE}`, { waitUntil: "networkidle" });
  await take(page, "08-meeting-detail.png");
  await page.goto(`${base}/cohorts/${SLUG}/afterparty?date=${SAMPLE_DATE}`, { waitUntil: "networkidle" });
  await take(page, "09-afterparty-dashboard.png");
  await page.goto(`${base}/cohorts/${SLUG}/afterparty/${ids.afterpartyId}?date=${SAMPLE_DATE}`, { waitUntil: "networkidle" });
  await take(page, "10-afterparty-detail.png");

  await preparePage(context, "angel");
  await page.goto(`${base}/cohorts/${SLUG}/angel/reports`, { waitUntil: "networkidle" });
  await take(page, "11-angel-reports.png");
  await page.goto(`${base}/cohorts/${SLUG}/angel/reports/${ids.cycleId}/teams/${encodeURIComponent("인계 1팀")}`, { waitUntil: "networkidle" });
  const editButton = page.getByRole("button", { name: /수정|작성/ }).first();
  if (await editButton.count()) {
    await editButton.click();
  }
  await take(page, "12-angel-report-edit.png");

  await preparePage(context, "admin");
  await page.goto(`${base}/cohorts/${SLUG}/admin`, { waitUntil: "networkidle" });
  await take(page, "13-admin-home.png");
  await page.goto(`${base}/cohorts/${SLUG}/members`, { waitUntil: "networkidle" });
  await take(page, "14-members.png");
  await page.goto(`${base}/cohorts/${SLUG}/admin/reports`, { waitUntil: "networkidle" });
  await take(page, "15-admin-reports.png");
  await page.goto(`${base}/cohorts/${SLUG}/admin/reports/cycles/${ids.cycleId}`, { waitUntil: "networkidle" });
  await take(page, "16-admin-report-detail.png");
  await page.goto(`${base}/cohorts/${SLUG}/admin/history`, { waitUntil: "networkidle" });
  await take(page, "17-history.png");
  await page.evaluate(() => {
    window.dispatchEvent(new Event("saturday-meetup:navigation-loading-start"));
  });
  await take(page, "18-loading-progress.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await preparePage(context, null);
  await page.goto(`${base}/cohorts/${SLUG}/entry?returnPath=%2Fcohorts%2F${SLUG}%2Fstudy`, { waitUntil: "networkidle" });
  await take(page, "19-mobile-entry.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await preparePage(context, "unit");
  await page.goto(`${base}/cohorts/${SLUG}/meetings/${ids.studyMeetingId}?date=${SAMPLE_DATE}`, { waitUntil: "networkidle" });
  await take(page, "20-mobile-meeting-detail.png");

  await browser.close();
  await cleanupHandoffData(pool);
  await pool.end();
}

await main();
