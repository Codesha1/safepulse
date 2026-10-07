import { useState } from 'react';
import { ChevronDown, Utensils } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorBanner, MealStatusBadge, Skeleton } from '../../components/ui';
import { CarbChart } from '../glucose/charts';
import { MealResult } from './MealResult';
import type { Meal } from '../../services/types';

export function MealsPanel({ studentId, audience }: { studentId: number; audience: 'nurse' | 'parent' }) {
  const { t, bi, fmtDate, fmtTime } = useI18n();
  const { data, loading, error, reload } = useAsync(() => api.meals(studentId), [studentId]);
  const [open, setOpen] = useState<number | null>(null);
  if (error) return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  if (loading) return <div className="space-y-3"><Skeleton className="h-64" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;
  const meals: Meal[] = data?.meals ?? [];
  if (!meals.length) return <EmptyState icon={<Utensils className="h-8 w-8" aria-hidden />} title={t('empty.meals')} hint={t('empty.mealsHint')} />;
  return (
    <div className="space-y-5">
      <section className="card" aria-labelledby="carb-t"><h3 id="carb-t" className="text-lg font-extrabold text-brand-900">{t('chart.carbTitle')}</h3><p className="mb-3 text-xs text-ink-500">{t('chart.carbHint')}</p><CarbChart meals={meals.slice(0, 14)} /></section>
      <ul className="space-y-3">
        {meals.map((m, idx) => {
          const isOpen = open === m.id || (open === null && idx === 0 && audience === 'parent');
          return (
            <li key={m.id} className="card !p-0 overflow-hidden">
              <button type="button" className="flex w-full min-h-[64px] items-center gap-3 px-5 py-4 text-start" aria-expanded={isOpen} aria-controls={`meal-${m.id}`} onClick={() => setOpen(isOpen ? -1 : m.id)}>
                <MealStatusBadge status={m.status} />
                <div className="min-w-0 flex-1"><p className="truncate font-bold text-brand-950">{m.foods.map((f) => bi(f.name)).join(' · ')}</p><p className="text-xs text-ink-500">{t(`mealType.${m.mealType}`)} · {fmtDate(m.createdAt, { day: 'numeric', month: 'short' })} {fmtTime(m.createdAt)} · {t('meal.carbsShort', { n: Math.round(m.nutrition.carbs) })}</p></div>
                <ChevronDown className={`h-5 w-5 shrink-0 text-brand-600 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {isOpen && <div id={`meal-${m.id}`} className="border-t border-brand-100 p-5"><MealResult meal={m} audience={audience} /></div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
