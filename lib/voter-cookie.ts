import { cookies } from "next/headers";

// Voter는 voter_id 쿠키로 식별되는 익명 브라우저다(ADR-0001).
const VOTER_COOKIE = "voter_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// 페이지 렌더링용: 읽기만 한다.
export async function readVoterId(): Promise<string | null> {
  return (await cookies()).get(VOTER_COOKIE)?.value ?? null;
}

// 투표 Server Action 전용: 없으면 발급한다. 응답 전에는 요청 쿠키에 새 값이 없으므로 반환값을 그대로 쓴다.
export async function getOrIssueVoterId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VOTER_COOKIE)?.value;
  if (existing) return existing;

  const voterId = crypto.randomUUID();
  store.set(VOTER_COOKIE, voterId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return voterId;
}
