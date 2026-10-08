import { Router } from 'express';
import multer from 'multer';
import { db, nowIso } from '../db/index.js';
import { requireAuth, requireRole, wrap } from '../middleware/auth.js';
import { analyzeMeal, estimateNutrition, generateMealAssessment, generateMealSuggestions, generateNotifications, aiConfigured } from '../services/ai/index.js';
import { DEMO_MEALS, foodCatalog } from '../services/ai/foods.js';
import { uploadMealImage, getMealImage, isAllowedImage } from '../services/storage.js';
import { mealOut } from './lib.js';

const r = Router();
const nurse = requireRole('NURSE');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024, files: 1 } });

r.get('/options', requireAuth, nurse, (_req, res) => {
  res.json({ demoMeals: DEMO_MEALS.map((m) => ({ id: m.id, title: m.title })), foods: foodCatalog(), aiConfigured: aiConfigured() });
});

r.post('/analyze', requireAuth, nurse, (req, res, next) => {
  upload.single('image')(req, res, (e) => {
    if (e) return res.status(e.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: 'UPLOAD_FAILED' });
    next();
  });
}, wrap(async (req, res) => {
  const b = req.body || {};
  const sid = Number(b.studentId);
  const student = Number.isInteger(sid) && await db.prepare('SELECT * FROM students WHERE id=?').get(sid);
  if (!student) return res.status(400).json({ error: 'VALIDATION', field: 'studentId' });
  const mealType = ['breakfast', 'lunch', 'snack'].includes(b.mealType) ? b.mealType : 'lunch';

  let image = null;
  if (req.file) {
    if (!isAllowedImage(req.file.mimetype, req.file.buffer)) return res.status(400).json({ error: 'UPLOAD_FAILED' });
    image = req.file;
  }
  let foodKeys = b.foodKeys;
  if (typeof foodKeys === 'string') foodKeys = foodKeys.split(',').map((x) => x.trim()).filter(Boolean);

  let result;
  try {
    result = await analyzeMeal({ image, demoMealId: b.demoMealId || null, foodKeys });
  } catch (e) {
    if (e.code === 'VALIDATION') return res.status(400).json({ error: 'VALIDATION' });
    if (e.code === 'NO_FOOD') return res.status(422).json({ error: 'NO_FOOD' });
    return res.status(503).json({ error: 'AI_UNAVAILABLE' });
  }
  const nutrition = estimateNutrition(result.foods);
  const assessment = generateMealAssessment(result.foods, nutrition);
  const suggestions = generateMealSuggestions(assessment, nutrition);
  const note = generateNotifications({ kind: 'meal', mealType, assessment });

  const imageKey = image ? await uploadMealImage(image.buffer, image.mimetype) : null;
  const source = result.source || (b.source === 'camera' ? 'camera' : 'upload');
  const now = nowIso();
  const foodsJson = JSON.stringify(result.foods.map((f) => ({
    key: f.key, name: f.name, portion: f.portion, carbs: f.carbs, protein: f.protein, fat: f.fat, fiber: f.fiber, drink: !!f.drink, sugary: !!f.sugary,
  })));
  const par = await db.prepare('SELECT user_id FROM parents WHERE id=?').get(student.parent_id);

  const NOTIF = `INSERT INTO notifications (user_id,student_id,meal_id,kind,severity,title_en,title_ar,body_en,body_ar,suggestion_en,suggestion_ar,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
  const mealId = await db.tx(async (t) => {
    const id = (await t.prepare(`INSERT INTO meals (student_id,meal_type,source,estimate_mode,image_key,detected_foods,carbs,protein,fat,fiber,status,reason_en,reason_ar,suggestions,created_by,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(student.id, mealType, source, result.mode === 'ai' ? 'ai' : 'demo', imageKey, foodsJson,
      nutrition.carbs, nutrition.protein, nutrition.fat, nutrition.fiber, assessment.status, assessment.reason.en, assessment.reason.ar, JSON.stringify(suggestions), req.user.id, now)).lastInsertRowid;
    const more = [['INSERT INTO ai_insights (student_id,meal_id,kind,payload,created_at) VALUES (?,?,?,?,?)',
      [student.id, id, 'meal_assessment', JSON.stringify({ status: assessment.status, flags: assessment.flags, mode: result.mode }), now]]];
    if (par) more.push([NOTIF, [par.user_id, student.id, id, 'meal', note.severity, note.title.en, note.title.ar, note.body.en, note.body.ar, note.suggestion.en, note.suggestion.ar, now]]);
    if (assessment.status !== 'GREEN') { // nurse inbox follow-up
      more.push([NOTIF, [req.user.id, student.id, id, 'meal', note.severity, 'Meal flagged for review', 'وجبة بحاجة إلى مراجعة',
        `${student.full_name}: meal marked "${assessment.status === 'YELLOW' ? 'Review' : 'Needs Attention'}". The parent has been notified in SafePulse.`,
        `${student.full_name}: صُنِّفت الوجبة «${assessment.status === 'YELLOW' ? 'تحتاج مراجعة' : 'تحتاج انتباهًا'}». تم إشعار ولي الأمر داخل SafePulse.`,
        "Review the student's individual care plan.", 'يُرجى مراجعة خطة الرعاية الفردية للطالبة.', now]]);
    }
    await t.batch(more);
    return id;
  });

  res.status(201).json({
    meal: mealOut(await db.prepare('SELECT * FROM meals WHERE id=?').get(mealId)),
    parentNotified: !!par,
    mode: result.mode,
  });
}));

// Meal image (nurse any · parent own child only)
r.get('/:id/image', requireAuth, wrap(async (req, res) => {
  const m = await db.prepare('SELECT m.image_key, s.parent_id FROM meals m JOIN students s ON s.id=m.student_id WHERE m.id=?').get(Number(req.params.id));
  if (!m || !m.image_key) return res.status(404).end();
  if (req.user.role === 'PARENT') {
    const p = await db.prepare('SELECT id FROM parents WHERE user_id=?').get(req.user.id);
    if (!p || p.id !== m.parent_id) return res.status(404).end();
  }
  const img = await getMealImage(m.image_key);
  if (!img) return res.status(404).end();
  res.set('Content-Type', img.mime).set('Cache-Control', 'private, max-age=3600').set('X-Content-Type-Options', 'nosniff').send(img.data);
}));

export default r;
