import Link from "next/link";
import { notFound } from "next/navigation";
import { appPolls, type PollView } from "@/lib/polls";
import { formatSeoulDateTime } from "@/lib/format";
import { readVoterId } from "@/lib/voter-cookie";
import { ResultsChart } from "./results-chart";
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
      <ClosingInfo closesAt={view.poll.closesAt} isClosed={view.poll.isClosed} />

      {view.kind === "form" ? (
        <VoteForm pollId={view.poll.id} options={view.options} />
      ) : (
        <Results view={view} />
      )}
    </main>
  );
}

function ClosingInfo({ closesAt, isClosed }: { closesAt: Date | null; isClosed: boolean }) {
  if (isClosed) {
    return (
      <p className="mt-3 rounded bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900">
        마감된 Poll입니다. ({formatSeoulDateTime(closesAt!)} 마감)
      </p>
    );
  }
  return (
    <p className="mt-2 text-sm text-zinc-500">
      {closesAt ? `${formatSeoulDateTime(closesAt)} 마감 (한국 시간)` : "마감 없음"}
    </p>
  );
}

function Results({ view }: { view: Extract<PollView, { kind: "results" }> }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-medium">Results</h2>
      <ResultsChart
        options={view.options}
        totalVotes={view.totalVotes}
        myOptionId={view.myOptionId}
      />
    </section>
  );
}
