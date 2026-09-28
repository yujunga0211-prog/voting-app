import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { isAdmin } from "@/lib/admin-session";
import { logoutAction } from "./admin/actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "투표",
  description: "질문 하나와 선택지를 올리고 익명으로 투표하는 앱",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-lg bg-accent text-base text-on-accent"
              >
                ✓
              </span>
              투표
            </Link>
            <AdminMenu admin={await isAdmin()} />
          </div>
        </header>
        {children}
        <footer className="mt-auto border-t border-line py-6 text-center text-sm text-muted">
          만든 사람: 유정아
        </footer>
      </body>
    </html>
  );
}

function AdminMenu({ admin }: { admin: boolean }) {
  if (!admin) {
    return (
      <Link href="/admin/login" className="text-sm text-muted transition hover:text-accent">
        운영자 로그인
      </Link>
    );
  }
  return (
    <form action={logoutAction} className="flex items-center gap-3 text-sm">
      <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-medium text-accent">운영자</span>
      <button type="submit" className="text-muted transition hover:text-accent">
        로그아웃
      </button>
    </form>
  );
}
