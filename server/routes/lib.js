import { db } from '../db/index.js';
import { nextActivity } from '../services/schedule.js';

export const parseJson = (s, d) => { try { return JSON.parse(s); } catch { return d; } };

export function mealOut(m) {
  const foods = parseJson(m.detected_foods, []);
  return {
    id: m.id, studentId: m.student_id, mealType: m.meal_type, source: m.source, estimateMode: m.estimate_mode,
    hasImage: !!m.image_key, createdAt: m.created_at, foods,
    nutrition: { carbs: m.carbs, protein: m.protein, fat: m.fat, fiber: m.fiber },
    status: m.status, reason: { en: m.reason_en, ar: m.reason_ar }, suggestions: parseJson(m.suggestions, []),
  };
}
export const notificationOut = (n) => ({
  id: n.id, studentId: n.student_id, studentName: n.student_name, mealId: n.meal_id, kind: n.kind, severity: n.severity,
  title: { en: n.title_en, ar: n.title_ar }, body: { en: n.body_en, ar: n.body_ar },
  suggestion: n.suggestion_en ? { en: n.suggestion_en, ar: n.suggestion_ar } : null,
  isRead: !!n.is_read, createdAt: n.created_at,
});
export const scheduleOut = (e) => ({ id: e.id, day: e.day_of_week, start: e.start_time, end: e.end_time, subject: e.subject, classroom: e.classroom, type: e.activity_type });
export const examOut = (e) => ({ id: e.id, subject: e.subject, date: e.exam_date, time: e.exam_time, type: e.exam_type });
export const glucoseOut = (g) => ({ id: g.id, value: g.value_mgdl, context: g.context, recordedAt: g.recorded_at });

export async function studentSummary(s) {
  const [glucose, meal, events] = await Promise.all([
    db.prepare('SELECT * FROM glucose_readings WHERE student_id=? ORDER BY recorded_at DESC LIMIT 1').get(s.id),
    db.prepare('SELECT * FROM meals WHERE student_id=? ORDER BY created_at DESC LIMIT 1').get(s.id),
    db.prepare('SELECT * FROM schedule_events WHERE student_id=?').all(s.id),
  ]);
  const nxt = nextActivity(events);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  let status = 'none';
  if (meal && meal.created_at >= weekAgo) status = meal.status === 'GREEN' ? 'ok' : meal.status === 'YELLOW' ? 'review' : 'attention';
  return {
    id: s.id, code: s.student_code, name: s.full_name, grade: s.grade, diabetesType: s.diabetes_type,
    latestGlucose: glucose ? glucoseOut(glucose) : null,
    lastMeal: meal ? { id: meal.id, status: meal.status, createdAt: meal.created_at } : null,
    nextActivity: nxt ? { subject: nxt.event.subject, type: nxt.event.activity_type, start: nxt.event.start_time, dayOffset: nxt.dayOffset, date: nxt.date } : null,
    status,
  };
}
export const clean = (v, max = 500) => (v == null ? null : String(v).trim().slice(0, max) || null);
