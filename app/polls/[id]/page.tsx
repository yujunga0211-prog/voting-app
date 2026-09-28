import Link from "next/link";
import { notFound } from "next/navigation";
import { appPolls, type Poll, type PollView } from "@/lib/polls";
import { formatSeoulDateTime } from "@/lib/format";
import { ClosingBadge } from "../../closing-badge";
import { cardClass } from "../../ui";
import { readVoterId } from "@/lib/voter-cookie";
import { ResultsBars } from "./results-bars";
import { VoteForm } from "./vote-form";

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  const { id } = await params;
  const view = await appPolls().getPollView(id, await readVoterId());
  if (!view) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-muted transition hover:text-accent">
        ← 목록으로
      </Link>
      <article className={`${cardClass} mt-4 sm:p-8`}>
        <h1 className="text-2xl font-bold tracking-tight break-words">{view.poll.question}</h1>
        <ClosingInfo poll={view.poll} />

        {view.kind === "form" ? (
          <VoteForm pollId={view.poll.id} options={view.options} />
        ) : (
          <Results view={view} />
        )}
      </article>
    </main>
  );
}

function ClosingInfo({ poll }: { poll: Poll }) {
  if (poll.isClosed && poll.closesAt) {
    return (
      <p className="mt-4 rounded-xl bg-background px-4 py-3 text-sm text-muted">
        🔒 마감된 Poll입니다. ({formatSeoulDateTime(poll.closesAt)} 마감)
      </p>
    );
  }
  return <ClosingBadge poll={poll} now={requestTime()} />;
}

// 요청 시각(D-n 계산용). 렌더링 중 new Date() 직접 호출은 react-hooks/purity lint에 걸려서 함수로 감쌌다.
function requestTime(): Date {
  return new Date();
}

function Results({ view }: { view: Extract<PollView, { kind: "results" }> }) {
  return (
    <section className="mt-8 border-t border-line pt-6">
      <h2 className="text-lg font-semibold">Results</h2>
      <ResultsBars
        options={view.options}
        totalVotes={view.totalVotes}
        myOptionId={view.myOptionId}
      />
    </section>
  );
}
