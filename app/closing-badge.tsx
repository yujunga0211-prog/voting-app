import { formatClosingLabel } from "@/lib/format";

// 마감 표시 배지. 오늘 마감이면 주황, 진행 중이면 초록, 마감 없음·마감됨은 회색.
export function ClosingBadge({
  poll,
  now,
}: {
  poll: { closesAt: Date | null; isClosed: boolean };
  now: Date;
}) {
  const label = formatClosingLabel(poll, now);
  const tone =
    poll.isClosed || poll.closesAt === null
      ? "bg-line text-muted"
      : label.startsWith("오늘")
        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300";
  return (
    <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}
