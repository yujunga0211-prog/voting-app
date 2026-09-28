import Link from "next/link";
import { cardClass } from "../../ui";

export default function PollNotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className={`${cardClass} text-center sm:p-10`}>
        <p aria-hidden className="text-4xl">🔍</p>
        <h1 className="mt-4 text-2xl font-bold">Poll을 찾을 수 없습니다</h1>
        <p className="mt-2 text-muted">링크가 잘못되었거나 존재하지 않는 Poll입니다.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-accent px-5 py-2.5 font-semibold text-on-accent transition hover:brightness-110"
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
