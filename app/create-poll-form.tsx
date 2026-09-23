"use client";

import { useActionState, useState } from "react";
import { createPollAction } from "./actions";
import { MAX_OPTIONS, MIN_OPTIONS, OPTION_MAX_LENGTH, QUESTION_MAX_LENGTH } from "@/lib/poll-limits";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

let nextKey = 0;
const newOption = () => ({ key: nextKey++, text: "" });

// 입력칸 추가·제거와 오류 표시만 한다. 모든 검증은 서버(polls 모듈)가 다시 한다.
// 입력값은 controlled state라서 서버가 오류를 돌려줘도 그대로 남는다.
// defaultClosesAt은 서버가 계산해 넘긴다(렌더링 시각이 서버·클라이언트에서 달라 생기는 불일치 방지).
export function CreatePollForm({ defaultClosesAt }: { defaultClosesAt: string }) {
  const [state, formAction, pending] = useActionState(createPollAction, null);
  const [question, setQuestion] = useState("");
  const [hasClosesAt, setHasClosesAt] = useState(true);
  const [closesAt, setClosesAt] = useState(defaultClosesAt);
  const [options, setOptions] = useState(() => Array.from({ length: MIN_OPTIONS }, newOption));
  // 입력칸을 추가·제거하면 위치별 오류가 다른 칸에 붙으므로, 그 제출 결과의 위치별 오류는 숨긴다.
  const [shiftedState, setShiftedState] = useState<typeof state>(null);
  const errors = state?.errors;
  const optionAt = state !== shiftedState ? errors?.optionAt : undefined;

  const setOptionText = (key: number, text: string) =>
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, text } : o)));

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">질문</span>
        <input
          name="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={QUESTION_MAX_LENGTH}
          aria-invalid={errors?.question ? true : undefined}
          className={inputClass}
        />
        {errors?.question && <ErrorText>{errors.question}</ErrorText>}
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">선택지</legend>
        {options.map((option, index) => (
          <div key={option.key} className="flex flex-col gap-1">
            <div className="flex gap-2">
              <input
                name="option"
                value={option.text}
                onChange={(e) => setOptionText(option.key, e.target.value)}
                maxLength={OPTION_MAX_LENGTH}
                aria-label={`선택지 ${index + 1}`}
                aria-invalid={optionAt?.[index] ? true : undefined}
                className={`${inputClass} flex-1`}
              />
              {options.length > MIN_OPTIONS && (
                <button
                  type="button"
                  onClick={() => {
                    setShiftedState(state);
                    setOptions((prev) => prev.filter((o) => o.key !== option.key));
                  }}
                  aria-label={`선택지 ${index + 1} 제거`}
                  className="rounded px-3 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  ✕
                </button>
              )}
            </div>
            {optionAt?.[index] && <ErrorText>{optionAt[index]}</ErrorText>}
          </div>
        ))}
        {errors?.options && <ErrorText>{errors.options}</ErrorText>}
        <button
          type="button"
          onClick={() => {
            setShiftedState(state);
            setOptions((prev) => [...prev, newOption()]);
          }}
          disabled={options.length >= MAX_OPTIONS}
          className="self-start text-sm text-zinc-600 hover:underline disabled:opacity-40 disabled:no-underline dark:text-zinc-400"
        >
          + 선택지 추가 ({options.length}/{MAX_OPTIONS})
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="hasClosesAt"
            checked={hasClosesAt}
            onChange={(e) => setHasClosesAt(e.target.checked)}
          />
          마감 시각 설정
        </label>
        {hasClosesAt ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-500">한국 시간 기준, 30일 이내</span>
            <input
              type="datetime-local"
              name="closesAt"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              aria-label="마감 시각"
              aria-invalid={errors?.closesAt ? true : undefined}
              className={`${inputClass} self-start`}
            />
          </label>
        ) : (
          <p className="text-sm text-zinc-500">마감 없이 계속 열려 있는 Poll이 됩니다.</p>
        )}
        {hasClosesAt && errors?.closesAt && <ErrorText>{errors.closesAt}</ErrorText>}
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "만드는 중…" : "만들기"}
      </button>
    </form>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-red-600 dark:text-red-400">{children}</p>;
}
