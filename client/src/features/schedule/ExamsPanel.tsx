import { useState, type FormEvent } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorBanner, Field, Skeleton, Spinner, useToast } from '../../components/ui';
import { fmtClock, todayYmd } from '../../utils/format';
import { errorKey } from '../../utils/errors';

export const EXAM_TYPES = ['quiz', 'monthly', 'midterm', 'final', 'other'] as const;

export function ExamsPanel({ studentId, canEdit }: { studentId: number; canEdit: boolean }) {
  const { t, fmtDate, lang, tx } = useI18n(); const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.exams(studentId), [studentId]);
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ subject: '', date: todayYmd(), time: '12:00', type: 'monthly' });
  const add = async (e: FormEvent) => {
    e.preventDefault(); setErr(null);
    if (!f.subject.trim() || !f.date) { setErr(t('errors.required')); return; }
    setBusy(true);
    try { await api.addExam(studentId, { subject: f.subject.trim(), date: f.date, time: f.time, type: t(`examType.${f.type}`) }); toast(t('exams.added')); setF({ ...f, subject: '' }); setShow(false); reload(); }
    catch (x) { toast(t(errorKey(x)), 'err'); } finally { setBusy(false); }
  };
  const remove = async (id: number) => { try { await api.delExam(studentId, id); toast(t('exams.removed')); reload(); } catch (x) { toast(t(errorKey(x)), 'err'); } };
  if (error) return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  if (loading) return <Skeleton className="h-48" />;
  const today = todayYmd(); const all = data?.exams ?? [];
  const upcoming = all.filter((e) => e.date >= today); const past = all.filter((e) => e.date < today).reverse();
  const row = (e: (typeof all)[number], dim = false) => (
    <li key={e.id} className={`flex items-center gap-4 rounded-2xl p-3 ${dim ? 'opacity-70' : 'bg-white/70 ring-1 ring-brand-100'}`}>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-700"><FileText className="h-6 w-6" aria-hidden /></div>
      <div className="min-w-0 flex-1"><p className="font-bold text-brand-950">{tx('subject', e.subject)}</p><p className="text-sm text-ink-500">{fmtDate(e.date, { weekday: 'long', day: 'numeric', month: 'short' })} · <span dir="ltr">{fmtClock(e.time, lang)}</span>{e.type ? ` · ${tx('examText', e.type)}` : ''}</p></div>
      {canEdit && <button type="button" className="btn-ghost btn-sm !px-2 text-rose-700" onClick={() => remove(e.id)} aria-label={`${t('common.delete')} ${e.subject}`}><Trash2 className="h-5 w-5" aria-hidden /></button>}
    </li>);
  return (
    <div className="space-y-5">
      <section className="card" aria-labelledby="ex-up"><h3 id="ex-up" className="mb-3 text-lg font-extrabold text-brand-900">{t('exams.upcoming')}</h3>
        {upcoming.length ? <ul className="space-y-2">{upcoming.map((e) => row(e))}</ul> : <EmptyState icon={<FileText className="h-8 w-8" aria-hidden />} title={t('empty.exams')} hint={t('empty.examsHint')} />}</section>
      {past.length > 0 && <section className="card" aria-labelledby="ex-past"><h3 id="ex-past" className="mb-3 text-lg font-extrabold text-brand-900">{t('exams.past')}</h3><ul className="space-y-2">{past.slice(0, 8).map((e) => row(e, true))}</ul></section>}
      {canEdit && (show ? (
        <form onSubmit={add} noValidate className="card space-y-4" aria-labelledby="add-ex"><h3 id="add-ex" className="text-lg font-extrabold text-brand-900">{t('exams.add')}</h3>
          {err && <p role="alert" className="text-sm font-semibold text-rose-700">{err}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('field.subject')} htmlFor="ex-sub" required><input id="ex-sub" className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} maxLength={80} /></Field>
            <Field label={t('field.examType')} htmlFor="ex-type"><select id="ex-type" className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{EXAM_TYPES.map((x) => <option key={x} value={x}>{t(`examType.${x}`)}</option>)}</select></Field>
            <Field label={t('field.date')} htmlFor="ex-date" required><input id="ex-date" type="date" className="input" dir="ltr" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label={t('field.time')} htmlFor="ex-time"><input id="ex-time" type="time" className="input" dir="ltr" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
          </div>
          <div className="flex gap-3"><button className="btn-primary" disabled={busy}>{busy && <Spinner />}{t('common.save')}</button><button type="button" className="btn-soft" onClick={() => setShow(false)}>{t('common.cancel')}</button></div>
        </form>
      ) : <button type="button" className="btn-soft" onClick={() => setShow(true)}><Plus className="h-5 w-5" aria-hidden />{t('exams.add')}</button>)}
    </div>
  );
}
