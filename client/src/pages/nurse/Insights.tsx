import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorBanner, PageSkeleton } from '../../components/ui';
import { PatternsPanel } from '../../features/analytics/PatternsPanel';
import { GlucosePanel } from '../../features/glucose/GlucosePanel';

export default function NurseInsights() {
  const { t, grade } = useI18n();
  const { data, loading, error, reload } = useAsync(() => api.students(), []);
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => { if (data?.students.length && sel === null) setSel(data.students[0].id); }, [data, sel]);
  if (loading) return <PageSkeleton rows={2} />;
  if (error || !data) return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  if (!data.students.length) return <EmptyState icon={<Users className="h-8 w-8" aria-hidden />} title={t('empty.students')} hint={t('empty.studentsHint')} />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="h-page">{t('nav.insights')}</h1><p className="mt-1 text-ink-600">{t('insights.sub')}</p></div>
        <div><label htmlFor="ins-s" className="label">{t('insights.student')}</label><select id="ins-s" className="input min-w-[240px]" value={sel ?? ''} onChange={(e) => setSel(Number(e.target.value))}>{data.students.map((s) => <option key={s.id} value={s.id}>{s.name} · {grade(s.grade)}</option>)}</select></div></div>
      {sel && (<><section aria-labelledby="ins-p"><h2 id="ins-p" className="mb-3 text-xl font-extrabold text-brand-950">{t('patterns.title')}</h2><PatternsPanel key={`p${sel}`} studentId={sel} /></section>
        <section aria-labelledby="ins-g"><h2 id="ins-g" className="mb-3 text-xl font-extrabold text-brand-950">{t('tabs.glucose')}</h2><GlucosePanel key={`g${sel}`} studentId={sel} canAdd={false} /></section></>)}
    </div>
  );
}
