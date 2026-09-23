import { getSql, type Sql } from "@/lib/db";

// polls 도메인 모듈: Poll 생성·조회 규칙과 SQL은 모두 여기에 둔다. 페이지와 Server Action은 이 모듈만 부른다.

export type CreatePollInput = { question: string; options: string[] };
export type CreatePollResult = { ok: true; pollId: string } | { ok: false };

export type Poll = { id: string; question: string };
export type Option = { id: string; text: string };
export type PollView = { kind: "form"; poll: Poll; options: Option[] };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createPolls(sql: Sql) {
  async function createPoll(input: CreatePollInput): Promise<CreatePollResult> {
    const question = input.question.trim();
    const options = input.options.map((o) => o.trim());
    // 빈 배열이면 unnest가 행을 만들지 않아 Option 없는 Poll이 남는다. 나머지 개수·중복 규칙은 #3에서 다룬다.
    if (options.length === 0) return { ok: false };

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
