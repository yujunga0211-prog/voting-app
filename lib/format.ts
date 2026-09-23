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
