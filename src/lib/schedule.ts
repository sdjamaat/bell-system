export type Period = {
  id: string;
  name: string;
  start: string; // HH:MM 24h
  end: string; // HH:MM 24h
};

export type Schedule = Period[];

export function timeStringToMinutes(time: string): number {
  const [hh, mm] = time.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
  return hh * 60 + mm;
}

export function minutesToTimeString(totalMinutes: number): string {
  const minutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mm = (minutes % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function minutesToTimeString12h(totalMinutes: number): string {
  const minutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours24 = Math.floor(minutes / 60);
  const mm = (minutes % 60).toString().padStart(2, "0");
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = ((hours24 + 11) % 12) + 1; // 0 -> 12
  return `${hours12}:${mm} ${period}`;
}

export function getNowMinutes(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function sortSchedule(schedule: Schedule): Schedule {
  return [...schedule].sort(
    (a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start)
  );
}

export function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value) && timeStringToMinutes(value) >= 0;
}

export function normalizeSchedule(schedule: Schedule): Schedule {
  const filtered = schedule.filter(
    (p) => isValidTime(p.start) && isValidTime(p.end) && p.name.trim().length > 0
  );
  return sortSchedule(filtered);
}

export function getCurrentPeriod(
  schedule: Schedule,
  nowMinutes: number
): Period | null {
  for (const period of schedule) {
    const start = timeStringToMinutes(period.start);
    const end = timeStringToMinutes(period.end);
    if (nowMinutes >= start && nowMinutes < end) return period;
  }
  return null;
}

export function getNextBellDate(
  schedule: Schedule,
  now: Date = new Date()
): Date | null {
  if (!schedule.length) return null;
  const today = new Date(now);
  const todayMinutes = getNowMinutes(today);
  const endsToday = schedule
    .map((p) => timeStringToMinutes(p.end))
    .filter((m) => m > todayMinutes)
    .sort((a, b) => a - b);

  if (endsToday.length > 0) {
    const minutes = endsToday[0];
    const result = new Date(today);
    result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return result;
  }

  // No more bells today; pick the first end time tomorrow
  const firstEnd = schedule
    .map((p) => timeStringToMinutes(p.end))
    .sort((a, b) => a - b)[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(Math.floor(firstEnd / 60), firstEnd % 60, 0, 0);
  return tomorrow;
}

export function getTimeRemaining(target: Date, now: Date = new Date()) {
  const diffMs = target.getTime() - now.getTime();
  const clamped = Math.max(diffMs, 0);
  const totalSeconds = Math.floor(clamped / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { diffMs, days, hours, minutes, seconds };
}

export function formatHMS(
  hours: number,
  minutes: number,
  seconds: number
): string {
  const hh = hours.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}


