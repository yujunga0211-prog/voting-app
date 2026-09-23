import Link from "next/link";
import { connection } from "next/server";
import { appPolls, type PollSummary } from "@/lib/polls";
import { formatClosingLabel, toSeoulDateTimeLocal } from "@/lib/format";
import { DEFAULT_CLOSING_DAYS } from "@/lib/poll-limits";
import { CreatePollForm } from "./create-poll-form";

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
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">투표</h1>

      <section className="mt-8">
        <h2 className="text-lg font-medium">새 Poll 만들기</h2>
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
      <h2 className="text-lg font-medium">{title}</h2>
      {polls.length === 0 ? (
        <p className="mt-4 text-zinc-500">{empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {polls.map((poll) => (
            <li key={poll.id}>
              <Link href={`/polls/${poll.id}`} className="block py-3 hover:underline">
                <span className="block break-words">{poll.question}</span>
                <span className="text-sm text-zinc-500">
                  {formatClosingLabel(poll, now)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
