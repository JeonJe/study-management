# 기능별 사용법

이 문서는 실제 사용자가 화면을 보며 따라 할 수 있는 사용 설명서입니다.

스크린샷은 `docs/screenshots/handoff/`에 있으며 모두 가데이터입니다.

## 전체 흐름

```mermaid
flowchart TB
  A["전체관리자<br/>테스트 기수 생성"] --> B["기수 입장"]
  B --> C["루프팩/스터디 일정 관리"]
  B --> D["뒷풀이/정산 관리"]
  B --> E["엔젤 보고 작성"]
  B --> F["관리자 운영"]
  F --> G["멤버/팀 관리"]
  F --> H["보고 주차 관리"]
  F --> I["히스토리 조회"]
```

## 1. 전체관리자: 테스트 기수 만들기

![전체관리자 로그인](screenshots/handoff/01-global-admin-login.png)

1. 첫 화면에서 `전체관리자`로 들어갑니다.
2. 전체관리자 코드를 입력합니다.
3. 기수 관리 화면으로 이동합니다.

![기수 목록](screenshots/handoff/02-operating-units-list.png)

1. `새 기수`를 누릅니다.
2. 기수 이름, 접속 주소, 입장 코드, 엔젤 코드, 관리자 코드를 입력합니다.
3. 생성 후 기수 상세 화면에서 정보를 확인합니다.

![기수 생성](screenshots/handoff/03-operating-unit-create-form.png)

![기수 상세](screenshots/handoff/04-operating-unit-detail.png)

삭제할 때는 바로 삭제하지 않고 확인 모달을 한 번 더 보여줍니다.

![기수 삭제 확인](screenshots/handoff/05-operating-unit-delete-confirm.png)

## 2. 기수 입장

![기수 입장](screenshots/handoff/06-cohort-entry.png)

1. 기수별 입장 화면에서 입장 코드를 입력합니다.
2. 입장 후 상단 탭에서 루프팩, 스터디, 뒷풀이, 엔젤, 관리자로 이동합니다.

## 3. 루프팩/스터디 일정 관리

루프팩과 스터디는 같은 방식으로 동작합니다. 날짜별 일정 카드를 보고, 상세 화면에서 참여자를 관리합니다.

![스터디 목록](screenshots/handoff/07-study-dashboard.png)

1. 날짜를 고르면 해당 날짜의 일정이 보입니다.
2. `+` 버튼으로 새 일정을 만듭니다.
3. 카드 전체를 누르면 상세 화면으로 이동합니다.

![모임 상세](screenshots/handoff/08-meeting-detail.png)

상세 화면에서 할 수 있는 일:

- 제목, 장소, 시간, 설명 수정
- 참여자 추가
- 여러 명 일괄 추가
- 정원 초과 시 대기 인원 관리
- 참여자 확정/대기 전환
- 공유 문구 복사
- 삭제 확인 후 모임 삭제

## 4. 뒷풀이와 정산

![뒷풀이 목록](screenshots/handoff/09-afterparty-dashboard.png)

1. 날짜별 뒷풀이를 확인합니다.
2. 새 뒷풀이를 만들 때 장소, 시간, 정산자를 입력할 수 있습니다.
3. 카드 전체를 누르면 상세 화면으로 이동합니다.

![뒷풀이 상세](screenshots/handoff/10-afterparty-detail.png)

상세 화면에서 할 수 있는 일:

- 뒷풀이 정보 수정
- 참여자 추가/삭제
- 정산 묶음 추가
- 정산자와 계좌 정보 수정
- 참여자별 정산 완료 체크
- 정산 삭제와 뒷풀이 삭제

## 5. 엔젤 주간보고

![엔젤 보고 목록](screenshots/handoff/11-angel-reports.png)

1. 엔젤 코드로 엔젤 화면에 들어갑니다.
2. 열린 보고 주차를 선택합니다.
3. 담당 팀의 `작성` 또는 `수정`을 누릅니다.

![엔젤 보고 작성](screenshots/handoff/12-angel-report-edit.png)

보고를 저장하면 관리자 화면의 제출 현황에 반영됩니다.

## 6. 기수 관리자

![관리자 홈](screenshots/handoff/13-admin-home.png)

관리자 화면은 기수 안의 운영 데이터를 관리합니다.

| 메뉴 | 하는 일 |
| --- | --- |
| 멤버 관리 | 팀, 멤버, 팀 담당 엔젤, 운영 역할 관리 |
| 보고 관리 | 보고 템플릿, 보고 주차, 제출 현황 관리 |
| 참여 히스토리 | 팀별/멤버별 참여율 조회 |

![멤버 관리](screenshots/handoff/14-members.png)

멤버 관리는 카드 클릭 후 모달에서 수정합니다. 저장 중에는 스피너가 보이고, 완료 후 토스트가 나타납니다.

![보고 관리](screenshots/handoff/15-admin-reports.png)

보고 관리에서는 템플릿과 주차를 만들고, 주차별 제출 현황을 확인합니다.

![보고 상세](screenshots/handoff/16-admin-report-detail.png)

![히스토리](screenshots/handoff/17-history.png)

히스토리는 기간을 바꿔 조회할 수 있습니다. 조회가 오래 걸리면 화면 상단에 진행바가 나타납니다.

![조회 진행바](screenshots/handoff/18-loading-progress.png)

## 7. 모바일 확인

주요 화면은 모바일에서도 확인합니다.

![모바일 입장](screenshots/handoff/19-mobile-entry.png)

![모바일 모임 상세](screenshots/handoff/20-mobile-meeting-detail.png)

## 문제가 생겼을 때

| 상황 | 먼저 확인할 것 |
| --- | --- |
| 입장이 안 됨 | 기수 입장 코드가 맞는지, 기수가 삭제 상태인지 확인 |
| 엔젤/관리자 화면이 안 열림 | 해당 기수의 엔젤 코드 또는 관리자 코드 확인 |
| 저장 후 화면이 안 바뀜 | 버튼 스피너가 끝났는지, 토스트나 오류 문구가 보이는지 확인 |
| 조회가 오래 걸림 | 상단 진행바가 보이는지 확인하고, 계속 멈추면 DB 연결 확인 |
| 데이터가 안 보임 | 현재 선택한 기수와 날짜/기간 필터 확인 |
