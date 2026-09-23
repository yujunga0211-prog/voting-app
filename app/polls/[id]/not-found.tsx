import Link from "next/link";

export default function PollNotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Poll을 찾을 수 없습니다</h1>
      <p className="mt-2 text-zinc-500">링크가 잘못되었거나 존재하지 않는 Poll입니다.</p>
      <Link href="/" className="mt-6 inline-block hover:underline">
        홈으로
      </Link>
    </main>
  );
}
