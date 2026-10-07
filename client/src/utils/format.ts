export const todayYmd = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export const SCHOOL_DAY_INDEXES = [0, 1, 2, 3, 4];
export function glucoseTone(v: number): 'low' | 'ok' | 'high' { return v < 70 ? 'low' : v > 180 ? 'high' : 'ok'; }
export const copyText = async (s: string) => { try { await navigator.clipboard.writeText(s); return true; } catch { return false; } };

/** "13:05" → "1:05 PM" (en) / "1:05 م" (ar) */
export function fmtClock(hhmm: string, lang: 'en' | 'ar'): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? (lang === 'ar' ? 'م' : 'PM') : (lang === 'ar' ? 'ص' : 'AM');
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${suffix}`;
}
export function dateOfNextWeekday(dow: number): string {
  const d = new Date(); const add = (dow - d.getDay() + 7) % 7; d.setDate(d.getDate() + add);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const greetingKey = () => { const h = new Date().getHours(); return h < 12 ? 'greeting.morning' : h < 17 ? 'greeting.afternoon' : 'greeting.evening'; };
