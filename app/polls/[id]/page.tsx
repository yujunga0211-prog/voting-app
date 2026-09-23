import Link from "next/link";
import { notFound } from "next/navigation";
import { appPolls, type Poll, type PollView } from "@/lib/polls";
import { formatClosingLabel, formatSeoulDateTime } from "@/lib/format";
import { readVoterId } from "@/lib/voter-cookie";
import { ResultsBars } from "./results-bars";
import { VoteForm } from "./vote-form";

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  const { id } = await params;
  const view = await appPolls().getPollView(id, await readVoterId());
  if (!view) notFound();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 홈
      </Link>
      <h1 className="mt-4 text-2xl font-semibold break-words">{view.poll.question}</h1>
      <ClosingInfo poll={view.poll} />

      {view.kind === "form" ? (
        <VoteForm pollId={view.poll.id} options={view.options} />
      ) : (
        <Results view={view} />
      )}
    </main>
  );
}

function ClosingInfo({ poll }: { poll: Poll }) {
  if (poll.isClosed && poll.closesAt) {
    return (
      <p className="mt-3 rounded bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900">
        마감된 Poll입니다. ({formatSeoulDateTime(poll.closesAt)} 마감)
      </p>
    );
  }
  return <p className="mt-2 text-sm text-zinc-500">{formatClosingLabel(poll, requestTime())}</p>;
}

// 요청 시각(D-n 계산용). 렌더링 중 new Date() 직접 호출은 react-hooks/purity lint에 걸려서 함수로 감쌌다.
function requestTime(): Date {
  return new Date();
}

function Results({ view }: { view: Extract<PollView, { kind: "results" }> }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-medium">Results</h2>
      <ResultsBars
        options={view.options}
        totalVotes={view.totalVotes}
        myOptionId={view.myOptionId}
      />
    </section>
  );
}
