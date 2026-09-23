-- 마감 시각(선택). NULL이면 마감 없는 Poll이며, 기존 Poll은 모두 NULL이 된다.
-- Open/Closed 상태는 저장하지 않고 closes_at과 현재 시각으로 계산한다(ADR-0005).
ALTER TABLE polls ADD COLUMN closes_at timestamptz;

CREATE INDEX polls_closes_at_idx ON polls (closes_at);
