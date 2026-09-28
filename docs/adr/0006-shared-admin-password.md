# Admin은 공유 비밀번호 하나로 로그인하고, Poll 생성·삭제는 Admin만 한다

과제 요구(운영자 비밀번호 제출)와 수업 자료에 맞춰 ADR-0004(누구나 Poll 생성)를 대체한다. 개인 계정 없이 Vercel 환경변수 `ADMIN_TOKEN` 하나를 모든 Admin이 함께 쓰고, 로그인하면 1일짜리 `httpOnly` 세션 쿠키를 발급한다. Poll 생성과 삭제는 Admin만 할 수 있고, 투표와 결과 보기는 지금처럼 익명 Voter가 한다(ADR-0001, ADR-0002 유지).

## Consequences

- 세션 쿠키는 `만료시각.HMAC` 형태이며 서명 키가 `ADMIN_TOKEN` 자체다. 별도 `SESSION_SECRET`이 필요 없고, 비밀번호를 바꾸면 기존 세션이 모두 끊긴다. 대신 비밀번호가 유출되면 세션 위조도 가능해지므로, 비밀번호는 과제 전용 값만 쓴다.
- Admin끼리 구분되지 않아 "누가 만들었는지/지웠는지"는 기록되지 않는다.
- 권한은 화면이 아니라 각 Server Action에서 다시 확인한다. 보호할 Admin 전용 페이지가 없어서 `proxy.ts`는 두지 않았다.
- Poll 삭제는 Vote·Option·Poll을 SQL 한 문장으로 지운다. 스키마에 `ON DELETE CASCADE`를 추가하는 마이그레이션은 하지 않았다.
