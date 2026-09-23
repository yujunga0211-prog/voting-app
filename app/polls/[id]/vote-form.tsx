"use client";

import { useActionState } from "react";
import type { Option } from "@/lib/polls";
import { voteAction } from "./actions";

export function VoteForm({ pollId, options }: { pollId: string; options: Option[] }) {
  const [state, formAction, pending] = useActionState(voteAction.bind(null, pollId), null);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-center gap-3 rounded border border-zinc-300 px-3 py-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <input type="radio" name="optionId" value={option.id} required />
          <span className="break-words">{option.text}</span>
        </label>
      ))}
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "투표하는 중…" : "투표"}
      </button>
    </form>
  );
}
