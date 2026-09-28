import { cookies } from "next/headers";
import { checkAdminPassword, signAdminSession, verifyAdminSession } from "@/lib/admin-auth";

// Admin은 ADMIN_TOKEN 비밀번호 하나를 모두가 함께 쓰는 운영자다(ADR-0006).
// 화면에서 버튼을 숨기는 것과 별개로, Admin 기능 Server Action은 모두 isAdmin()을 다시 확인한다.
const ADMIN_COOKIE = "admin_session";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const adminPassword = () => process.env.ADMIN_TOKEN;

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminSession(adminPassword(), token, Date.now());
}

// 비밀번호가 맞으면 1일짜리 세션 쿠키를 발급한다.
export async function startAdminSession(password: string): Promise<boolean> {
  const secret = adminPassword();
  if (!secret || !checkAdminPassword(password, secret)) return false;
  const expiresAt = Date.now() + ONE_DAY_MS;
  (await cookies()).set(ADMIN_COOKIE, signAdminSession(secret, expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return true;
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}
