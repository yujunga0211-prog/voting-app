// 시각은 모두 한국 시간(Asia/Seoul) 기준으로 보여주고 입력받는다.
const SEOUL_OFFSET = "+09:00";

const seoulParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function toSeoulParts(date: Date) {
  const parts = Object.fromEntries(
    seoulParts.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return parts as Record<"year" | "month" | "day" | "hour" | "minute", string>;
}

// "2026-09-23 14:05"
export function formatSeoulDateTime(date: Date): string {
  const { year, month, day, hour, minute } = toSeoulParts(date);
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// <input type="datetime-local">의 값 형식: "2026-09-23T14:05"
export function toSeoulDateTimeLocal(date: Date): string {
  const { year, month, day, hour, minute } = toSeoulParts(date);
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

// datetime-local 값을 한국 시간으로 해석한다. 형식이 틀리면 Invalid Date를 돌려주고, 검증은 polls 모듈이 한다.
export function parseSeoulDateTimeLocal(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return new Date(NaN);
  return new Date(`${value}:00${SEOUL_OFFSET}`);
}

// 목록의 마감 표시: "마감 없음" / "오늘 18:00 마감" / "D-2 · 9/25 18:00 마감" / "9/25 18:00 마감됨".
// D-n은 한국 날짜 기준 남은 날 수다.
export function formatClosingLabel(closesAt: Date | null, now: Date): string {
  if (closesAt === null) return "마감 없음";
  const c = toSeoulParts(closesAt);
  const time = `${c.hour}:${c.minute}`;
  const monthDay = `${Number(c.month)}/${Number(c.day)}`;
  if (closesAt <= now) return `${monthDay} ${time} 마감됨`;

  const n = toSeoulParts(now);
  const days =
    (Date.UTC(+c.year, +c.month - 1, +c.day) - Date.UTC(+n.year, +n.month - 1, +n.day)) /
    (24 * 60 * 60 * 1000);
  return days === 0 ? `오늘 ${time} 마감` : `D-${days} · ${monthDay} ${time} 마감`;
}
