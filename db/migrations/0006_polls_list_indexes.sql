-- 홈 목록 두 섹션용: 진행 중(마감 임박순, 마감 없음은 최신순)과 마감됨(최근 마감순).
DROP INDEX IF EXISTS polls_closes_at_idx;
CREATE INDEX polls_closes_at_idx ON polls (closes_at, created_at DESC, id DESC);
