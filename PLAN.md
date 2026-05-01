# Refactor R1 스크립트 env 유틸 정리

## Behavior Lock

| 대상 | 검증 |
|------|------|
| 스키마 적용 CLI | `node --check scripts/apply-schema.mjs`, `node scripts/apply-schema.mjs --help` |
| 데이터 이관 CLI | `node --check scripts/migrate-data.mjs`, dry-run |
| 히스토리 테스트 | `npm test -- src/lib/history-store.test.ts` |

## Cleanup Plan

| 순서 | 냄새 | 처리 |
|------|------|------|
| 1 | `loadEnvFile` 중복 | `scripts/lib/env-utils.mjs`로 통합 |
| 2 | `resolvePsql` 중복 | 공용 `resolvePsql()`로 통합 |
| 3 | executable 탐색 패턴 중복 | `resolveExecutable()`로 공통화 |
| 4 | DB URL 마스킹 중복 | `maskDatabaseUrl()` 공통화 |
| 5 | apply-schema 불필요 import | 중복 함수 제거 후 필요한 import만 유지 |
| 6 | migrate-data 불필요 import | 중복 함수 제거 후 필요한 import만 유지 |
| 7 | psql 후보 목록 분산 | 한 파일에서만 관리 |
| 8 | CLI env override 정책 분산 | SM-7A/7B 스크립트가 같은 loader 사용 |
| 9 | lint warning | `history-store.test.ts` unused parameter 제거 |
| 10 | 검증 노이즈 | lint warning 2개 제거로 품질 게이트 출력 정리 |

## 제외

- 기존 `backup-db.mjs`, `db-ping.mjs`, `seed-roster.mjs`는 env 보존 정책이 달라 이번 PR에서 건드리지 않는다.
- 운영 DB 쓰기 동작은 실행하지 않는다.
