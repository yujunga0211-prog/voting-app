import { beforeEach, describe, expect, it } from "vitest";
import { createPolls } from "@/lib/polls";
import { resetDb, testSql } from "@/db/test-db";

const polls = createPolls(testSql);

beforeEach(resetDb);

describe("createPoll", () => {
  it("creates a Poll whose form view shows the question and Options in input order", async () => {
    const created = await polls.createPoll({
      question: "점심 뭐 먹지?",
      options: ["김밥", "라면", "돈까스"],
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const view = await polls.getPollView(created.pollId, null);
    expect(view).toMatchObject({
      kind: "form",
      poll: { id: created.pollId, question: "점심 뭐 먹지?" },
    });
    expect(view?.options.map((o) => o.text)).toEqual(["김밥", "라면", "돈까스"]);
  });

  it("stores the question and Options without surrounding whitespace", async () => {
    const created = await polls.createPoll({
      question: "  주말에 뭐 하지?  ",
      options: [" 등산", "영화 "],
    });
    if (!created.ok) throw new Error("expected Poll to be created");

    const view = await polls.getPollView(created.pollId, null);
    expect(view?.poll.question).toBe("주말에 뭐 하지?");
    expect(view?.options.map((o) => o.text)).toEqual(["등산", "영화"]);
  });

  it("does not create a Poll without Options", async () => {
    const created = await polls.createPoll({ question: "선택지 없는 질문?", options: [] });
    expect(created.ok).toBe(false);
  });

  it("keeps each Poll's Options separate", async () => {
    const a = await polls.createPoll({ question: "A?", options: ["a1", "a2"] });
    const b = await polls.createPoll({ question: "B?", options: ["b1", "b2", "b3"] });
    if (!a.ok || !b.ok) throw new Error("expected Polls to be created");

    expect((await polls.getPollView(a.pollId, null))?.options.map((o) => o.text)).toEqual(["a1", "a2"]);
    expect((await polls.getPollView(b.pollId, null))?.options.map((o) => o.text)).toEqual([
      "b1",
      "b2",
      "b3",
    ]);
  });
});

describe("createPoll validation", () => {
  const longText = (n: number) => "가".repeat(n);

  it("rejects an empty question", async () => {
    const created = await polls.createPoll({ question: "   ", options: ["a", "b"] });
    expect(created).toEqual({ ok: false, errors: { question: "질문을 입력해 주세요." } });
  });

  it("rejects a question longer than 200 characters but accepts exactly 200", async () => {
    const tooLong = await polls.createPoll({ question: longText(201), options: ["a", "b"] });
    expect(tooLong).toEqual({
      ok: false,
      errors: { question: "질문은 200자 이하로 입력해 주세요." },
    });

    const atLimit = await polls.createPoll({ question: longText(200), options: ["a", "b"] });
    expect(atLimit.ok).toBe(true);
  });

  it("reports an Option longer than 100 characters at its input position", async () => {
    const created = await polls.createPoll({
      question: "Q?",
      options: ["a", longText(101), "c"],
    });
    expect(created).toEqual({
      ok: false,
      errors: { optionAt: { 1: "선택지는 100자 이하로 입력해 주세요." } },
    });
  });

  it("ignores empty Option inputs", async () => {
    const created = await polls.createPoll({ question: "Q?", options: ["a", "  ", "", "b"] });
    if (!created.ok) throw new Error("expected Poll to be created");
    const view = await polls.getPollView(created.pollId, null);
    expect(view?.options.map((o) => o.text)).toEqual(["a", "b"]);
  });

  it("rejects fewer than 2 Options after dropping empty inputs", async () => {
    const created = await polls.createPoll({ question: "Q?", options: ["a", " ", ""] });
    expect(created).toEqual({
      ok: false,
      errors: { options: "선택지를 2개 이상 입력해 주세요." },
    });
  });

  it("rejects more than 10 Options but accepts exactly 10", async () => {
    const eleven = Array.from({ length: 11 }, (_, i) => `o${i}`);
    expect(await polls.createPoll({ question: "Q?", options: eleven })).toEqual({
      ok: false,
      errors: { options: "선택지는 10개까지 입력할 수 있습니다." },
    });

    expect((await polls.createPoll({ question: "Q?", options: eleven.slice(0, 10) })).ok).toBe(true);
  });

  it("rejects Options that differ only in case or surrounding whitespace", async () => {
    const created = await polls.createPoll({
      question: "Q?",
      options: ["Pizza", "치킨", " pizza "],
    });
    expect(created).toEqual({
      ok: false,
      errors: { optionAt: { 2: "이미 입력한 선택지입니다." } },
    });
  });

  it("reports several errors at once", async () => {
    const created = await polls.createPoll({
      question: "",
      options: [longText(101), "", "A", "a"],
    });
    expect(created).toEqual({
      ok: false,
      errors: {
        question: "질문을 입력해 주세요.",
        optionAt: { 0: "선택지는 100자 이하로 입력해 주세요.", 3: "이미 입력한 선택지입니다." },
      },
    });
  });
});

describe("getPollView", () => {
  it("returns null for a Poll id that does not exist", async () => {
    expect(await polls.getPollView("3f2b8c1e-9d4a-4e7b-8a6c-1b2d3e4f5a6b", null)).toBeNull();
  });

  it("returns null for a malformed Poll id instead of failing", async () => {
    expect(await polls.getPollView("not-a-uuid", null)).toBeNull();
  });
});
