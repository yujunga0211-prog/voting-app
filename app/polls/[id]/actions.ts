"use server";

import { notFound, redirect } from "next/navigation";
import { appPolls } from "@/lib/polls";
import { getOrIssueVoterId } from "@/lib/voter-cookie";

export type VoteFormState = { error: string } | null;

export async function voteAction(
  pollId: string,
  _prev: VoteFormState,
  formData: FormData,
): Promise<VoteFormState> {
  const optionId = String(formData.get("optionId") ?? "");
  if (!optionId) return { error: "선택지를 하나 골라 주세요." };

  const voterId = await getOrIssueVoterId();
  const result = await appPolls().castVote({ pollId, optionId, voterId });

  if (result === "poll_not_found") notFound();
  if (result === "option_not_in_poll") return { error: "이 Poll의 선택지가 아닙니다. 다시 골라 주세요." };
  // "voted", "already_voted", "poll_closed" 모두 같은 Poll 페이지로 보내면 Results가 보인다
  // (Closed Poll은 누구에게나 Results와 "마감된 Poll입니다" 안내가 보인다).
  redirect(`/polls/${pollId}`);
}
