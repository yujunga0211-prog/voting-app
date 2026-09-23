import { getSql, type Sql } from "@/lib/db";
import { MAX_OPTIONS, MIN_OPTIONS, OPTION_MAX_LENGTH, QUESTION_MAX_LENGTH } from "@/lib/poll-limits";

// polls 도메인 모듈: Poll 생성·조회 규칙과 SQL은 모두 여기에 둔다. 페이지와 Server Action은 이 모듈만 부른다.

export type CreatePollInput = { question: string; options: string[] };
// optionAt의 키는 입력칸 위치(빈 칸 포함)라서 폼이 해당 칸 옆에 메시지를 붙일 수 있다.
export type CreatePollErrors = {
  question?: string;
  options?: string;
  optionAt?: Record<number, string>;
};
export type CreatePollResult = { ok: true; pollId: string } | { ok: false; errors: CreatePollErrors };

export type Poll = { id: string; question: string };
export type Option = { id: string; text: string };
export type ResultOption = Option & { votes: number };
export type PollView =
  | { kind: "form"; poll: Poll; options: Option[] }
  | {
      kind: "results";
      poll: Poll;
      options: ResultOption[];
      totalVotes: number;
      myOptionId: string;
    };
export type CastVoteInput = { pollId: string; optionId: string; voterId: string };
export type CastVoteResult = "voted" | "already_voted" | "poll_not_found" | "option_not_in_poll";
export type PollSummary = { id: string; question: string; createdAt: Date };

const RECENT_POLLS_LIMIT = 20;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validate(question: string, rawOptions: string[]) {
  const errors: CreatePollErrors = {};
  const optionAt: Record<number, string> = {};
  const options: string[] = [];
  const seen = new Set<string>();

  if (question.length === 0) errors.question = "질문을 입력해 주세요.";
  else if (question.length > QUESTION_MAX_LENGTH)
    errors.question = `질문은 ${QUESTION_MAX_LENGTH}자 이하로 입력해 주세요.`;

  rawOptions.forEach((raw, index) => {
    const text = raw.trim();
    if (text.length === 0) return; // 빈 입력칸은 무시한다.
    options.push(text);
    const key = text.toLowerCase();
    if (text.length > OPTION_MAX_LENGTH)
      optionAt[index] = `선택지는 ${OPTION_MAX_LENGTH}자 이하로 입력해 주세요.`;
    else if (seen.has(key)) optionAt[index] = "이미 입력한 선택지입니다.";
    seen.add(key);
  });

  if (options.length < MIN_OPTIONS) errors.options = `선택지를 ${MIN_OPTIONS}개 이상 입력해 주세요.`;
  else if (options.length > MAX_OPTIONS)
    errors.options = `선택지는 ${MAX_OPTIONS}개까지 입력할 수 있습니다.`;
  if (Object.keys(optionAt).length > 0) errors.optionAt = optionAt;

  return { options, errors: Object.keys(errors).length > 0 ? errors : null };
}

