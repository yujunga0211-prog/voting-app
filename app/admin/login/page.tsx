import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";
import { cardClass } from "../../ui";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <Link href="/" className="text-sm text-muted transition hover:text-accent">
        ← 목록으로
      </Link>
      <section className={`${cardClass} mt-4 sm:p-8`}>
        <h1 className="text-2xl font-bold tracking-tight">운영자 로그인</h1>
        <p className="mt-2 text-sm text-muted">Poll 만들기와 삭제는 운영자만 할 수 있어요.</p>
        <LoginForm />
      </section>
    </main>
  );
}
