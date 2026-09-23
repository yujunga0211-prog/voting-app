import Link from "next/link";
import { notFound } from "next/navigation";
import { appPolls } from "@/lib/polls";

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  const { id } = await params;
  // voter_id 쿠키와 Results는 #5에서 붙인다. 지금은 모든 방문자에게 투표 폼을 보여준다.
  const view = await appPolls().getPollView(id, null);
  if (!view) notFound();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 홈
      </Link>
      <h1 className="mt-4 text-2xl font-semibold break-words">{view.poll.question}</h1>

      <form className="mt-6 flex flex-col gap-3">
        {view.options.map((option) => (
          <label
            key={option.id}
            className="flex items-center gap-3 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
          >
            <input type="radio" name="optionId" value={option.id} required />
            <span className="break-words">{option.text}</span>
          </label>
        ))}
        <button
          type="submit"
          disabled
          className="self-start rounded bg-foreground px-4 py-2 font-medium text-background opacity-50"
        >
          투표 (준비 중)
        </button>
      </form>
    </main>
  );
}
