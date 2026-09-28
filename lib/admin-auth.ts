import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Admin 인증의 순수 로직(ADR-0006). 쿠키 입출력은 admin-session.ts가 맡는다.
// 세션 토큰은 "만료시각(ms).서명"이고, 서명 키는 Admin 비밀번호(ADMIN_TOKEN) 자체다.
// 그래서 비밀번호를 바꾸면 기존 세션이 모두 무효가 되고, 별도 SESSION_SECRET이 필요 없다.

function sameBytes(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

// 길이가 달라도 비교 시간이 같도록 해시를 비교한다. 비밀번호가 설정되지 않았으면 항상 거부한다.
export function checkAdminPassword(input: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return sameBytes(digest(input), digest(expected));
}

function signature(secret: string, expiresAtMs: number): string {
  return createHmac("sha256", secret).update(`admin:${expiresAtMs}`).digest("base64url");
}

export function signAdminSession(secret: string, expiresAtMs: number): string {
  return `${expiresAtMs}.${signature(secret, expiresAtMs)}`;
}

export function verifyAdminSession(
  secret: string | undefined,
  token: string | undefined,
  nowMs: number,
): boolean {
  if (!secret || !token) return false;
  const match = /^(\d+)\.([\w-]+)$/.exec(token);
  if (!match) return false;
  const expiresAtMs = Number(match[1]);
  if (!sameBytes(Buffer.from(match[2]), Buffer.from(signature(secret, expiresAtMs)))) return false;
  return nowMs < expiresAtMs;
}
