"use server";

import { redirect } from "next/navigation";
import { appPolls, type CreatePollErrors } from "@/lib/polls";

export type CreatePollFormState = { errors: CreatePollErrors } | null;

export async function createPollAction(
  _prev: CreatePollFormState,
  formData: FormData,
): Promise<CreatePollFormState> {
  const result = await appPolls().createPoll({
    question: String(formData.get("question") ?? ""),
    options: formData.getAll("option").map(String),
  });
  if (!result.ok) return { errors: result.errors };
  redirect(`/polls/${result.pollId}`);
}
