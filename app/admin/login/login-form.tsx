"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { inputClass, primaryButtonClass } from "../../ui";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">비밀번호</span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={state?.error ? true : undefined}
          className={inputClass}
        />
      </label>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "확인하는 중…" : "로그인"}
      </button>
    </form>
  );
}
