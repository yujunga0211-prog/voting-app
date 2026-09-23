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

describe("getPollView", () => {
  it("returns null for a Poll id that does not exist", async () => {
    expect(await polls.getPollView("3f2b8c1e-9d4a-4e7b-8a6c-1b2d3e4f5a6b", null)).toBeNull();
  });

  it("returns null for a malformed Poll id instead of failing", async () => {
    expect(await polls.getPollView("not-a-uuid", null)).toBeNull();
  });
});
