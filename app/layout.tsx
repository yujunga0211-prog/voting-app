import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-2xl items-center px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-lg bg-accent text-base text-on-accent"
              >
                ✓
              </span>
              투표
            </Link>
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
