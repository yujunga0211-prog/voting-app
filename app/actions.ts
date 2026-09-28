"use server";

import { redirect } from "next/navigation";
import { parseSeoulDateTimeLocal } from "@/lib/format";
import { isAdmin } from "@/lib/admin-session";
import { appPolls, type CreatePollErrors } from "@/lib/polls";

export type CreatePollFormState = { errors: CreatePollErrors } | null;

export async function createPollAction(
  _prev: CreatePollFormState,
  formData: FormData,
): Promise<CreatePollFormState> {
  // Poll은 Admin만 만든다(ADR-0006). 화면에서 폼을 숨겨도 요청은 직접 보낼 수 있으므로 여기서 다시 확인한다.
  if (!(await isAdmin())) redirect("/admin/login");
  const hasClosesAt = formData.get("hasClosesAt") === "on";
  const result = await appPolls().createPoll({
    question: String(formData.get("question") ?? ""),
    options: formData.getAll("option").map(String),
    closesAt: hasClosesAt ? parseSeoulDateTimeLocal(String(formData.get("closesAt") ?? "")) : null,
  });
  if (!result.ok) return { errors: result.errors };
  redirect(`/polls/${result.pollId}`);
}
