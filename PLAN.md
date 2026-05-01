# SM-5B 히스토리 대시보드 표 화면 계획

## 목표
- `/admin/history`에서 기간별 팀/멤버 참여 집계를 표로 확인한다.
- `/admin` 카드의 "팀/멤버 히스토리"를 실제 화면으로 연결하고 준비 중 상태를 제거한다.

## 범위
- `src/app/admin/history/page.tsx`: 서버 컴포넌트 화면, 탭/정렬/기간 query 파싱.
- `src/app/admin/history/period-picker.tsx`: 기간 선택 폼.
- `src/app/admin/page.tsx`: 관리자 카드 링크 연결.
- `e2e/regression-history-dashboard.spec.ts`: 기간 변경 시 화면 갱신 검증.

## 구현 순서
1. 기간 preset(`current-quarter`, `previous-quarter`, `custom`)과 ISO date 파싱 helper를 page 내부에 둔다.
2. 팀별/멤버별 탭은 query string `tab=team|member`, 정렬은 `sort`와 `dir`로 처리한다.
3. 표는 모바일에서 `overflow-x-auto`로 감싸고 숫자/율 컬럼을 우측 정렬한다.
4. 빈 상태와 로드 실패 상태를 기존 `card-static` 패턴으로 표현한다.
5. Playwright는 `/admin/history` 진입, 사용자 정의 기간 변경, URL/query와 표 갱신 heading을 확인한다.

## 검증
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npx next build --webpack`
- `PLAYWRIGHT_BASE_URL=http://localhost:{port} npx playwright test e2e/regression-history-dashboard.spec.ts --project=regression`
