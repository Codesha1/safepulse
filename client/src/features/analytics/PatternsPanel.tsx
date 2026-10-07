import { CalendarClock, Clock, Dumbbell, Sparkles, Utensils, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorBanner, InfoBanner, Skeleton } from '../../components/ui';

const ICON: Record<string, typeof Clock> = { exam: FileText, pe: Dumbbell, clock: Clock, meal: Utensils };

export function PatternsPanel({ studentId }: { studentId: number }) {
  const { t, bi } = useI18n();
  const { data, loading, error, reload } = useAsync(() => api.patterns(studentId), [studentId]);
  if (error) return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  if (loading) return <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;
  return (
    <div className="space-y-4">
      <InfoBanner tone="amber"><b>{t('patterns.label')}</b> {t('patterns.noCausation')}</InfoBanner>
      {!data?.patterns.length ? <EmptyState icon={<Sparkles className="h-8 w-8" aria-hidden />} title={t('patterns.none')} hint={data && !data.enough ? t('patterns.notEnough') : t('patterns.noneHint')} /> : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {data.patterns.map((p) => { const Icon = ICON[p.icon] ?? CalendarClock; return (
            <li key={p.id} className="card">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-mint-500 text-white"><Icon className="h-6 w-6" aria-hidden /></div>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold text-brand-950">{bi(p.title)}</h3><span className={`chip ${p.strength === 'noticeable' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>{t(`patterns.${p.strength}`)}</span></div>
                  <p className="mt-2 text-ink-800">{bi(p.text)}</p><p className="mt-2 rounded-2xl bg-mint-50 px-3 py-2 text-sm text-mint-800">{bi(p.awareness)}</p>
                  <p className="mt-2 text-xs font-semibold text-ink-500">{t('patterns.basedOn', { n: p.n })} · {t('patterns.label')}</p></div>
              </div>
            </li>); })}
        </ul>)}
      <p className="text-xs text-ink-500">{t('patterns.safety')}</p>
    </div>
  );
}
