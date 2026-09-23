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
export type PollView = { kind: "form"; poll: Poll; options: Option[] };

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

  async function getPollView(pollId: string, _voterId: string | null): Promise<PollView | null> {
    // 형식이 잘못된 id는 DB 오류 대신 "없음"으로 취급한다.
    if (!UUID_PATTERN.test(pollId)) return null;
    const pollRows = await sql`SELECT id, question FROM polls WHERE id = ${pollId}`;
    if (pollRows.length === 0) return null;
    const optionRows = await sql`
      SELECT id, text FROM options WHERE poll_id = ${pollId} ORDER BY position
    `;
    return {
      kind: "form",
      poll: { id: pollRows[0].id, question: pollRows[0].question },
      options: optionRows.map((o) => ({ id: o.id, text: o.text })),
    };
  }

  return { createPoll, getPollView };
}

// 앱(페이지·Server Action)이 쓰는 인스턴스. 테스트는 createPolls에 테스트 DB 클라이언트를 넘긴다.
export function appPolls() {
  return createPolls(getSql());
}
