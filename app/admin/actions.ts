"use server";

import { redirect } from "next/navigation";
import { endAdminSession, startAdminSession } from "@/lib/admin-session";

export type LoginFormState = { error: string } | null;

export async function loginAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const ok = await startAdminSession(String(formData.get("password") ?? ""));
  if (!ok) return { error: "비밀번호가 올바르지 않습니다." };
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await endAdminSession();
  redirect("/");
}
