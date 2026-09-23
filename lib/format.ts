const seoulParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// 생성 시각은 한국 시간 기준 절대 시각으로 보여준다: "2026-09-23 14:05".
export function formatSeoulDateTime(date: Date): string {
  const p = Object.fromEntries(seoulParts.formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
