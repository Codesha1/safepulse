// ──────────────────────────────────────────────────────────────────────────────
// SafePulse AI service layer. The UI never contains AI logic; routes call these functions.
// Without AI_API_KEY everything runs in clearly-labelled DEMO mode.
//
// SAFETY: nothing here calculates insulin, recommends medication changes, diagnoses,
// or reads the student's medical_information. Output is general awareness only.
// ──────────────────────────────────────────────────────────────────────────────
import crypto from 'node:crypto';
import { config } from '../../config.js';
import { FOODS, DEMO_MEALS } from './foods.js';
import { MEAL_THRESHOLDS as T } from './thresholds.js';
import { recognizeFoods } from './providers/anthropic.js';
import { analyzePatterns as patterns } from './patterns.js';

export const aiConfigured = () => Boolean(config.ai.apiKey);
const r1 = (n) => Math.round(n * 10) / 10;
const err = (msg, code) => Object.assign(new Error(msg), { code });

export const CARE_PLAN_EN = "Review the student's individual care plan.";
export const CARE_PLAN_AR = 'يُرجى مراجعة خطة الرعاية الفردية للطالبة.';
export const GUIDANCE_EN = 'Follow professional health guidance.';
export const GUIDANCE_AR = 'يُرجى اتباع التوجيه الصحي المهني.';

/** 1. Identify foods. */
export async function analyzeMeal({ image, demoMealId, foodKeys }) {
  if (demoMealId) {
    const m = DEMO_MEALS.find((d) => d.id === demoMealId);
    if (!m) throw err('Unknown demo meal', 'VALIDATION');
    return { foods: m.foods.map((k) => ({ key: k, ...FOODS[k] })), mode: 'demo', source: 'demo' };
  }
  if (Array.isArray(foodKeys) && foodKeys.length) {
    const keys = foodKeys.filter((k) => FOODS[k]).slice(0, 12);
    if (!keys.length) throw err('No valid foods', 'VALIDATION');
    return { foods: keys.map((k) => ({ key: k, ...FOODS[k] })), mode: 'manual', source: 'manual' };
  }
  if (!image) throw err('No image', 'VALIDATION');
  if (aiConfigured()) {
    try {
      const foods = await recognizeFoods(image.buffer, image.mimetype);
      if (!foods.length) throw err('No food detected', 'NO_FOOD');
      return { foods, mode: 'ai' };
    } catch (e) {
      if (e.code === 'NO_FOOD') throw e;
      console.error('[ai] provider error:', e.message);
      throw err('AI unavailable', 'AI_UNAVAILABLE');
    }
  }
  // DEMO MODE (no vision API configured): deterministic stand-in picked from the image bytes.
  const h = crypto.createHash('sha256').update(image.buffer).digest()[0];
  const m = DEMO_MEALS[h % DEMO_MEALS.length];
  return { foods: m.foods.map((k) => ({ key: k, ...FOODS[k] })), mode: 'demo' };
}

/** 2. Sum nutrition. */
export function estimateNutrition(foods) {
  const sum = (k) => r1(foods.reduce((a, f) => a + (f[k] || 0), 0));
  return { carbs: sum('carbs'), protein: sum('protein'), fat: sum('fat'), fiber: sum('fiber') };
}

