// Possible-pattern analysis: simple descriptive statistics over a student's RECORDED history.
// It never claims causation and never predicts. Needs a minimum number of samples per comparison.
import { ymd } from '../schedule.js';

const MIN_N = 3;
const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const round = (n) => Math.round(n);

export function analyzePatterns({ glucose = [], exams = [], schedule = [], meals = [] }) {
  const out = [];
  const reads = glucose.map((g) => ({ v: g.value_mgdl, d: new Date(g.recorded_at), ctx: g.context }));
  if (reads.length < 6) return { patterns: [], sample: reads.length, enough: false };

  const examDates = new Set(exams.map((e) => e.exam_date));
  const dayBefore = new Set([...examDates].map((s) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() - 1); return ymd(d); }));
  const peDows = new Set(schedule.filter((e) => e.activity_type === 'pe').map((e) => e.day_of_week));
  const key = (r) => ymd(r.d);

  // 1) Exam days vs other school days
  const onExam = reads.filter((r) => examDates.has(key(r)) || dayBefore.has(key(r)));
  const offExam = reads.filter((r) => !examDates.has(key(r)) && !dayBefore.has(key(r)));
  if (onExam.length >= MIN_N && offExam.length >= MIN_N) {
    const a = avg(onExam.map((r) => r.v)), b = avg(offExam.map((r) => r.v));
    const diff = a - b;
    if (Math.abs(diff) >= 12) out.push({
      id: 'exam', icon: 'exam', n: onExam.length, strength: Math.abs(diff) >= 25 ? 'noticeable' : 'slight',
      title: { en: 'Around exam periods', ar: 'حول فترات الاختبارات' },
      text: {
        en: `Historical records show ${Math.abs(diff) >= 25 ? 'noticeable' : 'slight'} changes around previous exam periods (average ${round(a)} vs ${round(b)} mg/dL on other days).`,
        ar: `تُظهر السجلات السابقة تغيّرات ${Math.abs(diff) >= 25 ? 'ملحوظة' : 'طفيفة'} حول فترات الاختبارات السابقة (المتوسط ${round(a)} مقابل ${round(b)} ملغ/دل في الأيام الأخرى).`,
      },
      awareness: { en: 'This may be useful for increased awareness during similar school days.', ar: 'قد يفيد هذا في زيادة الانتباه خلال أيام دراسية مشابهة.' },
      data: { with: round(a), without: round(b) },
    });
  }

  // 2) PE days vs other days (readings taken in the morning/after PE window)
  if (peDows.size) {
    const pe = reads.filter((r) => peDows.has(r.d.getDay()) && r.d.getHours() >= 10 && r.d.getHours() < 13);
    const nonPe = reads.filter((r) => !peDows.has(r.d.getDay()) && r.d.getHours() >= 10 && r.d.getHours() < 13);
    if (pe.length >= MIN_N && nonPe.length >= MIN_N) {
      const a = avg(pe.map((r) => r.v)), b = avg(nonPe.map((r) => r.v)); const diff = a - b;
      if (Math.abs(diff) >= 12) out.push({
        id: 'pe', icon: 'pe', n: pe.length, strength: Math.abs(diff) >= 25 ? 'noticeable' : 'slight',
        title: { en: 'On PE days', ar: 'في أيام حصة الرياضة' },
        text: {
          en: `Late-morning readings on PE days were ${diff < 0 ? 'lower' : 'higher'} on average (${round(a)} vs ${round(b)} mg/dL on other days).`,
          ar: `كانت قراءات ما قبل الظهر في أيام الرياضة ${diff < 0 ? 'أقل' : 'أعلى'} في المتوسط (${round(a)} مقابل ${round(b)} ملغ/دل في الأيام الأخرى).`,
        },
        awareness: { en: 'Discuss physical-activity days with the school nurse and the individual care plan.', ar: 'ناقشي أيام النشاط البدني مع ممرضة المدرسة وخطة الرعاية الفردية.' },
        data: { with: round(a), without: round(b) },
      });
    }
  }

  // 3) Time of day
  const slot = (h) => (h < 10 ? 'early' : h < 12 ? 'mid' : 'late');
  const slots = { early: [], mid: [], late: [] };
  reads.forEach((r) => slots[slot(r.d.getHours())].push(r.v));
  const filled = Object.entries(slots).filter(([, v]) => v.length >= MIN_N).map(([k, v]) => [k, avg(v)]);
  if (filled.length >= 2) {
    filled.sort((a, b) => b[1] - a[1]);
    const [hiK, hi] = filled[0]; const [loK, lo] = filled[filled.length - 1];
    if (hi - lo >= 15) {
      const L = { early: { en: 'early morning', ar: 'الصباح الباكر' }, mid: { en: 'mid-morning', ar: 'منتصف الصباح' }, late: { en: 'around and after lunch', ar: 'حول وبعد وقت الغداء' } };
      out.push({
        id: 'time', icon: 'clock', n: reads.length, strength: hi - lo >= 30 ? 'noticeable' : 'slight',
        title: { en: 'Time of day', ar: 'وقت اليوم' },
        text: {
          en: `Recorded readings tend to be highest ${L[hiK].en} (avg ${round(hi)} mg/dL) and lowest ${L[loK].en} (avg ${round(lo)} mg/dL).`,
          ar: `تميل القراءات المسجلة إلى أن تكون الأعلى ${L[hiK].ar} (المتوسط ${round(hi)} ملغ/دل) والأدنى ${L[loK].ar} (المتوسط ${round(lo)} ملغ/دل).`,
        },
        awareness: { en: 'Knowing usual time-of-day differences can help plan routine check-ins.', ar: 'معرفة الاختلافات المعتادة خلال اليوم قد تساعد في تخطيط المتابعات الروتينية.' },
        data: { high: round(hi), low: round(lo) },
      });
    }
  }

  // 4) After meals marked Review / Needs Attention vs Good Match (readings within ~3h after a recorded meal)
  const hi = [], ok = [];
  for (const m of meals) {
    const t = new Date(m.created_at).getTime();
    const after = reads.filter((r) => { const dt = r.d.getTime() - t; return dt > 20 * 60000 && dt <= 3 * 3600000; });
    if (!after.length) continue;
    (m.status === 'GREEN' ? ok : hi).push(avg(after.map((r) => r.v)));
  }
  if (hi.length >= MIN_N && ok.length >= MIN_N) {
    const a = avg(hi), b = avg(ok);
    if (a - b >= 12) out.push({
      id: 'meals', icon: 'meal', n: hi.length, strength: a - b >= 25 ? 'noticeable' : 'slight',
      title: { en: 'After meals', ar: 'بعد الوجبات' },
      text: {
        en: `Readings within a few hours after meals marked Review or Needs Attention averaged ${round(a)} mg/dL, compared with ${round(b)} mg/dL after Good Match meals.`,
        ar: `بلغ متوسط القراءات خلال ساعات بعد الوجبات المصنفة «تحتاج مراجعة» أو «تحتاج انتباهًا» ${round(a)} ملغ/دل، مقابل ${round(b)} ملغ/دل بعد الوجبات «المناسبة».`,
      },
      awareness: { en: 'Meal choices are one of many things that can be reviewed with the care team.', ar: 'اختيارات الوجبات من بين أمور كثيرة يمكن مراجعتها مع فريق الرعاية.' },
      data: { review: round(a), good: round(b) },
    });
  }

  return { patterns: out, sample: reads.length, enough: true };
}
