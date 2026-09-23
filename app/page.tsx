import { CreatePollForm } from "./create-poll-form";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">투표</h1>

      <section className="mt-8">
        <h2 className="text-lg font-medium">새 Poll 만들기</h2>
        <CreatePollForm />
      </section>
    </main>
  );
}
