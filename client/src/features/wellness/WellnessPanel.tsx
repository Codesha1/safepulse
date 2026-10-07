import { useState } from 'react';
import { Utensils, Droplets, Moon, Dumbbell, Brain, School, RefreshCw, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { ErrorBanner, InfoBanner, Skeleton, Spinner, useToast } from '../../components/ui';

const CATS = [
  { k: 'meals', Icon: Utensils, g: 'from-amber-400 to-orange-500' }, { k: 'hydration', Icon: Droplets, g: 'from-sky-400 to-blue-600' }, { k: 'sleep', Icon: Moon, g: 'from-indigo-400 to-brand-700' },
  { k: 'activity', Icon: Dumbbell, g: 'from-mint-400 to-mint-600' }, { k: 'stress', Icon: Brain, g: 'from-fuchsia-400 to-brand-600' }, { k: 'school', Icon: School, g: 'from-brand-500 to-brand-800' },
] as const;

export function WellnessPanel({ studentId }: { studentId: number }) {
  const { t, bi, fmtDate, fmtTime } = useI18n(); const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.wellness(studentId), [studentId]);
  const [regen, setRegen] = useState(false);
  const again = async () => { setRegen(true); try { await new Promise((r) => setTimeout(r, 700)); await reload(); toast(t('wellness.updated')); } finally { setRegen(false); } };
  if (error) return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  return (
    <div className="space-y-5">
      <InfoBanner tone="mint">{t('wellness.intro')}</InfoBanner>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink-500"><Sparkles className="h-4 w-4 text-brand-600" aria-hidden />{data ? t('wellness.generated', { d: `${fmtDate(data.generatedAt, { day: 'numeric', month: 'short' })} ${fmtTime(data.generatedAt)}` }) : t('common.loading')}</p>
        <button type="button" className="btn-soft btn-sm" onClick={again} disabled={regen || loading}>{regen ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" aria-hidden />}{t('wellness.refresh')}</button>
      </div>
      {loading || regen ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{CATS.map((c) => <Skeleton key={c.k} className="h-44" />)}</div> : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATS.map(({ k, Icon, g }) => (
            <li key={k} className="card"><div className="mb-3 flex items-center gap-3"><div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${g} text-white shadow`}><Icon className="h-6 w-6" aria-hidden /></div><h3 className="text-lg font-extrabold text-brand-950">{t(`wellness.${k}`)}</h3></div>
              <ul className="list-disc space-y-2 ps-5 text-ink-700 marker:text-mint-500">{data!.plan[k].map((s, i) => <li key={i}>{bi(s)}</li>)}</ul></li>))}
        </ul>)}
      {data && <p className="text-xs text-ink-500">{bi(data.footer)}</p>}
    </div>
  );
}
