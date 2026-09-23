import { createPollAction } from "./actions";

const OPTION_INPUTS = 2;

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">투표</h1>

      <section className="mt-8">
        <h2 className="text-lg font-medium">새 Poll 만들기</h2>
        <form action={createPollAction} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">질문</span>
            <input
              name="question"
              required
              maxLength={200}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">선택지</legend>
            {Array.from({ length: OPTION_INPUTS }, (_, i) => (
              <input
                key={i}
                name="option"
                required
                maxLength={100}
                aria-label={`선택지 ${i + 1}`}
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            ))}
          </fieldset>

          <button
            type="submit"
            className="self-start rounded bg-foreground px-4 py-2 font-medium text-background"
          >
            만들기
          </button>
        </form>
      </section>
    </main>
  );
}
