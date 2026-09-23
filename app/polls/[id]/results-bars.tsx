import type { ResultOption } from "@/lib/polls";

// Results 가로 막대그래프. 라이브러리 없이 div 막대로 그리는 Server Component다.
// 막대 너비 = 총 투표 수 대비 비율(percent). 최다 득표를 100%로 늘리지 않는다.
// 색: "내 선택"만 파란색, 나머지는 중립 회색(validate_palette로 두 모드 구분도·대비 확인).
// "내 선택"은 색 외에 굵은 글씨와 라벨로도 표시해 색만으로 구분하지 않는다.
export function ResultsBars({
  options,
  totalVotes,
  myOptionId,
}: {
  options: ResultOption[];
  totalVotes: number;
  myOptionId: string | null;
}) {
  return (
    <figure className="mt-3">
      <ul className="flex flex-col gap-4">
        {options.map((option) => {
          const mine = option.id === myOptionId;
          return (
            <li key={option.id} title={`${option.text}: ${option.votes}표 (${option.percent}%)`}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={`min-w-0 break-words ${mine ? "font-semibold" : ""}`}>
                  {option.text}
                  {mine && (
                    <span className="ml-2 rounded bg-foreground px-1.5 py-0.5 text-xs font-medium text-background">
                      내 선택
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-400">
                  {option.votes}표 · <span className="text-foreground">{option.percent}%</span>
                </span>
              </div>
              <div
                className="mt-1.5 h-2 w-full rounded-r bg-zinc-100 dark:bg-zinc-800"
                role="presentation"
              >
                <div
                  className={`h-full rounded-r ${
                    mine ? "bg-[#256abf] dark:bg-[#3987e5]" : "bg-[#8a8a86] dark:bg-[#7c7c78]"
                  }`}
                  style={{ width: `${option.percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <figcaption className="mt-4 text-sm text-zinc-500">
        {totalVotes === 0 ? "아직 투표가 없습니다." : `총 ${totalVotes}표`}
      </figcaption>
    </figure>
  );
}
