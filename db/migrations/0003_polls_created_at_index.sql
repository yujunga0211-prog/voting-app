-- 홈 목록(최신 Poll 20개)용 인덱스.
CREATE INDEX polls_created_at_idx ON polls (created_at DESC, id DESC);
