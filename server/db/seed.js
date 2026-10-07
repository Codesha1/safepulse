// Demo dataset (100% fictional). Run: npm run db:seed   |   npm run db:reset
// Dates are generated relative to "now", so run db:reset shortly before a demo to keep it fresh.
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { db, nowIso } from './index.js';
import { config } from '../config.js';
import { FOODS } from '../services/ai/foods.js';
import { estimateNutrition, generateMealAssessment, generateMealSuggestions, generateNotifications } from '../services/ai/index.js';
import { schoolDayOffset, isSchoolDay, addDays, ymd, SCHOOL_DAYS } from '../services/schedule.js';

export const DEMO_NURSE_EMAIL = 'nurse@safepulse.demo';
export const DEMO_PARENT_EMAIL = 'parent@safepulse.demo';

const NAMES = [
  'Lama Al-Harbi', 'Sara Al-Otaibi', 'Noura Al-Ghamdi', 'Rahaf Al-Zahrani', 'Jood Al-Qahtani', 'Maryam Al-Shehri',
  'Layan Al-Dosari', 'Aseel Al-Mutairi', 'Razan Al-Subaie', 'Dana Al-Harthi', 'Hessa Al-Anazi', 'Joury Al-Malki',
  'Tala Al-Rashid', 'Reema Al-Juhani', 'Ghada Al-Sulami', 'Nada Al-Bishi', 'Abeer Al-Yami', 'Salma Al-Ahmadi',
  'Danah Al-Shamrani', 'Yara Al-Ruwaili', 'Haya Al-Zahrani', 'Lujain Al-Thaqafi', 'Mashael Al-Balawi', 'Sondos Al-Harbi',
];
const PARENT_FIRST = ['Huda', 'Amal', 'Fatimah', 'Mona', 'Khalid', 'Salem', 'Nawal', 'Ibtisam', 'Fahad', 'Wafa', 'Majed', 'Samar',
  'Turki', 'Aisha', 'Badr', 'Sahar', 'Yousef', 'Ahlam', 'Rakan', 'Lubna', 'Hanan', 'Saud', 'Maha', 'Ziyad'];
const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
const DX = ['type1', 'type1', 'type1', 'type1', 'type2', 'type1', 'other'];

const GREEN = [['grilled_chicken', 'rice', 'salad', 'water'], ['boiled_egg', 'whole_bread', 'cucumber', 'water'], ['grilled_chicken', 'salad', 'hummus', 'water'], ['yogurt', 'apple', 'nuts']];
const YELLOW = [['sandwich', 'yogurt', 'apple'], ['grilled_chicken', 'rice', 'salad', 'orange_juice'], ['pasta', 'salad', 'soda']];
const RED = [['pizza', 'orange_juice', 'fruit'], ['burger', 'fries', 'soda', 'cake']];

function rng(seed) { // mulberry32 → deterministic demo data
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const at = (d, t) => { const [h, m] = t.split(':').map(Number); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0); };

function evalMeal(keys) {
  const foods = keys.map((k) => ({ key: k, ...FOODS[k] }));
  const nutrition = estimateNutrition(foods);
  const assessment = generateMealAssessment(foods, nutrition);
  return { foods, nutrition, assessment, suggestions: generateMealSuggestions(assessment, nutrition) };
}

export function resetAndSeed() {
  db.pragma('foreign_keys = OFF');
  ['notifications', 'ai_insights', 'wellness_plans', 'meals', 'glucose_readings', 'schedule_events', 'exams', 'medical_information', 'students', 'parents', 'nurses', 'users']
    .forEach((t) => db.exec(`DELETE FROM ${t}`));
  db.exec("DELETE FROM sqlite_sequence");
  db.pragma('foreign_keys = ON');
  seed();
}
export function seedIfEmpty() {
  if (!db.prepare('SELECT COUNT(*) c FROM users').get().c) { seed(); console.log(`[SafePulse] Demo data created. Demo logins: ${DEMO_NURSE_EMAIL} / ${DEMO_PARENT_EMAIL} (password: see DEMO_PASSWORD in .env, or use the "Demo" buttons).`); }
}

