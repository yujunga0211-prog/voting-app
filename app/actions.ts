"use server";

import { redirect } from "next/navigation";
import { appPolls } from "@/lib/polls";

export async function createPollAction(formData: FormData) {
  const result = await appPolls().createPoll({
    question: String(formData.get("question") ?? ""),
    options: formData.getAll("option").map(String),
  });
  // 검증 오류 표시는 #3에서 useActionState로 폼에 돌려준다.
  if (!result.ok) throw new Error("Invalid Poll");
  redirect(`/polls/${result.pollId}`);
}
