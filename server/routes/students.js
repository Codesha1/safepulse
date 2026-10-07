import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db, nowIso } from '../db/index.js';
import { requireAuth, requireRole, loadStudent, wrap } from '../middleware/auth.js';
import { buildWelcomeEmail, sendEmail, emailConfigured } from '../services/email.js';
import { analyzePatterns, generateWellnessPlan } from '../services/ai/index.js';
import { ymd } from '../services/schedule.js';
import { clean, mealOut, notificationOut, scheduleOut, examOut, glucoseOut, studentSummary, parseJson } from './lib.js';

const r = Router();
const nurse = requireRole('NURSE');
const TYPES = ['class', 'pe', 'break', 'lunch', 'exam', 'event', 'other'];
const CONTEXTS = ['fasting', 'before_meal', 'after_meal', 'before_pe', 'after_pe', 'exam_day', 'other'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const bad = (res, field) => res.status(400).json({ error: 'VALIDATION', field });

const tempPassword = () => {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alike characters
  return 'SP-' + Array.from({ length: 6 }, () => A[crypto.randomInt(A.length)]).join('');
};

function validEvent(e) {
  return e && Number.isInteger(e.day) && e.day >= 0 && e.day <= 6 && TIME.test(e.start || '') && (!e.end || TIME.test(e.end)) &&
    clean(e.subject, 80) && TYPES.includes(e.type);
}
function validExam(e) { return e && clean(e.subject, 80) && DATE.test(e.date || '') && TIME.test(e.time || ''); }

// ── Registration (nurse) ─────────────────────────────────────────────────────
r.post('/', requireAuth, nurse, wrap(async (req, res) => {
  const b = req.body || {};
  const s = b.student || {}, p = b.parent || {}, m = b.medical || {};
  if (!clean(s.name, 100)) return bad(res, 'student.name');
  if (!clean(s.code, 40)) return bad(res, 'student.code');
  if (!clean(s.grade, 40)) return bad(res, 'student.grade');
  if (s.diagnosisDate && !DATE.test(s.diagnosisDate)) return bad(res, 'student.diagnosisDate');
  if (!clean(p.name, 100)) return bad(res, 'parent.name');
  const email = clean(p.email, 200)?.toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad(res, 'parent.email');
  const schedule = Array.isArray(b.schedule) ? b.schedule.slice(0, 80) : [];
  const exams = Array.isArray(b.exams) ? b.exams.slice(0, 30) : [];
  if (schedule.some((e) => !validEvent(e))) return bad(res, 'schedule');
  if (exams.some((e) => !validExam(e))) return bad(res, 'exams');
  if (db.prepare('SELECT 1 FROM students WHERE student_code=?').get(clean(s.code, 40))) return res.status(409).json({ error: 'STUDENT_CODE_EXISTS' });
  const existing = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (existing && existing.role !== 'PARENT') return res.status(409).json({ error: 'EMAIL_IN_USE' });

  let temp = null; let parentUserId; let parentId; let newAccount = false;
  const tx = db.transaction(() => {
    if (existing) {
      parentUserId = existing.id;
      parentId = db.prepare('SELECT id FROM parents WHERE user_id=?').get(existing.id).id; // sibling → reuse the account
    } else {
      temp = tempPassword(); newAccount = true;
      parentUserId = db.prepare('INSERT INTO users (email,password_hash,role,full_name,must_change_password) VALUES (?,?,?,?,1)')
        .run(email, bcrypt.hashSync(temp, 10), 'PARENT', clean(p.name, 100)).lastInsertRowid;
      parentId = db.prepare('INSERT INTO parents (user_id,relationship,phone,preferred_contact,emergency_contact) VALUES (?,?,?,?,?)')
        .run(parentUserId, clean(p.relationship, 40), clean(p.phone, 40), clean(p.preferredContact, 20), clean(p.emergencyContact, 200)).lastInsertRowid;
    }
    const sid = db.prepare('INSERT INTO students (student_code,full_name,grade,diabetes_type,diagnosis_date,parent_id,created_by) VALUES (?,?,?,?,?,?,?)')
      .run(clean(s.code, 40), clean(s.name, 100), clean(s.grade, 40), clean(s.diabetesType, 60), s.diagnosisDate || null, parentId, req.user.id).lastInsertRowid;
    db.prepare(`INSERT INTO medical_information (student_id,allergies,conditions,hypo_history,hyper_history,medication_info,food_restrictions,activity_considerations,emergency_instructions,physician_contact,care_plan_notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(sid, clean(m.allergies, 1000), clean(m.conditions, 1000), clean(m.hypoHistory, 1000), clean(m.hyperHistory, 1000),
      clean(m.medicationInfo, 1000), clean(m.foodRestrictions, 1000), clean(m.activityConsiderations, 1000), clean(m.emergencyInstructions, 1500), clean(m.physicianContact, 300), clean(m.carePlanNotes, 2000));
    const insEv = db.prepare('INSERT INTO schedule_events (student_id,day_of_week,start_time,end_time,subject,classroom,activity_type) VALUES (?,?,?,?,?,?,?)');
    schedule.forEach((e) => insEv.run(sid, e.day, e.start, e.end || null, clean(e.subject, 80), clean(e.classroom, 60), e.type));
    const insEx = db.prepare('INSERT INTO exams (student_id,subject,exam_date,exam_time,exam_type) VALUES (?,?,?,?,?)');
    exams.forEach((e) => insEx.run(sid, clean(e.subject, 80), e.date, e.time, clean(e.type, 40)));
    db.prepare(`INSERT INTO notifications (user_id,student_id,kind,severity,title_en,title_ar,body_en,body_ar,suggestion_en,suggestion_ar,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(parentUserId, sid, 'welcome', 'info', 'Welcome to SafePulse', 'مرحبًا بك في SafePulse',
      `${clean(s.name, 100)} has been registered with the school nurse. You will see meal reviews, schedule and exam updates here.`,
      `تم تسجيل ${clean(s.name, 100)} لدى ممرضة المدرسة. ستظهر هنا مراجعات الوجبات وتحديثات الجدول والاختبارات.`, null, null, nowIso());
    return sid;
  });
  const studentId = tx();

  let email_result;
  if (newAccount) {
    const mail = buildWelcomeEmail({ parentName: clean(p.name, 100), studentName: clean(s.name, 100), email, tempPassword: temp });
    const sent = await sendEmail(mail);
    email_result = { sent: sent.sent, configured: emailConfigured(), reason: sent.reason || null, preview: sent.sent ? null : { subject: mail.subject, html: mail.html } };
  }
  res.status(201).json({
    studentId, parentEmail: email, newAccount,
    // The temporary password is shown ONCE to the nurse and stored only as a bcrypt hash.
    tempPassword: temp, email: email_result || null,
  });
}));

// ── List / detail ────────────────────────────────────────────────────────────
r.get('/', requireAuth, nurse, (_req, res) => {
  const rows = db.prepare('SELECT * FROM students ORDER BY full_name').all();
  res.json({ students: rows.map(studentSummary) });
});

r.get('/:id', requireAuth, loadStudent, (req, res) => {
  const s = req.student;
  const par = db.prepare('SELECT p.*, u.full_name, u.email FROM parents p JOIN users u ON u.id=p.user_id WHERE p.id=?').get(s.parent_id);
  const out = {
    ...studentSummary(s), diagnosisDate: s.diagnosis_date, createdAt: s.created_at,
    parent: par ? { name: par.full_name, email: par.email, relationship: par.relationship, phone: par.phone, preferredContact: par.preferred_contact, emergencyContact: par.emergency_contact } : null,
  };
  if (req.user.role === 'NURSE') {
    const m = db.prepare('SELECT * FROM medical_information WHERE student_id=?').get(s.id) || {};
    out.medical = {
      allergies: m.allergies, conditions: m.conditions, hypoHistory: m.hypo_history, hyperHistory: m.hyper_history, medicationInfo: m.medication_info,
      foodRestrictions: m.food_restrictions, activityConsiderations: m.activity_considerations, emergencyInstructions: m.emergency_instructions,
      physicianContact: m.physician_contact, carePlanNotes: m.care_plan_notes,
    };
  } else {
    delete out.parent; // parents see their own details elsewhere; medical notes stay with the nurse
  }
  res.json({ student: out });
});

// ── Sub-resources (nurse: any student · parent: own child only) ──────────────
r.get('/:id/meals', requireAuth, loadStudent, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  res.json({ meals: db.prepare('SELECT * FROM meals WHERE student_id=? ORDER BY created_at DESC LIMIT ?').all(req.student.id, limit).map(mealOut) });
});

r.get('/:id/glucose', requireAuth, loadStudent, (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 120);
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const readings = db.prepare('SELECT * FROM glucose_readings WHERE student_id=? AND recorded_at>=? ORDER BY recorded_at').all(req.student.id, since).map(glucoseOut);
  const exams = db.prepare('SELECT * FROM exams WHERE student_id=? ORDER BY exam_date').all(req.student.id).map(examOut);
  const peDays = [...new Set(db.prepare("SELECT day_of_week FROM schedule_events WHERE student_id=? AND activity_type='pe'").all(req.student.id).map((x) => x.day_of_week))];
  res.json({ readings, exams, peDays });
});

r.post('/:id/glucose', requireAuth, nurse, loadStudent, (req, res) => {
  const v = Number(req.body?.value);
  if (!Number.isInteger(v) || v < 20 || v > 600) return bad(res, 'value');
  const ctx = CONTEXTS.includes(req.body?.context) ? req.body.context : 'other';
  const at = req.body?.recordedAt ? new Date(req.body.recordedAt) : new Date();
  if (isNaN(at) || at.getTime() > Date.now() + 5 * 60e3) return bad(res, 'recordedAt');
  const id = db.prepare('INSERT INTO glucose_readings (student_id,value_mgdl,context,recorded_at,recorded_by) VALUES (?,?,?,?,?)').run(req.student.id, v, ctx, at.toISOString(), req.user.id).lastInsertRowid;
  res.status(201).json({ reading: glucoseOut(db.prepare('SELECT * FROM glucose_readings WHERE id=?').get(id)) });
});

r.get('/:id/schedule', requireAuth, loadStudent, (req, res) => {
  res.json({ events: db.prepare('SELECT * FROM schedule_events WHERE student_id=? ORDER BY day_of_week,start_time').all(req.student.id).map(scheduleOut) });
});
r.post('/:id/schedule', requireAuth, nurse, loadStudent, (req, res) => {
  const e = req.body || {};
  if (!validEvent(e)) return bad(res, 'event');
  const id = db.prepare('INSERT INTO schedule_events (student_id,day_of_week,start_time,end_time,subject,classroom,activity_type) VALUES (?,?,?,?,?,?,?)')
    .run(req.student.id, e.day, e.start, e.end || null, clean(e.subject, 80), clean(e.classroom, 60), e.type).lastInsertRowid;
  res.status(201).json({ event: scheduleOut(db.prepare('SELECT * FROM schedule_events WHERE id=?').get(id)) });
});
r.delete('/:id/schedule/:eid', requireAuth, nurse, loadStudent, (req, res) => {
  db.prepare('DELETE FROM schedule_events WHERE id=? AND student_id=?').run(Number(req.params.eid), req.student.id);
  res.json({ ok: true });
});

r.get('/:id/exams', requireAuth, loadStudent, (req, res) => {
  res.json({ exams: db.prepare('SELECT * FROM exams WHERE student_id=? ORDER BY exam_date,exam_time').all(req.student.id).map(examOut) });
});
r.post('/:id/exams', requireAuth, nurse, loadStudent, (req, res) => {
  const e = req.body || {};
  if (!validExam(e)) return bad(res, 'exam');
  const id = db.prepare('INSERT INTO exams (student_id,subject,exam_date,exam_time,exam_type) VALUES (?,?,?,?,?)').run(req.student.id, clean(e.subject, 80), e.date, e.time, clean(e.type, 40)).lastInsertRowid;
  const par = db.prepare('SELECT p.user_id FROM parents p WHERE p.id=?').get(req.student.parent_id);
  if (par && e.date >= ymd(new Date())) {
    db.prepare(`INSERT INTO notifications (user_id,student_id,kind,severity,title_en,title_ar,body_en,body_ar,suggestion_en,suggestion_ar,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(par.user_id, req.student.id, 'exam', 'info', 'Upcoming exam', 'اختبار قادم',
        `${clean(e.subject, 80)} exam on ${e.date} at ${e.time}.`, `اختبار ${clean(e.subject, 80)} بتاريخ ${e.date} الساعة ${e.time}.`,
        'Exam days can be busy — share any routine questions with the school nurse in advance.', 'قد تكون أيام الاختبارات مزدحمة — شاركي ممرضة المدرسة أي استفسار عن الروتين مسبقًا.', nowIso());
  }
  res.status(201).json({ exam: examOut(db.prepare('SELECT * FROM exams WHERE id=?').get(id)) });
});
r.delete('/:id/exams/:eid', requireAuth, nurse, loadStudent, (req, res) => {
  db.prepare('DELETE FROM exams WHERE id=? AND student_id=?').run(Number(req.params.eid), req.student.id);
  res.json({ ok: true });
});

r.get('/:id/notifications', requireAuth, loadStudent, (req, res) => {
  // Notifications addressed to this student's parent account(s).
  const rows = db.prepare(`SELECT n.*, s.full_name AS student_name FROM notifications n JOIN students s ON s.id=n.student_id
    JOIN parents p ON p.id=s.parent_id AND p.user_id=n.user_id WHERE n.student_id=? ORDER BY n.created_at DESC LIMIT 50`).all(req.student.id);
  res.json({ notifications: rows.map(notificationOut) });
});

r.get('/:id/patterns', requireAuth, loadStudent, (req, res) => {
  const id = req.student.id;
  const since = new Date(Date.now() - 120 * 864e5).toISOString();
  const result = analyzePatterns({
    glucose: db.prepare('SELECT * FROM glucose_readings WHERE student_id=? AND recorded_at>=? ORDER BY recorded_at').all(id, since),
    exams: db.prepare('SELECT * FROM exams WHERE student_id=?').all(id),
    schedule: db.prepare('SELECT * FROM schedule_events WHERE student_id=?').all(id),
    meals: db.prepare('SELECT * FROM meals WHERE student_id=? AND created_at>=?').all(id, since),
  });
  res.json(result);
});

r.get('/:id/wellness', requireAuth, loadStudent, (req, res) => {
  const id = req.student.id;
  const meals = db.prepare('SELECT * FROM meals WHERE student_id=? ORDER BY created_at DESC LIMIT 10').all(id)
    .map((m) => ({ flags: { sugaryDrink: parseJson(m.detected_foods, []).some((f) => f.sugary && f.drink) } }));
  const today = ymd(new Date()); const soon = ymd(new Date(Date.now() + 7 * 864e5));
  const hasExamSoon = !!db.prepare('SELECT 1 FROM exams WHERE student_id=? AND exam_date BETWEEN ? AND ?').get(id, today, soon);
  const hasPE = !!db.prepare("SELECT 1 FROM schedule_events WHERE student_id=? AND activity_type='pe'").get(id);
  const { plan, footer } = generateWellnessPlan({ recentMeals: meals, hasExamSoon, hasPE });
  const now = nowIso();
  const up = db.prepare('INSERT INTO wellness_plans (student_id,category,items,generated_at) VALUES (?,?,?,?) ON CONFLICT(student_id,category) DO UPDATE SET items=excluded.items, generated_at=excluded.generated_at');
  db.transaction(() => Object.entries(plan).forEach(([k, items]) => up.run(id, k, JSON.stringify(items), now)))();
  res.json({ plan, footer, generatedAt: now });
});

export default r;