/** 3. Supportive three-level status. Never states a food "causes" anything. */
export function generateMealAssessment(foods, nutrition) {
  const sugaryDrink = foods.some((f) => f.sugary && f.drink);
  const sweet = foods.some((f) => f.sweet);
  const lowFiber = nutrition.fiber < T.lowFiber && nutrition.carbs > T.reviewCarbs;
  let status = 'GREEN';
  if (nutrition.carbs >= T.attentionCarbs) status = 'RED';
  else if (nutrition.carbs > T.reviewCarbs || sugaryDrink || sweet) status = 'YELLOW';

  const factors = [];
  if (nutrition.carbs > T.reviewCarbs) factors.push({
    en: `the estimated carbohydrate content (~${Math.round(nutrition.carbs)} g) is on the higher side`,
    ar: `المحتوى التقديري من الكربوهيدرات (~${Math.round(nutrition.carbs)} غ) مرتفع نسبيًا`,
  });
  if (sugaryDrink) factors.push({ en: 'it includes a sweetened drink', ar: 'تتضمن مشروبًا محلّى' });
  if (sweet) factors.push({ en: 'it includes a sweet item', ar: 'تتضمن عنصرًا حلوًا' });
  if (lowFiber) factors.push({ en: 'the estimated fiber is relatively low', ar: 'الألياف التقديرية منخفضة نسبيًا' });

  const reason = status === 'GREEN'
    ? {
        en: 'The estimated carbohydrate content looks moderate and is balanced with protein and fiber. This is an awareness estimate only.',
        ar: 'يبدو المحتوى التقديري من الكربوهيدرات معتدلًا ومتوازنًا مع البروتين والألياف. هذا تقدير توعوي فقط.',
      }
    : {
        en: `This meal may require additional review: ${factors.map((f) => f.en).join('; ')}. This is based on estimated values, and the student's individual care plan should guide any decision.`,
        ar: `قد تحتاج هذه الوجبة إلى مراجعة إضافية: ${factors.map((f) => f.ar).join('؛ ')}. هذا مبني على قيم تقديرية، وتبقى خطة الرعاية الفردية للطالبة هي المرجع لأي قرار.`,
      };
  return { status, reason, flags: { sugaryDrink, sweet, lowFiber } };
}

/** 4. General meal improvement ideas (never insulin/medication). */
export function generateMealSuggestions(assessment, nutrition) {
  if (assessment.status === 'GREEN') {
    return [{ en: "This meal looks like a good match. Keep following the student's individual care plan.", ar: 'تبدو هذه الوجبة مناسبة. يُرجى مواصلة اتباع خطة الرعاية الفردية للطالبة.' }];
  }
  const out = [];
  if (nutrition.carbs > T.reviewCarbs) out.push({ en: 'Review the portion size of carbohydrate-rich items.', ar: 'راجعي حجم الحصة من الأطعمة الغنية بالكربوهيدرات.' });
  if (assessment.flags.sugaryDrink) out.push({ en: 'Review the drink choice — water or an unsweetened option may be worth considering.', ar: 'راجعي اختيار المشروب — قد يكون الماء أو خيار غير محلّى مناسبًا للنظر فيه.' });
  if (assessment.flags.sweet) out.push({ en: 'Review sweet items and when they are eaten.', ar: 'راجعي العناصر الحلوة ووقت تناولها.' });
  if (assessment.flags.lowFiber) out.push({ en: 'Consider adding fiber, such as vegetables or salad.', ar: 'فكّري في إضافة الألياف، مثل الخضروات أو السلطة.' });
  out.push({ en: CARE_PLAN_EN, ar: CARE_PLAN_AR });
  out.push({ en: GUIDANCE_EN, ar: GUIDANCE_AR });
  return out;
}

/** 5. Bilingual parent notification for a meal. */
export function generateNotifications({ kind, mealType, assessment }) {
  if (kind !== 'meal') throw new Error('Unsupported notification kind');
  const mealLabel = ({
    breakfast: { en: "Today's breakfast", ar: 'وجبة الإفطار اليوم' },
    lunch: { en: "Today's lunch", ar: 'وجبة الغداء اليوم' },
    snack: { en: "Today's snack", ar: 'وجبة خفيفة اليوم' },
  })[mealType] || { en: "Today's meal", ar: 'وجبة اليوم' };
  const label = {
    GREEN: { en: 'Good Match', ar: 'مناسبة' },
    YELLOW: { en: 'Review', ar: 'تحتاج مراجعة' },
    RED: { en: 'Needs Attention', ar: 'تحتاج انتباهًا' },
  }[assessment.status];
  const suggestion = assessment.status === 'GREEN'
    ? { en: 'No action needed. Keep following the individual care plan.', ar: 'لا يلزم أي إجراء. يُرجى مواصلة اتباع خطة الرعاية الفردية.' }
    : { en: "Consider reviewing the drink choice and portion size according to the student's care plan.", ar: 'يُرجى النظر في مراجعة اختيار المشروب وحجم الحصة وفق خطة الرعاية الفردية للطالبة.' };
  return {
    severity: assessment.status === 'GREEN' ? 'good' : assessment.status === 'YELLOW' ? 'review' : 'attention',
    title: { en: 'Meal Review', ar: 'مراجعة الوجبة' },
    body: { en: `${mealLabel.en} was marked as: ${label.en}.`, ar: `صُنِّفت ${mealLabel.ar} على أنها: ${label.ar}.` },
    suggestion,
  };
}

