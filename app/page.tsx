import Link from "next/link";
import { connection } from "next/server";
import { appPolls, type PollSummary } from "@/lib/polls";
import { toSeoulDateTimeLocal } from "@/lib/format";
import { ClosingBadge } from "./closing-badge";
import { DEFAULT_CLOSING_DAYS } from "@/lib/poll-limits";
import { CreatePollForm } from "./create-poll-form";
import { cardClass } from "./ui";

// 요청 시각. 렌더링 중 new Date()를 직접 부르면 react-hooks/purity lint에 걸려서 함수로 감쌌다.
// 요청마다 렌더링하므로(connection) 문제없다. Open/Closed 판정에는 쓰지 않는다(polls 모듈의 isClosed 사용).
function requestTime(): Date {
  return new Date();
}

export default async function Home() {
  // 새 Poll과 마감 상태가 바로 반영되도록 요청마다 렌더링한다.
  await connection();
  const now = requestTime();
  const { open, closed } = await appPolls().listPolls();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">무엇이든 물어보세요</h1>
        <p className="mt-2 text-muted">질문과 선택지를 올리면 누구나 익명으로 투표할 수 있어요.</p>
      </div>

      <section className={`${cardClass} mt-8`}>
        <h2 className="text-lg font-semibold">새 Poll 만들기</h2>
        <CreatePollForm
          defaultClosesAt={toSeoulDateTimeLocal(
            new Date(now.getTime() + DEFAULT_CLOSING_DAYS * 24 * 60 * 60 * 1000),
          )}
        />
      </section>

      <PollSection
        title="진행 중"
        polls={open}
        now={now}
        empty="진행 중인 Poll이 없습니다. 첫 Poll을 만들어 보세요."
      />
      <PollSection title="마감됨" polls={closed} now={now} empty="아직 마감된 Poll이 없습니다." />
    </main>
  );
}

function PollSection({
  title,
  polls,
  now,
  empty,
}: {
  title: string;
  polls: PollSummary[];
  now: Date;
  empty: string;
}) {
  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {title}
        <span className="rounded-full bg-line px-2 py-0.5 text-xs font-medium text-muted tabular-nums">
          {polls.length}
        </span>
      </h2>
      {polls.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line px-4 py-8 text-center text-muted">
          {empty}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {polls.map((poll) => (
            <li key={poll.id}>
              <Link
                href={`/polls/${poll.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium break-words">{poll.question}</span>
                  <ClosingBadge poll={poll} now={now} />
                </span>
                <span
                  aria-hidden
                  className="text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
