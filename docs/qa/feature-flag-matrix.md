# Feature Flag 검증 메모

현재 활성 feature flag는 없습니다.

기수별 운영 기능은 이 서비스의 기본 동작이므로 환경변수로 끄지 않습니다. `/admin`의 "기수 관리" 카드와 `/admin/operating-units` 화면은 전체관리자 인증만 통과하면 항상 사용할 수 있어야 합니다.

## 신규 플래그 추가 규칙

1. 기능을 기본 제공할 수 없는 명확한 출시/롤백 사유가 있을 때만 flag를 추가합니다.
2. 새 flag는 UI 노출과 직접 라우트 접근을 모두 같은 기준으로 처리합니다.
3. 환경값은 `1` 또는 `true`만 ON으로 인정합니다.
4. 이 문서에 flag 이름, 기본값, ON 값, 보호하는 화면, ON/OFF 기대 동작을 기록합니다.
5. 필요한 경우 모바일 캡처(`scripts/capture-mobile-screenshots.mjs`) 대상 route를 갱신합니다.
