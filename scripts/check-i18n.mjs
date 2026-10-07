// Verifies that en.json and ar.json have identical keys and that every translation key used in the code exists.
// Run: npm run check:i18n
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'client', 'src');
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [p + k]));
const load = (f) => JSON.parse(fs.readFileSync(path.join(root, 'i18n', f), 'utf8'));
const en = load('en.json'), ar = load('ar.json');
const enKeys = new Set(flat(en)), arKeys = new Set(flat(ar));
const namespaces = new Set([...enKeys].map((k) => k.split('.')[0]));

// Keys built dynamically in code (template strings) — each expansion must exist.
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const dyn = {
  day: DAYS, mealType: ['breakfast', 'lunch', 'snack'], activity: ['class', 'pe', 'break', 'lunch', 'exam', 'event', 'other'],
  examType: ['quiz', 'monthly', 'midterm', 'final', 'other'], diabetes: ['type1', 'type2', 'other', 'unspecified'],
  relationship: ['mother', 'father', 'guardian', 'other'], contact: ['app', 'phone', 'sms', 'email'],
  'glucose.tone': ['low', 'ok', 'high'], 'glucose.ctx': ['fasting', 'before_meal', 'after_meal', 'before_pe', 'after_pe', 'exam_day', 'other'],
  filter: ['all', 'review', 'attention', 'ok', 'none'], 'students.col': ['student', 'grade', 'glucose', 'meal', 'next', 'status'],
  tabs: ['overview', 'medical', 'glucose', 'meals', 'schedule', 'exams', 'notifications', 'patterns'],
  medical: ['allergies', 'conditions', 'hypoHistory', 'hyperHistory', 'medicationInfo', 'foodRestrictions', 'activityConsiderations', 'emergencyInstructions', 'physicianContact', 'carePlanNotes'],
  step: ['general', 'medical', 'schedule', 'exams', 'parent', 'review'], wellness: ['meals', 'hydration', 'sleep', 'activity', 'stress', 'school'],
  patterns: ['slight', 'noticeable'], action: ['register', 'analyze', 'students', 'notifications', 'insights'],
  meal: ['carbs', 'protein', 'fat', 'fiber'],   next: ['ai', 'portion', 'monitor', 'cloud', 'pro', 'multi', 'analytics', 'a11y'],
};
const used = new Map(); const add = (k, f) => { if (!used.has(k)) used.set(k, f); };
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(tsx?|jsx?)$/.test(e.name)) scan(p); });
function scan(file) {
  const s = fs.readFileSync(file, 'utf8');
  for (const m of s.matchAll(/['"`]([a-zA-Z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)+)['"`]/g)) if (namespaces.has(m[1].split('.')[0]) && !/\.(tsx?|json|css|js|jpg|png|svg)$/.test(m[1])) add(m[1], path.relative(root, file));
}
walk(root);
for (const [prefix, list] of Object.entries(dyn)) for (const x of list) { if (prefix === 'next') { add(`next.${x}.title`, 'dynamic'); add(`next.${x}.desc`, 'dynamic'); } else add(`${prefix}.${x}`, 'dynamic'); }
for (const k of ['nurse', 'parent']) { add(`role.${k}Desc`, 'dynamic'); add(`role.${k}Badge`, 'dynamic'); }
for (const k of ['green', 'yellow', 'red']) add(`status.${k}Desc`, 'dynamic');
for (const k of ['dashboard', 'students', 'register']) void k;
for (const k of ['vision', 'meals', 'glucose', 'schedule', 'school', 'family']) { add(`core.${k}.title`, 'dynamic'); add(`core.${k}.desc`, 'dynamic'); }
for (const k of ['register', 'analyze', 'students', 'notifications', 'insights']) add(`actionHint.${k}`, 'dynamic');

let bad = 0;
const missing = [...used].filter(([k]) => !enKeys.has(k) && ![...enKeys].some((e) => e === k));
// a "used" key can also be a prefix of nested keys (e.g. 'status.green') — only report truly unknown ones
const unknown = missing.filter(([k]) => ![...enKeys].some((e) => e.startsWith(k + '.')));
if (unknown.length) { bad++; console.log(`\n✗ ${unknown.length} key(s) used in code but missing from en.json:`); unknown.forEach(([k, f]) => console.log(`   ${k}   (${f})`)); }
const onlyEn = [...enKeys].filter((k) => !arKeys.has(k)), onlyAr = [...arKeys].filter((k) => !enKeys.has(k));
if (onlyEn.length) { bad++; console.log(`\n✗ ${onlyEn.length} key(s) missing from ar.json:`); onlyEn.forEach((k) => console.log('   ' + k)); }
if (onlyAr.length) { bad++; console.log(`\n✗ ${onlyAr.length} key(s) in ar.json but not en.json:`); onlyAr.forEach((k) => console.log('   ' + k)); }
const empty = [...arKeys].filter((k) => { const v = k.split('.').reduce((o, p) => o?.[p], ar); return typeof v !== 'string' || !v.trim(); });
if (empty.length) { bad++; console.log('\n✗ empty Arabic values:', empty.join(', ')); }
console.log(bad ? `\n${enKeys.size} EN / ${arKeys.size} AR keys — problems found.` : `✓ i18n OK — ${enKeys.size} keys in both languages, all code references resolve.`);
process.exit(bad ? 1 : 0);
