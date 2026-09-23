CREATE TABLE polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL CHECK (char_length(question) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls (id),
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 100),
  position integer NOT NULL,
  UNIQUE (poll_id, position),
  -- votes(option_id, poll_id) 복합 FK의 대상: 그 Poll에 속한 Option에만 투표하도록 DB가 강제한다.
  UNIQUE (id, poll_id)
);
