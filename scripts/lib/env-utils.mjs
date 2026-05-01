import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function loadEnvFile(filePath) {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`${filePath} 파일을 찾을 수 없습니다.`);
  }

  const raw = fs.readFileSync(resolved, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;

    const key = trimmed.slice(0, idx).trim();
    const rawValue = trimmed.slice(idx + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key) process.env[key] = value;
  }
}

export function resolveExecutable({ envKey, candidates, label }) {
  const orderedCandidates = [process.env[envKey], ...candidates].filter(Boolean);

  for (const bin of orderedCandidates) {
    const result = spawnSync(bin, ["--version"], { stdio: "ignore" });
    if (result.status === 0) return bin;
  }

  throw new Error(`${label} 실행 파일을 찾을 수 없습니다. ${envKey} 환경변수 지정이 필요합니다.`);
}

export function resolvePsql() {
  return resolveExecutable({
    envKey: "PSQL_BIN",
    label: "psql",
    candidates: [
      "psql",
      "/opt/homebrew/bin/psql",
      "/opt/homebrew/opt/postgresql@17/bin/psql",
      "/opt/homebrew/opt/postgresql@16/bin/psql",
      "/usr/local/opt/postgresql@17/bin/psql",
    ],
  });
}

export function maskDatabaseUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    return `${parsed.protocol}//${parsed.username}:***@${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
  } catch {
    return "unparseable-database-url";
  }
}
