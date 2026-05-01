# Refactor R2 운영 단위 테스트 env helper 정리

## Behavior Lock

| 대상 | 검증 |
|------|------|
| 운영 단위 store/action 테스트 | `npm test -- src/lib/operating-unit-store.test.ts` |
| 전체 품질 게이트 | lint, typecheck, full test, build |

## Cleanup Plan

| 순서 | 냄새 | 처리 |
|------|------|------|
| 1 | `SKIP_SCHEMA_CHECK` 저장/복원 반복 | `withSkipSchemaCheck()` helper 추가 |
| 2 | list 테스트 setup 반복 | helper로 감싸 본문만 남김 |
| 3 | create 테스트 setup 반복 | helper로 감싸 본문만 남김 |
| 4 | get 테스트 setup 반복 | helper로 감싸 본문만 남김 |
| 5 | update 테스트 setup 반복 | helper로 감싸 본문만 남김 |
| 6 | protected slug 테스트 setup 반복 | helper로 감싸 본문만 남김 |
| 7 | active guard 테스트 setup 반복 | helper로 감싸 본문만 남김 |
| 8 | inactive guard 테스트 setup 반복 | helper로 감싸 본문만 남김 |
| 9 | action mutation 테스트 setup 반복 | helper로 감싸 본문만 남김 |
| 10 | finally 블록 노이즈 | 11개 반복 블록 제거 |

## 제외

- production code는 건드리지 않는다.
- 테스트 assertion 의미와 mock 반환값은 변경하지 않는다.
