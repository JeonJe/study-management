# SM-3B 엔젤 보고 화면 댓글 입력 UI 계획

## 변경 파일

| 파일 | 변경 |
|------|------|
| `src/app/angel/reports/[cycleId]/teams/[teamName]/page.tsx` | 보고 하단 댓글 목록, 입력 form, 삭제 버튼 추가 |
| `src/app/weekly-report-actions.ts` | 댓글 생성/삭제 server action 추가 |

## 테스트 시나리오

- 댓글 작성 후 같은 보고 페이지로 돌아온다.
- 댓글 목록은 soft-delete되지 않은 댓글만 표시한다.
- angel은 본인 표시 이름 댓글만 삭제하고, admin은 모든 댓글을 삭제할 수 있다.
- 기존 보고 저장 form은 유지된다.

## 위험 요소

- 보안: server action에서 role gate를 재검증하고, returnPath는 기존 safeReturnPath만 허용한다.
- 권한: 실제 개인 계정이 없는 구조라 angel 삭제 권한은 작성자 표시 이름 기준으로 제한한다.
- UX: 댓글은 보고가 생성된 뒤에만 작성 가능하다.

## 리뷰 축

- QA: 작성/표시/삭제 시나리오와 빈 상태 확인.
- 코드: 기존 weekly-report-store 함수 재사용.
- 테스트: 기존 store 댓글 테스트 + 회귀 E2E 유지.
- 보안: role gate, safe return path, hidden field 신뢰 최소화.
