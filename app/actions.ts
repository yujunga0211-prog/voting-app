"use server";

import { redirect } from "next/navigation";
import { parseSeoulDateTimeLocal } from "@/lib/format";
import { appPolls, type CreatePollErrors } from "@/lib/polls";

export type CreatePollFormState = { errors: CreatePollErrors } | null;

export async function createPollAction(
  _prev: CreatePollFormState,
  formData: FormData,
): Promise<CreatePollFormState> {
  const hasClosesAt = formData.get("hasClosesAt") === "on";
  const result = await appPolls().createPoll({
    question: String(formData.get("question") ?? ""),
    options: formData.getAll("option").map(String),
    closesAt: hasClosesAt ? parseSeoulDateTimeLocal(String(formData.get("closesAt") ?? "")) : null,
  });
  if (!result.ok) return { errors: result.errors };
  redirect(`/polls/${result.pollId}`);
}
