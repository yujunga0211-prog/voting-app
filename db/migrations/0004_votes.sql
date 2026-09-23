CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL,
  option_id uuid NOT NULL,
  voter_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- ADR-0001: 한 Voter는 한 Poll에 한 번만 투표한다.
  UNIQUE (poll_id, voter_id),
  -- 그 Poll에 속한 Option에만 투표할 수 있도록 DB가 강제한다.
  FOREIGN KEY (option_id, poll_id) REFERENCES options (id, poll_id)
);

CREATE INDEX votes_option_id_idx ON votes (option_id);
