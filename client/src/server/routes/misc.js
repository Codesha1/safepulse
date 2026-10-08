import { Router } from 'express';
import { db } from '../db/index.js';
import { config } from '../config.js';
import { requireAuth, requireRole, wrap } from '../middleware/auth.js';
import { ymd } from '../services/schedule.js';
import { notificationOut, studentSummary, mealOut, examOut } from './lib.js';
import { resetAndSeed } from '../db/seed.js';

const r = Router();

// ── Notifications (own inbox only) ───────────────────────────────────────────
r.get('/notifications', requireAuth, wrap(async (req, res) => {
  const rows = await db.prepare(`SELECT n.*, s.full_name AS student_name FROM notifications n LEFT JOIN students s ON s.id=n.student_id
    WHERE n.user_id=? ORDER BY n.created_at DESC LIMIT 100`).all(req.user.id);
  res.json({ notifications: rows.map(notificationOut), unread: rows.filter((n) => !n.is_read).length });
}));
r.post('/notifications/read-all', requireAuth, wrap(async (req, res) => {
  await db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=?').run(req.user.id);
  res.json({ ok: true });
}));
r.post('/notifications/:id/read', requireAuth, wrap(async (req, res) => {
  await db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?').run(Number(req.params.id), req.user.id);
  res.json({ ok: true });
}));

// ── Nurse dashboard ──────────────────────────────────────────────────────────
r.get('/dashboard', requireAuth, requireRole('NURSE'), wrap(async (req, res) => {
  const dow = new Date().getDay(); const today = ymd(new Date());
  const [students, activeRow, examRow, unreadRow] = await Promise.all([
    db.prepare('SELECT * FROM students').all(),
    db.prepare(`SELECT COUNT(DISTINCT student_id) c FROM schedule_events WHERE day_of_week=? AND activity_type IN ('pe','exam','event','other')`).get(dow),
    db.prepare('SELECT COUNT(DISTINCT student_id) c FROM exams WHERE exam_date=?').get(today),
    db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND is_read=0').get(req.user.id),
  ]);
  const summaries = await Promise.all(students.map(studentSummary));
  const needsReview = summaries.filter((s) => s.status === 'review' || s.status === 'attention');
  const active = activeRow.c, examsToday = examRow.c, unread = unreadRow.c;
  res.json({
    totalStudents: students.length,
    needsReview: needsReview.length,
    todaysActivities: active + examsToday,
    notifications: unread,
    needsReviewList: needsReview.slice(0, 6).map((s) => ({ id: s.id, name: s.name, grade: s.grade, status: s.status })),
  });
}));

// ── Parent home ──────────────────────────────────────────────────────────────
r.get('/parent/home', requireAuth, requireRole('PARENT'), wrap(async (req, res) => {
  const p = await db.prepare('SELECT id FROM parents WHERE user_id=?').get(req.user.id);
  const kids = p ? await db.prepare('SELECT * FROM students WHERE parent_id=? ORDER BY full_name').all(p.id) : [];
  const today = ymd(new Date());
  const notesP = db.prepare(`SELECT n.*, s.full_name AS student_name FROM notifications n LEFT JOIN students s ON s.id=n.student_id
    WHERE n.user_id=? ORDER BY n.created_at DESC LIMIT 8`).all(req.user.id);
  const children = await Promise.all(kids.map(async (s) => {
    const [sum, meal, exam] = await Promise.all([
      studentSummary(s),
      db.prepare('SELECT * FROM meals WHERE student_id=? ORDER BY created_at DESC LIMIT 1').get(s.id),
      db.prepare('SELECT * FROM exams WHERE student_id=? AND exam_date>=? ORDER BY exam_date,exam_time LIMIT 1').get(s.id, today),
    ]);
    const days = exam ? Math.round((new Date(exam.exam_date + 'T12:00:00') - new Date(today + 'T12:00:00')) / 864e5) : null;
    return { ...sum, latestMeal: meal ? mealOut(meal) : null, upcomingExam: exam ? { ...examOut(exam), daysUntil: days } : null };
  }));
  const notes = (await notesP).map(notificationOut);
  res.json({ children, notifications: notes });
}));

// ── Demo helpers ─────────────────────────────────────────────────────────────
r.post('/demo/reset', requireAuth, requireRole('NURSE'), wrap(async (req, res) => {
  if (!config.demoMode || !req.user.is_demo) return res.status(403).json({ error: 'FORBIDDEN' });
  try { await resetAndSeed(); } catch (e) { if (e.code === 'REAL_DATA') return res.status(409).json({ error: 'REAL_DATA_PRESENT' }); throw e; }
  res.json({ ok: true });
}));

export default r;
