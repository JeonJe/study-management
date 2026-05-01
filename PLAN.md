# SM-3C 주간 보고 슬랙 공유 문구 빌더 계획

## 변경 파일

| 파일 | 변경 |
|------|------|
| `src/lib/weekly-report-share-text.ts` | `buildCycleShareText(cycleId)` 추가. 보고 주차, 팀별 제출/미제출, 댓글 수를 일반 텍스트로 조립 |
| `src/lib/weekly-report-share-text.test.ts` | 정상/빈 사이클/일부 미제출 3 케이스 검증 |
| `src/app/admin/reports/cycles/[cycleId]/page.tsx` | 관리자 상세 화면에 기존 클립보드 버튼으로 슬랙 공유 문구 복사 버튼 추가 |

## 테스트 시나리오

- 정상: 제출된 여러 팀을 그룹화하고 댓글 수를 포함한다.
- 빈 사이클: 보고가 없어도 모든 팀을 미제출로 표시한다.
- 일부 미제출: 제출 팀과 미제출 팀이 함께 표시된다.

## 위험 요소

- 보안: 공유 문구는 HTML이 아닌 plain text로만 생성하고, React 렌더링/Clipboard API를 통해 복사한다.
- 권한: 관리자 상세 페이지의 기존 admin role gate 뒤에서만 버튼을 노출한다.
- 회귀: 기존 보고 상세 표시는 유지하고, 복사 버튼만 추가한다.

## 리뷰 축

- QA: DoD의 팀별 그룹화, 미제출 표시, 댓글 수 집계 충족.
- 코드: 기존 store/member preset 함수 재사용, 중복 빌더 로직 최소화.
- 테스트: 정상/빈/부분 제출 경계값 확인.
- 보안: XSS/HTML 삽입 없음, admin gate 유지, 사용자 입력은 plain text로만 복사.
