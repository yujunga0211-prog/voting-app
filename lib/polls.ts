import { getSql, type Sql } from "@/lib/db";
import {
  MAX_CLOSING_DAYS,
  MAX_OPTIONS,
  MIN_OPTIONS,
  OPTION_MAX_LENGTH,
  QUESTION_MAX_LENGTH,
} from "@/lib/poll-limits";

// polls 도메인 모듈: Poll 생성·조회 규칙과 SQL은 모두 여기에 둔다. 페이지와 Server Action은 이 모듈만 부른다.

// closesAt이 없거나 null이면 마감 없는 Poll이다.
export type CreatePollInput = { question: string; options: string[]; closesAt?: Date | null };
// optionAt의 키는 입력칸 위치(빈 칸 포함)라서 폼이 해당 칸 옆에 메시지를 붙일 수 있다.
export type CreatePollErrors = {
  question?: string;
  options?: string;
  optionAt?: Record<number, string>;
  closesAt?: string;
};
export type CreatePollResult = { ok: true; pollId: string } | { ok: false; errors: CreatePollErrors };

// isClosed는 저장하지 않고 clock과 closesAt으로 계산한다(ADR-0005).
export type Poll = { id: string; question: string; closesAt: Date | null; isClosed: boolean };
export type Option = { id: string; text: string };
// percent: 총 투표 수 대비 비율을 정수로 반올림한 값. 합계를 100으로 보정하지 않고, 총 0표면 0.
export type ResultOption = Option & { votes: number; percent: number };
export type PollView =
  | { kind: "form"; poll: Poll; options: Option[] }
  | {
      kind: "results";
      poll: Poll;
      options: ResultOption[];
      totalVotes: number;
      // Closed Poll은 투표하지 않은 방문자에게도 보이므로 null일 수 있다.
      myOptionId: string | null;
    };
export type CastVoteInput = { pollId: string; optionId: string; voterId: string };
export type CastVoteResult =
  | "voted"
  | "already_voted"
  | "poll_not_found"
  | "poll_closed"
  | "option_not_in_poll";
export type Clock = () => Date;
export type PollSummary = { id: string; question: string; createdAt: Date; closesAt: Date | null };

const SECTION_LIMIT = 20;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DAY_MS = 24 * 60 * 60 * 1000;

function validatePollInput(question: string, rawOptions: string[], closesAt: Date | null, now: Date) {
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

  if (closesAt !== null) {
    if (Number.isNaN(closesAt.getTime())) errors.closesAt = "마감 시각이 올바르지 않습니다.";
    else if (closesAt <= now) errors.closesAt = "마감 시각은 지금보다 뒤로 정해 주세요.";
    else if (closesAt.getTime() > now.getTime() + MAX_CLOSING_DAYS * DAY_MS)
      errors.closesAt = `마감 시각은 ${MAX_CLOSING_DAYS}일 이내로 정해 주세요.`;
  }

  return { options, errors: Object.keys(errors).length > 0 ? errors : null };
}

