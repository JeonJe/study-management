# Performance Results

작성일: 2026-05-02

## 로컬 기준선

실행 명령:

```bash
APP_PASSWORD='@@@loopers1234' ADMIN_PAGE_PASSWORD=1234 ANGEL_PAGE_PASSWORD=1234 PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/performance.spec.ts --project=chromium
```

환경:

- Next.js dev server: `http://localhost:3000`
- 인증 상태: `e2e/global-setup.ts` unit login storage state
- 방문 횟수: 페이지별 3회

결과:

| 화면 | cold TTFB | warm avg TTFB | 전체 측정 |
| --- | ---: | ---: | --- |
| 대시보드 | 215ms | 112ms | 215ms, 115ms, 108ms |
| 뒷풀이 | 556ms | 98ms | 556ms, 107ms, 89ms |
| 멤버 | 520ms | 126ms | 520ms, 143ms, 108ms |
| 모임 생성 후 로드 | 36ms | - | mutation 후 redirect/load |

판정:

- 현재 측정된 warm TTFB는 모두 1초 미만이다.
- 이 문서의 수치는 로컬 dev server 기준선이다. 성능 개선을 주장하려면 같은 명령과 같은 base URL에서 전후를 비교한다.
- Vercel 원격 배포/production-like URL 성능은 사용자 요청에 따라 실행하지 않았다.
