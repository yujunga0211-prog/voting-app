"use client";

import { useActionState } from "react";
import type { Option } from "@/lib/polls";
import { voteAction } from "./actions";
import { primaryButtonClass } from "../../ui";

export function VoteForm({ pollId, options }: { pollId: string; options: Option[] }) {
  const [state, formAction, pending] = useActionState(voteAction.bind(null, pollId), null);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3.5 transition hover:border-accent/50 hover:bg-accent-soft/50 has-checked:border-accent has-checked:bg-accent-soft has-checked:ring-4 has-checked:ring-accent/10"
        >
          <input type="radio" name="optionId" value={option.id} required className="size-4 accent-accent" />
          <span className="font-medium break-words">{option.text}</span>
        </label>
      ))}
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className={`${primaryButtonClass} mt-2 w-full`}
      >
        {pending ? "투표하는 중…" : "투표"}
      </button>
    </form>
  );
}
