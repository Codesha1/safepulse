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

/** True when someone other than the fictional demo accounts exists (real students / nurses / parents). */
export async function hasRealData() {
  return (await db.prepare("SELECT COUNT(*) c FROM users WHERE email NOT LIKE '%@safepulse.demo'").get()).c > 0;
}
export async function resetAndSeed() {
  if (await hasRealData()) { const e = new Error('Refusing to reset: real (non-demo) accounts exist.'); e.code = 'REAL_DATA'; throw e; }
  // children first, so foreign keys are never violated
  await db.batch(['meal_images', 'notifications', 'ai_insights', 'wellness_plans', 'meals', 'glucose_readings', 'schedule_events', 'exams', 'medical_information', 'students', 'parents', 'nurses', 'users']
    .map((t) => [`DELETE FROM ${t}`, []]));
  await seed();
}
export async function seedIfEmpty() {
  if (!(await db.prepare('SELECT COUNT(*) c FROM users').get()).c) { await seed(); console.log(`[SafePulse] Demo data created. Demo logins: ${DEMO_NURSE_EMAIL} / ${DEMO_PARENT_EMAIL} (password: see DEMO_PASSWORD in .env, or use the "Demo" buttons).`); }
}

// Rows are collected in memory with pre-assigned ids and sent in a few big batches
// (one network round trip per ~300 rows) instead of thousands of single inserts.
async function seed() {
  const now = new Date();
  const demoHash = bcrypt.hashSync(config.demoPassword, 10);
  const lockedHash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 10); // other parents: not loginable
  const out = [];
  const ctr = {};
  const mk = (table, cols) => {
    const n = cols.split(',').length;
    const sql = `INSERT INTO ${table} (id,${cols}) VALUES (${Array(n + 1).fill('?').join(',')})`;
    ctr[table] = 0;
    return { run: (...v) => { const id = ++ctr[table]; out.push([sql, [id, ...v]]); return { lastInsertRowid: id }; } };
  };
  const insUser = mk('users', 'email,password_hash,role,full_name,must_change_password,is_demo,created_at');
  const U = { run: (email, hash, role, name, isDemo, created) => insUser.run(email, hash, role, name, 0, isDemo, created) };
  const insNurse = mk('nurses', 'user_id,school_name,phone');
  const insParent = mk('parents', 'user_id,relationship,phone,preferred_contact,emergency_contact');

  {
    const