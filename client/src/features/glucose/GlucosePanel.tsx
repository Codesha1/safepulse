import { useState, type FormEvent } from 'react';
import { Droplets, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorBanner, Skeleton, Field, Spinner, useToast, InfoBanner } from '../../components/ui';
import { DayTypeChart, GlucoseLineChart, WeeklyOverview } from './charts';
import { errorKey } from '../../utils/errors';
import { glucoseTone } from '../../utils/format';

const CONTEXTS = ['fasting', 'before_meal', 'after_meal', 'before_pe', 'after_pe', 'exam_day', 'other'] as const;

export function GlucosePanel({ studentId, canAdd }: { studentId: number; canAdd: boolean }) {
  const { t, fmtDate, fmtTime } = useI18n(); const toast = useToast();
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useAsync(() => api.glucose(studentId, days), [studentId, days]);
  const [val, setVal] = useState(''); const [ctx, setCtx] = useState<string>('other'); const [busy, setBusy] = useState(false); const [formErr, setFormErr] = useState<string | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault(); setFormErr(null);
    const n = Number(val);
    if (!Number.isInteger(n) || n < 20 || n > 600) { setFormErr(t('glucose.invalid')); return; }
    setBusy(true);
    try { await api.addGlucose(studentId, n, ctx); setVal(''); toast(t('glucose.added')); reload(); }
    catch (x) { toast(t(errorKey(x)), 'err'); } finally { setBusy(false); }
  };

  if (error) return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  const readings = data?.readings ?? []; const latest = readings[readings.length - 1];
  return (
    <div className="space-y-5">
      <InfoBanner>{t('glucose.recordsNote')}</InfoBanner>
      {loading ? <Skeleton className="h-72" /> : !readings.length ? (
        <EmptyState icon={<Droplets className="h-8 w-8" aria-hidden />} title={t('empty.glucose')} hint={t('empty.glucoseHint')} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card"><p className="text-sm font-semibold text-ink-500">{t('glucose.latest')}</p>
              <p className="mt-1 text-4xl font-extrabold text-brand-950">{latest.value}<span className="ms-1 text-base font-bold text-ink-500">{t('unit.mgdl')}</span></p>
              <p className="text-xs text-ink-500">{t('glucose.latestLabel')} · {fmtDate(latest.recordedAt, { day: 'numeric', month: 'short' })} {fmtTime(latest.recordedAt)}</p>
              <span className={`chip mt-2 ${glucoseTone(latest.value) === 'ok' ? 'bg-mint-100 text-mint-800' : 'bg-amber-100 text-amber-900'}`}>{t(`glucose.tone.${glucoseTone(latest.value)}`)}</span></div>
            <div className="card"><p className="text-sm font-semibold text-ink-500">{t('glucose.average')}</p><p className="mt-1 text-4xl font-extrabold text-brand-950">{Math.round(readings.reduce((a, r) => a + r.value, 0) / readings.length)}<span className="ms-1 text-base font-bold text-ink-500">{t('unit.mgdl')}</span></p><p className="text-xs text-ink-500">{t('glucose.readingsCount', { n: readings.length })}</p></div>
            <div className="card"><p className="text-sm font-semibold text-ink-500">{t('glucose.range')}</p><p className="mt-1 text-4xl font-extrabold text-brand-950">{Math.min(...readings.map((r) => r.value))}–{Math.max(...readings.map((r) => r.value))}</p><p className="text-xs text-ink-500">{t('unit.mgdl')}</p></div>
          </div>
          <section className="card" aria-labelledby="g-over-time">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 id="g-over-time" className="text-lg font-extrabold text-brand-900">{t('chart.overTime')}</h3>
              <div role="group" aria-label={t('chart.range')} className="flex gap-1.5">{[7, 14, 30].map((d) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)} className={`btn-sm rounded-xl px-3.5 font-bold ${days === d ? 'bg-brand-700 text-white' : 'bg-white text-brand-800 ring-1 ring-brand-200'}`}>{t('chart.days', { n: d })}</button>)}</div>
            </div>
            <GlucoseLineChart readings={readings} exams={data!.exams} peDays={data!.peDays} days={days} />
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="card" aria-labelledby="g-week"><h3 id="g-week" className="mb-1 text-lg font-extrabold text-brand-900">{t('chart.weekly')}</h3><p className="mb-3 text-xs text-ink-500">{t('chart.weeklyHint')}</p><WeeklyOverview readings={readings} /></section>
            <section className="card" aria-labelledby="g-daytype"><h3 id="g-daytype" className="mb-1 text-lg font-extrabold text-brand-900">{t('chart.dayType')}</h3><p className="mb-3 text-xs text-ink-500">{t('chart.dayTypeHint')}</p><DayTypeChart readings={readings} exams={data!.exams} peDays={data!.peDays} /></section>
          </div>
        </>
      )}
      {canAdd && (
        <form onSubmit={add} noValidate className="card" aria-labelledby="add-g">
          <h3 id="add-g" className="mb-4 flex items-center gap-2 text-lg font-extrabold text-brand-900"><Plus className="h-5 w-5" aria-hidden />{t('glucose.add')}</h3>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label={`${t('glucose.value')} (${t('unit.mgdl')})`} htmlFor="gv" error={formErr} required><input id="gv" inputMode="numeric" className="input" dir="ltr" value={val} onChange={(e) => setVal(e.target.value.replace(/\D/g, '').slice(0, 3))} aria-invalid={!!formErr} aria-describedby={formErr ? 'gv-err' : undefined} /></Field>
            <Field label={t('glucose.context')} htmlFor="gc"><select id="gc" className="input" value={ctx} onChange={(e) => setCtx(e.target.value)}>{CONTEXTS.map((c) => <option key={c} value={c}>{t(`glucose.ctx.${c}`)}</option>)}</select></Field>
            <button className="btn-primary" disabled={busy}>{busy && <Spinner />}{t('common.save')}</button>
          </div>
        </form>
      )}
    </div>
  );
}