// clock은 Open/Closed 판정과 마감 시각 검증의 기준이다. 테스트는 원하는 시각을 주입한다.
export function createPolls(sql: Sql, clock: Clock = () => new Date()) {
  function toPoll(row: Record<string, unknown>): Poll {
    const closesAt = row.closes_at === null ? null : new Date(row.closes_at as string);
    return {
      id: row.id as string,
      question: row.question as string,
      closesAt,
      isClosed: closesAt !== null && clock() >= closesAt,
    };
  }

  async function createPoll(input: CreatePollInput): Promise<CreatePollResult> {
    const question = input.question.trim();
    const closesAt = input.closesAt ?? null;
    const { options, errors } = validatePollInput(question, input.options, closesAt, clock());
    if (errors) return { ok: false, errors };

    // 단일 문장이라 원자적이다: Option 없는 Poll이 남지 않는다.
    const rows = await insertPoll(question, options, closesAt).catch((error) => {
      // JS toLowerCase와 Postgres lower()가 다른 문자(예: 그리스어 시그마)는 DB 인덱스에서만 걸린다.
      if (error?.constraint === "options_poll_id_lower_text_key") return null;
      throw error;
    });
    if (!rows) return { ok: false, errors: { options: "중복된 선택지가 있습니다." } };
    return { ok: true, pollId: rows[0].id };
  }

  function insertPoll(question: string, options: string[], closesAt: Date | null) {
    return sql`
      WITH poll AS (
        INSERT INTO polls (question, closes_at)
        VALUES (${question}, ${closesAt?.toISOString() ?? null}::timestamptz)
        RETURNING id
      ), inserted AS (
        INSERT INTO options (poll_id, text, position)
        SELECT poll.id, o.text, o.ord - 1
        FROM poll, unnest(${options}::text[]) WITH ORDINALITY AS o(text, ord)
      )
      SELECT id FROM poll
    `;
  }

  // Results 공개 여부는 여기 한 곳에서만 정한다(ADR-0002):
  // Closed Poll이면 누구에게나, Open Poll이면 이 Poll에 Vote한 Voter에게만 results.
  async function getPollView(pollId: string, voterId: string | null): Promise<PollView | null> {
    // 형식이 잘못된 id는 DB 오류 대신 "없음"으로 취급한다.
    if (!UUID_PATTERN.test(pollId)) return null;
    const pollRows = await sql`SELECT id, question, closes_at FROM polls WHERE id = ${pollId}`;
    if (pollRows.length === 0) return null;
    const poll = toPoll(pollRows[0]);

    const myVote =
      voterId === null
        ? []
        : await sql`SELECT option_id FROM votes WHERE poll_id = ${pollId} AND voter_id = ${voterId}`;

    if (myVote.length === 0 && !poll.isClosed) {
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
    const totalVotes = optionRows.reduce((sum, o) => sum + o.votes, 0);
    const options = optionRows.map((o) => ({
      id: o.id,
      text: o.text,
      votes: o.votes,
      percent: totalVotes === 0 ? 0 : Math.round((o.votes / totalVotes) * 100),
    }));
    return {
      kind: "results",
      poll,
      options,
      totalVotes,
      myOptionId: myVote[0]?.option_id ?? null,
    };
  }

  async function castVote({ pollId, optionId, voterId }: CastVoteInput): Promise<CastVoteResult> {
    if (!UUID_PATTERN.test(pollId)) return "poll_not_found";
    // 형식이 잘못된 Option id는 어떤 Option과도 맞지 않는 null로 바꿔 같은 문장에서 판정한다.
    const optionIdOrNull = UUID_PATTERN.test(optionId) ? optionId : null;

    // 한 문장으로 확인과 삽입을 한다. 마감은 이 문장 안에서 판정하므로 폼을 연 채 마감이 지나도 거부된다.
    // 중복은 UNIQUE(poll_id, voter_id)가 막고, ON CONFLICT DO NOTHING으로 예외 대신
    // "삽입 안 됨"이 되어 동시 제출에도 한 표만 남는다.
    const [row] = await sql`
      WITH poll AS (
        SELECT id, (closes_at IS NULL OR closes_at > ${clock().toISOString()}::timestamptz) AS is_open
        FROM polls WHERE id = ${pollId}
      ), option AS (
        SELECT options.id FROM options, poll
        WHERE options.id = ${optionIdOrNull}::uuid AND options.poll_id = poll.id AND poll.is_open
      ), inserted AS (
        INSERT INTO votes (poll_id, option_id, voter_id)
        SELECT ${pollId}, option.id, ${voterId} FROM option
        ON CONFLICT (poll_id, voter_id) DO NOTHING
        RETURNING id
      )
      SELECT
        EXISTS (SELECT 1 FROM poll) AS poll_exists,
        EXISTS (SELECT 1 FROM poll WHERE is_open) AS poll_open,
        EXISTS (SELECT 1 FROM option) AS option_in_poll,
        EXISTS (SELECT 1 FROM inserted) AS inserted
    `;
    if (!row.poll_exists) return "poll_not_found";
    if (!row.poll_open) return "poll_closed";
    if (!row.option_in_poll) return "option_not_in_poll";
    return row.inserted ? "voted" : "already_voted";
  }

  // 홈 목록. 득표 관련 필드는 일부러 반환하지 않는다(ADR-0002: 목록으로 결과가 새지 않음).
  // open: 마감 임박순 → 마감 없는 Poll 최신순, closed: 최근 마감순, 각 최대 20개.
  async function listPolls(): Promise<{ open: PollSummary[]; closed: PollSummary[] }> {
    const now = clock().toISOString();
    const [open, closed] = await Promise.all([
      sql`
        SELECT id, question, created_at, closes_at FROM polls
        WHERE closes_at IS NULL OR closes_at > ${now}::timestamptz
        ORDER BY closes_at ASC NULLS LAST, created_at DESC, id DESC
        LIMIT ${SECTION_LIMIT}
      `,
      sql`
        SELECT id, question, created_at, closes_at FROM polls
        WHERE closes_at <= ${now}::timestamptz
        ORDER BY closes_at DESC, id DESC
        LIMIT ${SECTION_LIMIT}
      `,
    ]);
    const toSummary = (r: Record<string, unknown>): PollSummary => ({
      id: r.id as string,
      question: r.question as string,
      createdAt: new Date(r.created_at as string),
      closesAt: r.closes_at === null ? null : new Date(r.closes_at as string),
    });
    return { open: open.map(toSummary), closed: closed.map(toSummary) };
  }

  return { createPoll, listPolls, getPollView, castVote };
}

// 앱(페이지·Server Action)이 쓰는 인스턴스. 테스트는 createPolls에 테스트 DB 클라이언트를 넘긴다.
export function appPolls(): ReturnType<typeof createPolls> {
  return createPolls(getSql());
}
