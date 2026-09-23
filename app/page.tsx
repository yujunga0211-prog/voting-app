import Link from "next/link";
import { connection } from "next/server";
import { appPolls } from "@/lib/polls";
import { formatSeoulDateTime } from "@/lib/format";
import { CreatePollForm } from "./create-poll-form";

export default async function Home() {
  // 새 Poll이 바로 보이도록 요청마다 렌더링한다.
  await connection();
  const polls = await appPolls().listRecentPolls();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">투표</h1>

      <section className="mt-8">
        <h2 className="text-lg font-medium">새 Poll 만들기</h2>
        <CreatePollForm />
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">최근 Poll</h2>
        {polls.length === 0 ? (
          <p className="mt-4 text-zinc-500">아직 Poll이 없습니다. 첫 Poll을 만들어 보세요.</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {polls.map((poll) => (
              <li key={poll.id}>
                <Link href={`/polls/${poll.id}`} className="block py-3 hover:underline">
                  <span className="block break-words">{poll.question}</span>
                  <time
                    dateTime={poll.createdAt.toISOString()}
                    className="text-sm text-zinc-500"
                  >
                    {formatSeoulDateTime(poll.createdAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