export function createPolls(sql: Sql) {
  async function createPoll(input: CreatePollInput): Promise<CreatePollResult> {
    const question = input.question.trim();
    const { options, errors } = validate(question, input.options);
    if (errors) return { ok: false, errors };

    // 단일 문장이라 원자적이다: Option 없는 Poll이 남지 않는다.
    const rows = await sql`
      WITH poll AS (
        INSERT INTO polls (question) VALUES (${question}) RETURNING id
      ), inserted AS (
        INSERT INTO options (poll_id, text, position)
        SELECT poll.id, o.text, o.ord - 1
        FROM poll, unnest(${options}::text[]) WITH ORDINALITY AS o(text, ord)
      )
      SELECT id FROM poll
    `;
    return { ok: true, pollId: rows[0].id };
  }

  // Results 공개 여부는 여기 한 곳에서만 정한다(ADR-0002): 이 Poll에 Vote한 Voter에게만 results.
  async function getPollView(pollId: string, voterId: string | null): Promise<PollView | null> {
    // 형식이 잘못된 id는 DB 오류 대신 "없음"으로 취급한다.
    if (!UUID_PATTERN.test(pollId)) return null;
    const pollRows = await sql`SELECT id, question FROM polls WHERE id = ${pollId}`;
    if (pollRows.length === 0) return null;
    const poll = { id: pollRows[0].id, question: pollRows[0].question };

    const myVote =
      voterId === null
        ? []
        : await sql`SELECT option_id FROM votes WHERE poll_id = ${pollId} AND voter_id = ${voterId}`;

    if (myVote.length === 0) {
      const optionRows = await sql`
        SELECT id, text FROM options WHERE poll_id = ${pollId} ORDER BY position
      `;
      return { kind: "form", poll, options: optionRows.map((o) => ({ id: o.id, text: o.text })) };
    }

    const optionRows = await sql`
      SELECT o.id, o.text, count(v.id)::int AS votes
      FROM options o LEFT JOIN votes v ON v.option_id = o.id
      WHERE o.poll_id = ${pollId}
      GROUP BY o.id
      ORDER BY o.position
    `;
    const options = optionRows.map((o) => ({ id: o.id, text: o.text, votes: o.votes }));
    return {
      kind: "results",
      poll,
      options,
      totalVotes: options.reduce((sum, o) => sum + o.votes, 0),
      myOptionId: myVote[0].option_id,
    };
  }

  async function castVote({ pollId, optionId, voterId }: CastVoteInput): Promise<CastVoteResult> {
    if (!UUID_PATTERN.test(pollId)) return "poll_not_found";
    if (!UUID_PATTERN.test(optionId)) {
      const exists = await sql`SELECT 1 FROM polls WHERE id = ${pollId}`;
      return exists.length === 0 ? "poll_not_found" : "option_not_in_poll";
    }

    // 한 문장으로 확인과 삽입을 한다. 중복은 UNIQUE(poll_id, voter_id)가 막고,
    // ON CONFLICT DO NOTHING으로 예외 대신 "삽입 안 됨"이 되어 동시 제출에도 한 표만 남는다.
    const [row] = await sql`
      WITH poll AS (
        SELECT id FROM polls WHERE id = ${pollId}
      ), option AS (
        SELECT id FROM options WHERE id = ${optionId} AND poll_id = ${pollId}
      ), inserted AS (
        INSERT INTO votes (poll_id, option_id, voter_id)
        SELECT ${pollId}, option.id, ${voterId} FROM option
        ON CONFLICT (poll_id, voter_id) DO NOTHING
        RETURNING id
      )
      SELECT
        EXISTS (SELECT 1 FROM poll) AS poll_exists,
        EXISTS (SELECT 1 FROM option) AS option_in_poll,
        EXISTS (SELECT 1 FROM inserted) AS inserted
    `;
    if (!row.poll_exists) return "poll_not_found";
    if (!row.option_in_poll) return "option_not_in_poll";
    return row.inserted ? "voted" : "already_voted";
  }

  // 득표 관련 필드는 일부러 반환하지 않는다(ADR-0002: 목록으로 결과가 새지 않음).
  async function listRecentPolls(): Promise<PollSummary[]> {
    const rows = await sql`
      SELECT id, question, created_at FROM polls
      ORDER BY created_at DESC, id DESC
      LIMIT ${RECENT_POLLS_LIMIT}
    `;
    return rows.map((r) => ({ id: r.id, question: r.question, createdAt: new Date(r.created_at) }));
  }

  return { createPoll, listRecentPolls, getPollView, castVote };
}

// 앱(페이지·Server Action)이 쓰는 인스턴스. 테스트는 createPolls에 테스트 DB 클라이언트를 넘긴다.
export function appPolls() {
  return createPolls(getSql());
}