/** 6. Possible patterns (descriptive statistics; never causal, never a prediction). */
export const analyzePatterns = patterns;

/** 7. General wellness suggestions. Awareness only. */
export function generateWellnessPlan({ recentMeals = [], hasExamSoon = false, hasPE = true } = {}) {
  const sugaryRecent = recentMeals.some((m) => m.flags?.sugaryDrink);
  const plan = {
    meals: [
      { en: 'Build plates with vegetables or salad, a protein, and a measured portion of starchy foods.', ar: 'كوّني الطبق من خضروات أو سلطة، ومصدر بروتين، وحصة محسوبة من النشويات.' },
      { en: 'Packing a similar balanced lunch on busy school days can make choices easier.', ar: 'تجهيز وجبة غداء متوازنة بنمط مشابه في الأيام المزدحمة قد يسهّل الاختيار.' },
      sugaryRecent
        ? { en: 'Recent records included sweetened drinks — talk with your care team about drink choices.', ar: 'تضمنت السجلات الأخيرة مشروبات محلّاة — ناقشي اختيارات المشروبات مع فريق الرعاية.' }
        : { en: 'Keep up the balanced choices seen in recent school meals.', ar: 'واصلي الخيارات المتوازنة التي ظهرت في وجبات المدرسة الأخيرة.' },
    ],
    hydration: [
      { en: 'Send a refillable water bottle to school every day.', ar: 'أرسلي زجاجة ماء قابلة لإعادة التعبئة إلى المدرسة كل يوم.' },
      { en: 'Ask your care team which drinks suit your child best.', ar: 'اسألي فريق الرعاية عن المشروبات الأنسب لابنتك.' },
    ],
    sleep: [
      { en: 'A steady bedtime routine can help school mornings feel calmer.', ar: 'روتين نوم ثابت قد يجعل صباحات المدرسة أكثر هدوءًا.' },
      { en: 'Try keeping screens away during the last hour before bed.', ar: 'حاولي إبعاد الشاشات خلال الساعة الأخيرة قبل النوم.' },
    ],
    activity: [
      hasPE
        ? { en: 'On PE days, talk with the school nurse about the individual plan for physical activity.', ar: 'في أيام حصة الرياضة، تحدثي مع ممرضة المدرسة حول الخطة الفردية للنشاط البدني.' }
        : { en: 'Gentle daily movement, like a family walk, can be a nice routine.', ar: 'الحركة اللطيفة اليومية مثل المشي مع العائلة قد تكون روتينًا جميلًا.' },
      { en: 'Choose activities your child enjoys so movement feels fun, not forced.', ar: 'اختاري أنشطة تستمتع بها ابنتك لتصبح الحركة ممتعة وليست مفروضة.' },
    ],
    stress: [
      hasExamSoon
        ? { en: 'Exams are coming up: short study blocks with breaks can feel more manageable.', ar: 'الاختبارات قريبة: فترات مذاكرة قصيرة مع استراحات قد تكون أسهل.' }
        : { en: 'Short breaks and a calm chat after school can ease the day.', ar: 'استراحات قصيرة وحديث هادئ بعد المدرسة قد يخففان عبء اليوم.' },
      { en: 'Let your child know it is always okay to talk to the school nurse.', ar: 'أخبري ابنتك أنه من المقبول دائمًا التحدث مع ممرضة المدرسة.' },
    ],
    school: [
      { en: 'Share changes in routine (trips, events, exams) with the school nurse in advance.', ar: 'شاركي ممرضة المدرسة بأي تغيير في الروتين (رحلات، فعاليات، اختبارات) مسبقًا.' },
      { en: 'Keep contact details up to date so the school can reach you quickly.', ar: 'حدّثي بيانات التواصل ليتمكن فريق المدرسة من الوصول إليك بسرعة.' },
    ],
  };
  return { plan, footer: { en: 'General awareness suggestions only. Follow professional health guidance and the individual care plan.', ar: 'اقتراحات توعوية عامة فقط. يُرجى اتباع التوجيه الصحي المهني وخطة الرعاية الفردية.' } };
}
