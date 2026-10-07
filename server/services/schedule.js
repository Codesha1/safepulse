// Date / schedule helpers (server timezone = TZ in .env, default Asia/Riyadh). School week: Sun–Thu.
export const SCHOOL_DAYS = [0, 1, 2, 3, 4];
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const isSchoolDay = (d) => SCHOOL_DAYS.includes(d.getDay());
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function schoolDayOffset(from, n) {
  let d = new Date(from); const step = n > 0 ? 1 : -1; let left = Math.abs(n);
  while (left > 0) { d = addDays(d, step); if (isSchoolDay(d)) left--; }
  return d;
}
export function effectiveSchoolDay(now = new Date()) {
  let d = new Date(now); while (!isSchoolDay(d)) d = addDays(d, 1); return d;
}
export function nextActivity(events, now = new Date()) {
  if (!events.length) return null;
  const nowT = hm(now);
  const byDay = (dow) => events.filter((e) => e.day_of_week === dow).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const today = byDay(now.getDay()).find((e) => e.start_time > nowT);
  if (today) return { event: today, dayOffset: 0, date: ymd(now) };
  for (let i = 1; i <= 7; i++) {
    const d = addDays(now, i); const list = byDay(d.getDay());
    if (list.length) return { event: list[0], dayOffset: i, date: ymd(d) };
  }
  return null;
}
export const DEFAULT_TEMPLATE = (dow) => [
  ['07:30', '08:15', 'Mathematics', 'Room 204', 'class'],
  ['08:15', '09:00', 'Science', 'Lab 2', 'class'],
  ['09:00', '09:30', 'Break', 'Courtyard', 'break'],
  dow === 1 || dow === 3 ? ['09:30', '10:30', 'Art', 'Room 110', 'class'] : ['09:30', '10:30', 'PE', 'Gymnasium', 'pe'],
  ['10:30', '11:30', 'English', 'Room 207', 'class'],
  ['11:30', '12:00', 'Lunch', 'Cafeteria', 'lunch'],
  ['12:00', '13:00', 'Social Studies', 'Room 301', 'class'],
];
