#!/usr/bin/env node
// Supabase Postgres 백업 스크립트
// 사용: npm run db:backup [--no-data]
// 출력: backups/saturday-meetup-YYYYMMDD-HHmmss.sql + 동일 prefix.counts.json

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

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
    const rawValue = trimmed.slice(idx + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

function resolvePgDump() {
  const candidates = [
    process.env.PG_DUMP_BIN,
    "pg_dump",
    "/opt/homebrew/opt/postgresql@17/bin/pg_dump",
    "/opt/homebrew/opt/postgresql@16/bin/pg_dump",
    "/usr/local/opt/postgresql@17/bin/pg_dump",
  ].filter(Boolean);
  for (const bin of candidates) {
    const result = spawnSync(bin, ["--version"], { stdio: "ignore" });
    if (result.status === 0) return bin;
  }
  throw new Error("pg_dump 실행 파일을 찾을 수 없음. brew install postgresql@17 또는 PG_DUMP_BIN 환경변수 지정.");
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function collectRowCounts(databaseUrl) {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const tablesResult = await pool.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY table_schema, table_name
    `);
    const counts = {};
    for (const { table_schema, table_name } of tablesResult.rows) {
      const ident = `"${table_schema}"."${table_name}"`;
      try {
        const r = await pool.query(`SELECT COUNT(*)::bigint AS c FROM ${ident}`);
        counts[`${table_schema}.${table_name}`] = Number(r.rows[0].c);
      } catch (err) {
        counts[`${table_schema}.${table_name}`] = `error: ${err.message}`;
      }
    }
    return counts;
  } finally {
    await pool.end();
  }
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. .env.local 확인.");
    process.exit(1);
  }

  const noData = process.argv.includes("--no-data");
  const pgDump = resolvePgDump();
  const ts = timestamp();
  const backupsDir = path.resolve(process.cwd(), "backups");
  fs.mkdirSync(backupsDir, { recursive: true });

  const sqlFile = path.join(backupsDir, `saturday-meetup-${ts}${noData ? "-schema" : ""}.sql`);
  const countsFile = path.join(backupsDir, `saturday-meetup-${ts}${noData ? "-schema" : ""}.counts.json`);

  console.log(`[backup] pg_dump: ${pgDump}`);
  console.log(`[backup] target: ${new URL(databaseUrl).hostname}`);
  console.log(`[backup] file:   ${sqlFile}`);

  const dumpArgs = [
    "--dbname", databaseUrl,
    "--no-owner",
    "--no-acl",
    "--format=plain",
    "--file", sqlFile,
  ];
  if (noData) dumpArgs.push("--schema-only");

  const t0 = Date.now();
  const dumpResult = spawnSync(pgDump, dumpArgs, { stdio: ["ignore", "inherit", "inherit"] });
  if (dumpResult.status !== 0) {
    console.error(`[backup] pg_dump 실패 (exit ${dumpResult.status})`);
    process.exit(dumpResult.status ?? 1);
  }
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const stats = fs.statSync(sqlFile);
  console.log(`[backup] 완료 (${elapsed}s, ${(stats.size / 1024).toFixed(1)} KB)`);

  if (stats.size === 0) {
    console.error("[backup] 파일 크기 0 — 비정상 종료");
    process.exit(1);
  }

  console.log("[backup] row count 수집 중...");
  const counts = await collectRowCounts(databaseUrl);
  const summary = {
    timestamp: ts,
    sqlFile: path.basename(sqlFile),
    sqlBytes: stats.size,
    elapsedSec: Number(elapsed),
    schemaOnly: noData,
    rowCounts: counts,
  };
  fs.writeFileSync(countsFile, JSON.stringify(summary, null, 2));
  console.log(`[backup] counts: ${path.basename(countsFile)}`);
  console.table(counts);
}

main().catch((err) => {
  console.error("[backup] 예외:", err);
  process.exit(1);
});