function seed() {
  const now = new Date();
  const demoHash = bcrypt.hashSync(config.demoPassword, 10);
  const lockedHash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 10); // other parents: not loginable
  const U = db.prepare('INSERT INTO users (email,password_hash,role,full_name,must_change_password,is_demo,created_at) VALUES (?,?,?,?,0,?,?)');

  db.transaction(() => {
    const created = addDays(now, -60).toISOString();
    const nurseUid = U.run(DEMO_NURSE_EMAIL, demoHash, 'NURSE', 'Nurse Reem Al-Qahtani', 1, created).lastInsertRowid;
    db.prepare('INSERT INTO nurses (user_id,school_name,phone) VALUES (?,?,?)').run(nurseUid, 'Demo School (fictional)', '+966 5X XXX XXXX');

    const insStudent = db.prepare('INSERT INTO students (student_code,full_name,grade,diabetes_type,diagnosis_date,parent_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?)');
    const insMed = db.prepare(`INSERT INTO medical_information (student_id,allergies,conditions,hypo_history,hyper_history,medication_info,food_restrictions,activity_considerations,emergency_instructions,physician_contact,care_plan_notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    const insEv = db.prepare('INSERT INTO schedule_events (student_id,day_of_week,start_time,end_time,subject,classroom,activity_type) VALUES (?,?,?,?,?,?,?)');
    const insEx = db.prepare('INSERT INTO exams (student_id,subject,exam_date,exam_time,exam_type) VALUES (?,?,?,?,?)');
    const insG = db.prepare('INSERT INTO glucose_readings (student_id,value_mgdl,context,recorded_at,recorded_by) VALUES (?,?,?,?,?)');
    const insMeal = db.prepare(`INSERT INTO meals (student_id,meal_type,source,estimate_mode,detected_foods,carbs,protein,fat,fiber,status,reason_en,reason_ar,suggestions,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insN = db.prepare(`INSERT INTO notifications (user_id,student_id,meal_id,kind,severity,title_en,title_ar,body_en,body_ar,suggestion_en,suggestion_ar,is_read,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insAI = db.prepare('INSERT INTO ai_insights (student_id,meal_id,kind,payload,created_at) VALUES (?,?,?,?,?)');

    const FLAGGED = { 5: YELLOW[0], 11: RED[0], 17: YELLOW[2] }; // exactly 3 students "need review"
    const nurseNotes = [];

    NAMES.forEach((name, i) => {
      const R = rng(1000 + i * 77);
      const isLama = i === 0;
      const email = isLama ? DEMO_PARENT_EMAIL : `parent${String(i).padStart(2, '0')}@safepulse.demo`;
      const parentName = isLama ? 'Mrs. Huda Al-Harbi' : `${PARENT_FIRST[i]} ${name.split(' ')[1]}`;
      const puid = U.run(email, isLama ? demoHash : lockedHash, 'PARENT', parentName, isLama ? 1 : 0, created).lastInsertRowid;
      const pid = db.prepare('INSERT INTO parents (user_id,relationship,phone,preferred_contact,emergency_contact) VALUES (?,?,?,?,?)')
        .run(puid, i % 4 === 1 || i % 4 === 3 ? 'Father' : 'Mother', `+966 5X XXX ${String(1000 + i).slice(-4)}`, 'app', `Family contact: +966 5X XXX ${String(2000 + i).slice(-4)}`).lastInsertRowid;
      const dx = new Date(now.getFullYear() - 1 - (i % 5), (i * 3) % 12, 5 + (i % 20));
      const sid = insStudent.run(`SP-${1001 + i}`, name, `${GRADES[i % 4]}-${'AB'[i % 2]}`, DX[i % DX.length], ymd(dx), pid, nurseUid, created).lastInsertRowid;
      insMed.run(sid, i % 6 === 2 ? 'Peanuts (fictional)' : 'None known', i % 7 === 3 ? 'Mild asthma (fictional)' : 'None reported',
        i % 3 === 0 ? 'Occasional mild episodes during long activity (fictional record).' : 'No recent episodes recorded.',
        i % 4 === 0 ? 'Occasional higher readings around exams (fictional record).' : 'No recent episodes recorded.',
        'As described in the prescribed individual care plan held by the school nurse.', i % 5 === 2 ? 'Avoid peanut products.' : 'Follow the care plan.',
        'Check in with the school nurse before and after PE, as written in the care plan.', 'Follow the emergency steps in the individual care plan and contact the family and clinic.',
        'Dr. Fictional Clinic · +966 1X XXX XXXX', 'Care plan reviewed with the family at the start of the school year (fictional).');

      // Weekly timetable (Sun–Thu). PE: Lama 3 days, others 1 day (spreads PE across the week).
      const peDays = isLama ? [0, 2, 4] : [SCHOOL_DAYS[i % 5]];
      SCHOOL_DAYS.forEach((dow) => {
        const pe = peDays.includes(dow);
        [['07:30', '08:15', 'Mathematics', 'Room 204', 'class'], ['08:15', '09:00', 'Science', 'Lab 2', 'class'], ['09:00', '09:30', 'Break', 'Courtyard', 'break'],
          pe ? ['09:30', '10:30', 'PE', 'Gymnasium', 'pe'] : ['09:30', '10:30', 'Art', 'Room 110', 'class'],
          ['10:30', '11:30', 'English', 'Room 207', 'class'], ['11:30', '12:00', 'Lunch', 'Cafeteria', 'lunch'], ['12:00', '13:00', 'Social Studies', 'Room 301', 'class']]
          .forEach(([s, e, subj, room, type]) => insEv.run(sid, dow, s, e, subj, room, type));
      });

      // Exams: 4 past (feed the pattern analysis) + upcoming
      const pastExamDates = [-3, -10, -17, -24].map((n) => ymd(schoolDayOffset(now, n)));
      ['Mathematics', 'Science', 'English', 'Arabic'].forEach((subj, k) => insEx.run(sid, subj, pastExamDates[k], '12:00', k % 2 ? 'Quiz' : 'Monthly exam'));
      if (isLama || i % 3 === 0) insEx.run(sid, 'Mathematics', ymd(schoolDayOffset(now, 1)), '12:00', 'Monthly exam');
      if (isLama) insEx.run(sid, 'Science', ymd(schoolDayOffset(now, 4)), '11:00', 'Quiz');
      const examSet = new Set(pastExamDates);
      const eveSet = new Set(pastExamDates.map((s) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() - 1); return ymd(d); }));

      // 14 school days of lunches → used for status-linked glucose + the meal history
      const mealByDay = new Map();
      const days = [];
      for (let n = 0; n < 40; n++) { const d = addDays(now, -n); if (isSchoolDay(d)) days.push(d); }
      const lunchDays = days.filter((d) => at(d, '12:05') <= now).slice(0, 14);
      lunchDays.forEach((d, idx) => {
        let keys;
        if (idx === 0 && FLAGGED[i]) keys = FLAGGED[i];
        else if (idx === 0) keys = GREEN[Math.floor(R() * GREEN.length)];
        else { const x = R(); keys = x < 0.55 ? GREEN[Math.floor(R() * GREEN.length)] : x < 0.87 ? YELLOW[Math.floor(R() * YELLOW.length)] : RED[Math.floor(R() * RED.length)]; }
        const ev = evalMeal(keys);
        const t = at(d, '12:05').toISOString();
        const mid = insMeal.run(sid, 'lunch', 'demo', 'demo', JSON.stringify(ev.foods.map((f) => ({ key: f.key, name: f.name, portion: f.portion, carbs: f.carbs, protein: f.protein, fat: f.fat, fiber: f.fiber, drink: !!f.drink, sugary: !!f.sugary }))),
          ev.nutrition.carbs, ev.nutrition.protein, ev.nutrition.fat, ev.nutrition.fiber, ev.assessment.status, ev.assessment.reason.en, ev.assessment.reason.ar, JSON.stringify(ev.suggestions), nurseUid, t).lastInsertRowid;
        insAI.run(sid, mid, 'meal_assessment', JSON.stringify({ status: ev.assessment.status, flags: ev.assessment.flags, mode: 'demo' }), t);
        mealByDay.set(ymd(d), { status: ev.assessment.status, id: mid, ev, t });
        if (isLama && idx < 4) { // parent-facing notifications for the demo family
          const note = generateNotifications({ kind: 'meal', mealType: 'lunch', assessment: ev.assessment });
          insN.run(puid, sid, mid, 'meal', note.severity, note.title.en, note.title.ar, note.body.en, note.body.ar, note.suggestion.en, note.suggestion.ar, idx > 1 ? 1 : 0, t);
        }
        if (FLAGGED[i] && idx === 0) nurseNotes.push({ sid, mid, name, status: ev.assessment.status, t });
      });

      // Glucose: 3 readings per school day for ~35 days. Patterns are baked in as plain correlations in the data.
      const base = 104 + Math.floor(R() * 22);
      let lastId = null;
      [...days].reverse().forEach((d) => {
        const key = ymd(d);
        const examBoost = examSet.has(key) || eveSet.has(key) ? 30 : 0;
        const pe = peDays.includes(d.getDay());
        const lunch = mealByDay.get(key);
        const lunchBoost = lunch ? { GREEN: 6, YELLOW: 26, RED: 46 }[lunch.status] : 14;
        [['07:50', 'before_meal', 0], ['10:50', pe ? 'after_pe' : 'other', pe ? -22 : 0], ['12:40', 'after_meal', lunchBoost]].forEach(([t, ctx, mod]) => {
          const when = at(d, t); if (when > now) return;
          const v = Math.max(62, Math.min(270, Math.round(base + examBoost + mod + (R() - 0.5) * 18)));
          lastId = insG.run(sid, v, examBoost && ctx === 'other' ? 'exam_day' : ctx, when.toISOString(), nurseUid).lastInsertRowid;
        });
      });
      if (isLama && lastId) db.prepare('UPDATE glucose_readings SET value_mgdl=112 WHERE id=?').run(lastId); // matches the product brief example

      if (isLama) {
        insN.run(puid, sid, null, 'welcome', 'info', 'Welcome to SafePulse', 'مرحبًا بك في SafePulse', 'Lama has been registered with the school nurse. You will see meal reviews, schedule and exam updates here.',
          'تم تسجيل لمى لدى ممرضة المدرسة. ستظهر هنا مراجعات الوجبات وتحديثات الجدول والاختبارات.', null, null, 1, addDays(now, -40).toISOString());
        insN.run(puid, sid, null, 'exam', 'info', 'Upcoming exam', 'اختبار قادم', `Mathematics exam on ${ymd(schoolDayOffset(now, 1))} at 12:00.`,
          `اختبار الرياضيات بتاريخ ${ymd(schoolDayOffset(now, 1))} الساعة 12:00.`, 'Exam days can be busy — share any routine questions with the school nurse in advance.', 'قد تكون أيام الاختبارات مزدحمة — شاركي ممرضة المدرسة أي استفسار عن الروتين مسبقًا.', 0, addDays(now, -0.2).toISOString());
      }
    });

    nurseNotes.slice(0, 2).forEach((n) => insN.run(nurseUid, n.sid, n.mid, 'meal', n.status === 'RED' ? 'attention' : 'review', 'Meal flagged for review', 'وجبة بحاجة إلى مراجعة',
      `${n.name}: meal marked "${n.status === 'YELLOW' ? 'Review' : 'Needs Attention'}". The parent has been notified in SafePulse.`,
      `${n.name}: صُنِّفت الوجبة «${n.status === 'YELLOW' ? 'تحتاج مراجعة' : 'تحتاج انتباهًا'}». تم إشعار ولي الأمر داخل SafePulse.`,
      "Review the student's individual care plan.", 'يُرجى مراجعة خطة الرعاية الفردية للطالبة.', 0, n.t));
  })();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--reset')) { resetAndSeed(); console.log('Demo database reset and re-seeded.'); }
  else if (db.prepare('SELECT COUNT(*) c FROM users').get().c) console.log('Database already has data. Use "npm run db:reset" to wipe and re-seed the DEMO data.');
  else { seed(); console.log('Demo data created.'); }
  console.log(`Demo nurse:  ${DEMO_NURSE_EMAIL}\nDemo parent: ${DEMO_PARENT_EMAIL}\nPassword:    ${config.demoPassword}`);
}
