# LP-1 LOOPERS MEETUP / LOOP:PAK 작업 계획

## 범위

- 상단 헤더에 `LOOPERS MEETUP` 브랜드 문구와 제공 아이콘 기반 브랜드 마크를 표시한다.
- 기존 `스터디` 탭/타이틀 문구를 `LOOP:PAK`으로 변경한다.
- `스터디` 탭 좌측에 `루프팩` 항목을 추가한다.
- `루프팩` 항목은 빈 화면이 아니라 기존 스터디 참석/카드/집계 화면을 재사용하는 `/loop-pak` 라우트로 제공한다.

## 변경 파일

| 파일 | 변경 |
|------|------|
| `src/app/dashboard-header.tsx` | 브랜드 마크/문구 추가, 탭에 `루프팩` 추가, 날짜 query 유지 |
| `src/app/meetup-dashboard.tsx` | 기존 메인 대시보드를 공용 컴포넌트로 전환, 타이틀/활성 탭/경로 props 추가 |
| `src/app/page.tsx` | `/`에서 `LOOP:PAK` 대시보드 렌더 |
| `src/app/loop-pak/page.tsx` | `/loop-pak`에서 `루프팩` 대시보드 렌더 |
| `public/loopers-meetup-icon.svg` | 제공 아이콘을 앱 정적 자산으로 반영 |

## 테스트

- `npm run typecheck`
- `npm run lint`
- `npm test`
- UI 라우트 추가이므로 가능하면 `npm run build`까지 확인

## 위험

- 루프팩은 이번 PR에서 기존 스터디 데이터 모델을 재사용한다. 완전히 분리된 데이터 집계가 필요하면 후속 PR에서 `meeting_kind` 또는 별도 도메인 분리가 필요하다.
- 제공 아이콘은 대화에 첨부된 이미지를 정적 SVG로 재현한다. 원본 PNG가 별도 파일로 제공되면 동일 파일명으로 교체 가능하다.
