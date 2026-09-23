import Link from "next/link";
import { notFound } from "next/navigation";
import { appPolls, type PollView } from "@/lib/polls";
import { readVoterId } from "@/lib/voter-cookie";
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

      {view.kind === "form" ? (
        <VoteForm pollId={view.poll.id} options={view.options} />
      ) : (
        <Results view={view} />
      )}
    </main>
  );
}

function Results({ view }: { view: Extract<PollView, { kind: "results" }> }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-medium">Results</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {view.options.map((option) => {
          const mine = option.id === view.myOptionId;
          return (
            <li
              key={option.id}
              className={`flex items-center justify-between gap-3 rounded border px-3 py-2 ${
                mine
                  ? "border-foreground font-medium"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              <span className="break-words">
                {option.text}
                {mine && (
                  <span className="ml-2 rounded bg-foreground px-1.5 py-0.5 text-xs text-background">
                    내 선택
                  </span>
                )}
              </span>
              <span className="shrink-0 tabular-nums">{option.votes}표</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-zinc-500">총 {view.totalVotes}표</p>
    </section>
  );
}
