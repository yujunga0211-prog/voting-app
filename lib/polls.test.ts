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

  it("returns an error instead of failing when only the DB sees Options as duplicates", async () => {
    // JS toLowerCase("ΑΣ") === "ας" 이지만 Postgres lower()는 "ασ"라서 JS 검사는 통과한다.
    const created = await polls.createPoll({ question: "Q?", options: ["ΑΣ", "ασ"] });
    expect(created).toEqual({ ok: false, errors: { options: "중복된 선택지가 있습니다." } });
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

describe("listRecentPolls", () => {
  it("returns an empty list when there are no Polls", async () => {
    expect(await polls.listRecentPolls()).toEqual([]);
  });

  it("lists Polls newest first with only id, question and creation time", async () => {
    const first = await polls.createPoll({ question: "첫 번째?", options: ["a", "b"] });
    const second = await polls.createPoll({ question: "두 번째?", options: ["a", "b"] });
    if (!first.ok || !second.ok) throw new Error("expected Polls to be created");

    const list = await polls.listRecentPolls();
    expect(list.map((p) => p.question)).toEqual(["두 번째?", "첫 번째?"]);
    expect(list[0].id).toBe(second.pollId);
    expect(list[0].createdAt).toBeInstanceOf(Date);
    expect(Object.keys(list[0]).sort()).toEqual(["createdAt", "id", "question"]);
  });

  it("returns at most the 20 newest Polls", async () => {
    for (let i = 1; i <= 21; i++) {
      await polls.createPoll({ question: `Poll ${i}`, options: ["a", "b"] });
    }

    const list = await polls.listRecentPolls();
    expect(list).toHaveLength(20);
    expect(list[0].question).toBe("Poll 21");
    expect(list.map((p) => p.question)).not.toContain("Poll 1");
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

describe("castVote and Results", () => {
  const alice = "voter-alice";
  const bob = "voter-bob";

  async function makePoll(question = "점심?", options = ["김밥", "라면", "돈까스"]) {
    const created = await polls.createPoll({ question, options });
    if (!created.ok) throw new Error("expected Poll to be created");
    const view = await polls.getPollView(created.pollId, null);
    if (!view) throw new Error("expected Poll view");
    return { pollId: created.pollId, optionIds: view.options.map((o) => o.id) };
  }

  it("shows the form to a Voter who has not voted", async () => {
    const { pollId } = await makePoll();
    expect((await polls.getPollView(pollId, alice))?.kind).toBe("form");
  });

  it("records a Vote and then shows Results with 0-vote Options, total and my choice in form order", async () => {
    const { pollId, optionIds } = await makePoll();

    expect(await polls.castVote({ pollId, optionId: optionIds[1], voterId: alice })).toBe("voted");

    expect(await polls.getPollView(pollId, alice)).toEqual({
      kind: "results",
      poll: { id: pollId, question: "점심?", closesAt: null, isClosed: false },
      options: [
        { id: optionIds[0], text: "김밥", votes: 0 },
        { id: optionIds[1], text: "라면", votes: 1 },
        { id: optionIds[2], text: "돈까스", votes: 0 },
      ],
      totalVotes: 1,
      myOptionId: optionIds[1],
    });
  });

  it("counts other Voters' Votes in Results", async () => {
    const { pollId, optionIds } = await makePoll();
    await polls.castVote({ pollId, optionId: optionIds[0], voterId: bob });
    await polls.castVote({ pollId, optionId: optionIds[0], voterId: "voter-carol" });
    await polls.castVote({ pollId, optionId: optionIds[2], voterId: alice });

    const view = await polls.getPollView(pollId, alice);
    if (view?.kind !== "results") throw new Error("expected results");
    expect(view.options.map((o) => o.votes)).toEqual([2, 0, 1]);
    expect(view.totalVotes).toBe(3);
    expect(view.myOptionId).toBe(optionIds[2]);
  });

  it("does not show Results to a Voter just because someone else voted", async () => {
    const { pollId, optionIds } = await makePoll();
    await polls.castVote({ pollId, optionId: optionIds[0], voterId: bob });

    expect((await polls.getPollView(pollId, alice))?.kind).toBe("form");
    expect((await polls.getPollView(pollId, null))?.kind).toBe("form");
  });

  it("rejects a second Vote by the same Voter without changing the counts", async () => {
    const { pollId, optionIds } = await makePoll();
    await polls.castVote({ pollId, optionId: optionIds[0], voterId: alice });

    expect(await polls.castVote({ pollId, optionId: optionIds[1], voterId: alice })).toBe(
      "already_voted",
    );

    const view = await polls.getPollView(pollId, alice);
    if (view?.kind !== "results") throw new Error("expected results");
    expect(view.options.map((o) => o.votes)).toEqual([1, 0, 0]);
    expect(view.myOptionId).toBe(optionIds[0]);
  });

  it("records exactly one Vote when the same Voter submits twice at the same time", async () => {
    const { pollId, optionIds } = await makePoll();

    const outcomes = await Promise.all([
      polls.castVote({ pollId, optionId: optionIds[0], voterId: alice }),
      polls.castVote({ pollId, optionId: optionIds[1], voterId: alice }),
    ]);

    expect(outcomes.sort()).toEqual(["already_voted", "voted"]);
    const view = await polls.getPollView(pollId, alice);
    if (view?.kind !== "results") throw new Error("expected results");
    expect(view.totalVotes).toBe(1);
  });

  it("rejects an Option that belongs to another Poll", async () => {
    const a = await makePoll("A?", ["a1", "a2"]);
    const b = await makePoll("B?", ["b1", "b2"]);

    expect(
      await polls.castVote({ pollId: a.pollId, optionId: b.optionIds[0], voterId: alice }),
    ).toBe("option_not_in_poll");
    expect(
      await polls.castVote({ pollId: a.pollId, optionId: "not-a-uuid", voterId: alice }),
    ).toBe("option_not_in_poll");
    expect((await polls.getPollView(a.pollId, alice))?.kind).toBe("form");
  });

  it("reports a Poll that does not exist", async () => {
    const { optionIds } = await makePoll();
    expect(
      await polls.castVote({
        pollId: "3f2b8c1e-9d4a-4e7b-8a6c-1b2d3e4f5a6b",
        optionId: optionIds[0],
        voterId: alice,
      }),
    ).toBe("poll_not_found");
    expect(
      await polls.castVote({ pollId: "not-a-uuid", optionId: optionIds[0], voterId: alice }),
    ).toBe("poll_not_found");
  });

  it("lets the same Voter vote in a different Poll", async () => {
    const a = await makePoll("A?", ["a1", "a2"]);
    const b = await makePoll("B?", ["b1", "b2"]);
    await polls.castVote({ pollId: a.pollId, optionId: a.optionIds[0], voterId: alice });

    expect(await polls.castVote({ pollId: b.pollId, optionId: b.optionIds[1], voterId: alice })).toBe(
      "voted",
    );
  });
});

describe("closing time", () => {
  // 테스트가 현재 시각을 조절할 수 있도록 clock을 주입한다.
  const T0 = new Date("2026-09-23T03:00:00Z"); // 한국 시간 12:00
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  let now = T0;
  const timed = createPolls(testSql, () => now);

  beforeEach(() => {
    now = T0;
  });

  async function makePoll(closesAt: Date | null) {
    const created = await timed.createPoll({ question: "마감 테스트?", options: ["a", "b"], closesAt });
    if (!created.ok) throw new Error(`expected Poll: ${JSON.stringify(created.errors)}`);
    const view = await timed.getPollView(created.pollId, null);
    if (!view) throw new Error("expected view");
    return { pollId: created.pollId, optionIds: view.options.map((o) => o.id) };
  }

  it("accepts a closing time in the future within 30 days, or none", async () => {
    for (const closesAt of [null, new Date(T0.getTime() + 1000), new Date(T0.getTime() + 30 * DAY)]) {
      const created = await timed.createPoll({ question: "Q?", options: ["a", "b"], closesAt });
      expect(created.ok).toBe(true);
    }
  });

  it("rejects a closing time that is now or in the past", async () => {
    for (const closesAt of [T0, new Date(T0.getTime() - HOUR)]) {
      expect(await timed.createPoll({ question: "Q?", options: ["a", "b"], closesAt })).toEqual({
        ok: false,
        errors: { closesAt: "마감 시각은 지금보다 뒤로 정해 주세요." },
      });
    }
  });

  it("rejects a closing time more than 30 days away or an invalid date", async () => {
    expect(
      await timed.createPoll({
        question: "Q?",
        options: ["a", "b"],
        closesAt: new Date(T0.getTime() + 30 * DAY + 1000),
      }),
    ).toEqual({ ok: false, errors: { closesAt: "마감 시각은 30일 이내로 정해 주세요." } });

    expect(
      await timed.createPoll({ question: "Q?", options: ["a", "b"], closesAt: new Date("nope") }),
    ).toEqual({ ok: false, errors: { closesAt: "마감 시각이 올바르지 않습니다." } });
  });

  it("reports a closing time error together with other errors", async () => {
    const created = await timed.createPoll({ question: "", options: ["a"], closesAt: T0 });
    expect(created).toEqual({
      ok: false,
      errors: {
        question: "질문을 입력해 주세요.",
        options: "선택지를 2개 이상 입력해 주세요.",
        closesAt: "마감 시각은 지금보다 뒤로 정해 주세요.",
      },
    });
  });

  it("shows the closing time and Open state before it, and becomes Closed exactly at it", async () => {
    const closesAt = new Date(T0.getTime() + HOUR);
    const { pollId } = await makePoll(closesAt);

    now = new Date(closesAt.getTime() - 1);
    expect((await timed.getPollView(pollId, null))?.poll).toEqual({
      id: pollId,
      question: "마감 테스트?",
      closesAt,
      isClosed: false,
    });

    now = closesAt;
    expect((await timed.getPollView(pollId, null))?.poll.isClosed).toBe(true);
  });

  it("rejects a Vote on a Closed Poll without changing the counts", async () => {
    const closesAt = new Date(T0.getTime() + HOUR);
    const { pollId, optionIds } = await makePoll(closesAt);
    await timed.castVote({ pollId, optionId: optionIds[0], voterId: "early" });

    now = closesAt;
    expect(await timed.castVote({ pollId, optionId: optionIds[1], voterId: "late" })).toBe(
      "poll_closed",
    );
    expect(await timed.castVote({ pollId, optionId: "not-a-uuid", voterId: "late" })).toBe(
      "poll_closed",
    );

    const view = await timed.getPollView(pollId, "late");
    if (view?.kind !== "results") throw new Error("expected results");
    expect(view.options.map((o) => o.votes)).toEqual([1, 0]);
  });

  it("shows Results of a Closed Poll to anyone, with my choice only for a Voter who voted", async () => {
    const closesAt = new Date(T0.getTime() + HOUR);
    const { pollId, optionIds } = await makePoll(closesAt);
    await timed.castVote({ pollId, optionId: optionIds[1], voterId: "alice" });

    now = closesAt;
    const anonymous = await timed.getPollView(pollId, null);
    const nonVoter = await timed.getPollView(pollId, "bob");
    const voter = await timed.getPollView(pollId, "alice");

    for (const view of [anonymous, nonVoter]) {
      expect(view).toMatchObject({ kind: "results", totalVotes: 1, myOptionId: null });
    }
    expect(voter).toMatchObject({ kind: "results", myOptionId: optionIds[1] });
  });

  it("keeps the old rule for an Open Poll: only a Voter who voted sees Results", async () => {
    const { pollId, optionIds } = await makePoll(new Date(T0.getTime() + HOUR));
    await timed.castVote({ pollId, optionId: optionIds[0], voterId: "alice" });

    expect((await timed.getPollView(pollId, "bob"))?.kind).toBe("form");
    expect((await timed.getPollView(pollId, "alice"))?.kind).toBe("results");
  });

  it("keeps a Poll without a closing time Open forever", async () => {
    const { pollId, optionIds } = await makePoll(null);

    now = new Date(T0.getTime() + 3650 * DAY);
    expect((await timed.getPollView(pollId, null))?.poll).toMatchObject({
      closesAt: null,
      isClosed: false,
    });
    expect(await timed.castVote({ pollId, optionId: optionIds[0], voterId: "alice" })).toBe("voted");
  });
});
