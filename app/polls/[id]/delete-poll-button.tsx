"use client";

import { deletePollAction } from "./actions";

// Admin에게만 렌더링된다. 되돌릴 수 없으므로 브라우저 확인 창을 한 번 거친다.
export function DeletePollButton({ pollId }: { pollId: string }) {
  return (
    <form
      action={deletePollAction.bind(null, pollId)}
      onSubmit={(e) => {
        if (!confirm("이 Poll을 삭제할까요? 모든 Vote도 함께 지워지고 되돌릴 수 없습니다.")) e.preventDefault();
      }}
      className="mt-4 flex justify-end"
    >
      <button
        type="submit"
        className="rounded-xl px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
      >
        Poll 삭제
      </button>
    </form>
  );
}
