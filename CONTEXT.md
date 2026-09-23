# Voting

누구나 질문 하나와 선택지를 올리면, 사람들이 그중 하나를 골라 투표하고 결과(득표수)를 보는 간단한 투표 앱.

## Language

**Poll**:
질문 문장(`question`) 하나와 2~10개의 **Option**, 그리고 선택적인 **마감 시각**으로 이루어진 투표 단위. 로그인 없이 누구나 만들 수 있고, 생성 후에는 수정·삭제할 수 없다(마감 시각도 바꿀 수 없다).
_Avoid_: 설문, Survey, Question(질문 문장 자체만 가리킬 때 `poll.question`으로 사용)

**마감 시각(closes_at)**:
Poll을 만들 때 정하는, 그 시각부터 더 이상 Vote를 받지 않는 시점. 선택 사항이며 없으면 그 Poll은 영원히 Open Poll이다.
_Avoid_: Deadline, 종료 시각, 만료

**Open Poll**:
마감 시각이 없거나 아직 마감 시각 전인 Poll. Vote를 받는다.
_Avoid_: 진행 중인 투표, Active

**Closed Poll**:
마감 시각이 지난 Poll(정확히 그 시각부터 포함). Vote를 받지 않으며, 누구에게나 Results가 보인다.
_Avoid_: Expired, Ended, 종료된 투표

**Option**:
한 **Poll** 안의 선택지. 같은 Poll 안에서 문구가 중복될 수 없다(앞뒤 공백 제거, 대소문자 무시 후 비교).
_Avoid_: Choice, Answer, 항목

**Vote**:
한 **Voter**가 한 **Poll**에서 **Option** 하나를 고른 기록. 한 Voter는 한 Poll에 Vote를 하나만 가질 수 있고, 변경·취소할 수 없다.
_Avoid_: Ballot, Response

**Voter**:
`voter_id` 쿠키로 식별되는 익명 브라우저. 사람이나 계정이 아니므로, 같은 사람이 다른 브라우저로 여러 Voter가 될 수 있다.
_Avoid_: User, 참여자, 계정

**Results**:
한 **Poll**의 Option별 득표수·비율(%)과 총 투표 수. Closed Poll이면 누구에게나, Open Poll이면 그 Poll에 이미 Vote를 한 **Voter**에게만 보인다.
_Avoid_: 통계, 차트

## 규칙

- 한 Voter는 한 Poll에 한 번만 투표한다: DB `UNIQUE(poll_id, voter_id)`로 강제 ([ADR-0001](docs/adr/0001-anonymous-voter-cookie-dedup.md)).
- Results는 Open Poll에서는 투표한 Voter에게만, Closed Poll에서는 누구에게나 보인다. 목록이나 별도 URL로 득표수가 새지 않는다 ([ADR-0002](docs/adr/0002-results-visible-only-after-voting.md)).
- Closed Poll에는 Vote할 수 없다: 서버가 마감 시각과 현재 시각을 비교해 거부한다 ([ADR-0005](docs/adr/0005-closing-time-computed-and-immutable.md)).
- 질문 문장 1~200자, Option 문구 1~100자, Option 2~10개.
- 마감 시각은 만들 때 기준으로 미래여야 하고 30일 이내여야 한다.

## 이번 버전 범위 밖

로그인, 실시간 갱신, 마감 알림(리마인더), 마감 연장·조기 마감, Poll 수정·삭제, 투표 변경, 스팸 방지, 페이지네이션, 복수 선택.
