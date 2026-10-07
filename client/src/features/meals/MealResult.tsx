import { Lightbulb, ShieldCheck, Wheat, Beef, Droplet, Leaf } from 'lucide-react';
import { useI18n } from '../../i18n';
import { MealStatusBadge, PrototypeBadge, mealStatusStyle } from '../../components/ui';
import type { Meal } from '../../services/types';

/** Result of a meal analysis. Used by the nurse scanner, meal history and the parent view. */
export function MealResult({ meal, imageUrl, audience = 'nurse' }: { meal: Meal; imageUrl?: string | null; audience?: 'nurse' | 'parent' }) {
  const { t, bi, fmtDate, fmtTime } = useI18n();
  const st = mealStatusStyle(meal.status);
  const n = meal.nutrition;
  const tiles = [
    { k: 'carbs', Icon: Wheat, v: n.carbs, tone: 'from-amber-400 to-orange-500' }, { k: 'protein', Icon: Beef, v: n.protein, tone: 'from-brand-500 to-brand-700' },
    { k: 'fat', Icon: Droplet, v: n.fat, tone: 'from-sky-400 to-blue-600' }, { k: 'fiber', Icon: Leaf, v: n.fiber, tone: 'from-mint-400 to-mint-600' },
  ];
  const img = imageUrl ?? (meal.hasImage ? `/api/meals/${meal.id}/image` : null);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <MealStatusBadge status={meal.status} size="lg" />
        <PrototypeBadge label={t('meal.prototypeEstimate')} />
        <span className="text-sm text-ink-500">{t(`mealType.${meal.mealType}`)} · {fmtDate(meal.createdAt, { day: 'numeric', month: 'short' })} {fmtTime(meal.createdAt)}</span>
      </div>
      <p className="text-sm text-ink-600">{t(`${st.key}Desc`)}</p>

      <div className={`grid gap-5 ${img ? 'md:grid-cols-[220px_1fr]' : ''}`}>
        {img && <img src={img} alt={t('meal.photoAlt')} className="h-48 w-full rounded-3xl object-cover shadow-glass md:h-full md:max-h-72" />}
        <section aria-labelledby={`foods-${meal.id}`}>
          <h3 id={`foods-${meal.id}`} className="mb-2 text-lg font-extrabold text-brand-900">{t('meal.detectedFoods')}</h3>
          <ul className="divide-y divide-brand-100 rounded-3xl bg-white/70 ring-1 ring-brand-100">
            {meal.foods.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="font-bold text-brand-950">{bi(f.name)}</p><p className="text-xs text-ink-500">{bi(f.portion)}</p></div><span className="chip bg-amber-50 text-amber-900">{t('meal.carbsShort', { n: Math.round(f.carbs) })}</span></li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby={`nut-${meal.id}`}>
        <h3 id={`nut-${meal.id}`} className="mb-2 text-lg font-extrabold text-brand-900">{t('meal.nutritionTitle')}</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map(({ k, Icon, v, tone }) => (
            <div key={k} className="card !p-4"><div className={`mb-2 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white`}><Icon className="h-5 w-5" aria-hidden /></div>
              <p className="text-sm font-semibold text-ink-500">{t(`meal.${k}`)}</p><p className="text-3xl font-extrabold text-brand-950">{Math.round(v)}<span className="ms-1 text-base font-bold text-ink-400">{t('unit.g')}</span></p></div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-500">{t('meal.estimateNote')}{meal.estimateMode === 'demo' && meal.source !== 'demo' ? ` ${t('meal.demoStandIn')}` : ''}</p>
      </section>

      <section className={`rounded-3xl p-5 ring-1 ${st.cls}`} aria-labelledby={`why-${meal.id}`}>
        <h3 id={`why-${meal.id}`} className="text-lg font-extrabold">{t(meal.status === 'GREEN' ? 'meal.looksBalanced' : 'meal.why')}</h3>
        <p className="mt-1 leading-relaxed">{bi(meal.reason)}</p>
        {meal.suggestions.length > 0 && (<>
          <h3 className="mt-4 flex items-center gap-2 text-lg font-extrabold"><Lightbulb className="h-5 w-5" aria-hidden />{t('meal.suggested')}</h3>
          <ul className="mt-1 list-disc space-y-1 ps-5 leading-relaxed">{meal.suggestions.map((s, i) => <li key={i}>{bi(s)}</li>)}</ul>
        </>)}
      </section>
      <p className="flex items-start gap-2 text-xs text-ink-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" aria-hidden />{audience === 'nurse' ? t('meal.safetyNurse') : t('meal.safetyParent')}</p>
    </div>
  );
}
