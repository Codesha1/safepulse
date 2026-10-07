import { useMemo, useState, type FormEvent } from 'react';
import { BookOpen, Dumbbell, Coffee, Utensils, FileText, PartyPopper, CircleDot, Plus, Trash2, CalendarDays } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorBanner, Field, Skeleton, Spinner, useToast } from '../../components/ui';
import { DAY_KEYS, SCHOOL_DAY_INDEXES, dateOfNextWeekday, fmtClock } from '../../utils/format';
import { errorKey } from '../../utils/errors';

export const ACTIVITY_TYPES = ['class', 'pe', 'break', 'lunch', 'exam', 'event', 'other'] as const;
const ICONS: Record<string, { Icon: typeof BookOpen; cls: string }> = {
  class: { Icon: BookOpen, cls: 'bg-brand-100 text-brand-700' }, pe: { Icon: Dumbbell, cls: 'bg-mint-100 text-mint-700' }, break: { Icon: Coffee, cls: 'bg-sky-100 text-sky-700' },
  lunch: { Icon: Utensils, cls: 'bg-amber-100 text-amber-700' }, exam: { Icon: FileText, cls: 'bg-rose-100 text-rose-700' }, event: { Icon: PartyPopper, cls: 'bg-fuchsia-100 text-fuchsia-700' }, other: { Icon: CircleDot, cls: 'bg-slate-100 text-slate-600' },
};
export const typeIcon = (t: string) => ICONS[t] ?? ICONS.other;

interface Row { key: string; start: string; end: string | null; subject: string; classroom: string | null; type: string; id?: number; exam?: boolean }

export function SchedulePanel({ studentId, canEdit }: { studentId: number; canEdit: boolean }) {
  const { t, lang, tx, place } = useI18n(); const toast = useToast();
  const { data, loading, error, reload } = useAsync(async () => { const [s, e] = await Promise.all([api.schedule(studentId), api.exams(studentId)]); return { events: s.events, exams: e.exams }; }, [studentId]);
  const today = new Date().getDay();
  const [day, setDay] = useState<number>(SCHOOL_DAY_INDEXES.includes(today) ? today : 0);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ day: String(day), start: '08:00', end: '', subject: '', classroom: '', type: 'class' }); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);

  const date = dateOfNextWeekday(day);
  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    const base: Row[] = data.events.filter((e) => e.day === day).map((e) => ({ key: 'e' + e.id, id: e.id, start: e.start, end: e.end, subject: tx('subject', e.subject), classroom: e.classroom ? place(e.classroom) : null, type: e.type }));
    const ex: Row[] = data.exams.filter((e) => e.date === date).map((e) => ({ key: 'x' + e.id, start: e.time, end: null, subject: `${tx('subject', e.subject)} — ${t('exams.examWord')}`, classroom: tx('examText', e.type), type: 'exam', exam: true }));
    return [...base, ...ex].sort((a, b) => a.start.localeCompare(b.start));
  }, [data, day, date, t, tx, place]);

  const nowT = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
  const isToday = day === today;
  const nextIdx = isToday ? rows.findIndex((r) => r.start > nowT) : -1;
  const curIdx = isToday ? rows.findIndex((r) => r.start <= nowT && (r.end ? r.end > nowT : false)) : -1;

  const add = async (e: FormEvent) => {
    e.preventDefault(); setErr(null);
    if (!f.subject.trim()) { setErr(t('errors.required')); return; }
    if (f.end && f.end <= f.start) { setErr(t('schedule.timeOrder')); return; }
    setBusy(true);
    try { await api.addEvent(studentId, { day: Number(f.day), start: f.start, end: f.end || null, subject: f.subject.trim(), classroom: f.classroom.trim() || null, type: f.type }); toast(t('schedule.added')); setF({ ...f, subject: '', classroom: '' }); setShowForm(false); reload(); }
    catch (x) { toast(t(errorKey(x)), 'err'); } finally { setBusy(false); }
  };
  const remove = async (id: number) => { try { await api.delEvent(studentId, id); toast(t('schedule.removed')); reload(); } catch (x) { toast(t(errorKey(x)), 'err'); } };

  if (error) return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  if (loading) return <Skeleton className="h-96" />;
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label={t('schedule.days')} className="flex gap-1.5 overflow-x-auto pb-1">
        {SCHOOL_DAY_INDEXES.map((d) => (
          <button key={d} role="tab" aria-selected={day === d} type="button" onClick={() => { setDay(d); setF((s) => ({ ...s, day: String(d) })); }}
            className={`min-h-[48px] min-w-[84px] shrink-0 rounded-2xl px-4 text-sm font-bold ${day === d ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md' : 'bg-white/80 text-brand-800 ring-1 ring-brand-200'}`}>
            {t(`day.${DAY_KEYS[d]}`)}{d === today && <span className="ms-1.5 text-[10px] uppercase opacity-80">{t('schedule.today')}</span>}
          </button>))}
      </div>

      <section className="card" aria-label={t('schedule.timeline')}>
        {!rows.length ? <EmptyState icon={<CalendarDays className="h-8 w-8" aria-hidden />} title={t('empty.schedule')} hint={canEdit ? t('empty.scheduleHintNurse') : t('empty.scheduleHint')} /> : (
          <ol className="relative space-y-1 ps-2">
            {rows.map((r, i) => {
              const { Icon, cls } = typeIcon(r.type); const isCur = i === curIdx; const isNext = i === nextIdx;
              return (
                <li key={r.key} className={`relative flex items-start gap-4 rounded-2xl p-3 ${isCur ? 'bg-mint-50 ring-1 ring-mint-300' : isNext ? 'bg-brand-50 ring-1 ring-brand-200' : ''}`}>
                  <div className="w-[76px] shrink-0 pt-1 text-sm font-extrabold text-brand-900" dir="ltr">{fmtClock(r.start, lang)}{r.end && <span className="block text-xs font-semibold text-ink-400">{fmtClock(r.end, lang)}</span>}</div>
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${cls}`}><Icon className="h-5 w-5" aria-hidden /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-brand-950">{r.subject}</p>
                    <p className="text-sm text-ink-500">{t(`activity.${r.type}`)}{r.classroom ? ` · ${r.classroom}` : ''}</p>
                    {(isCur || isNext) && <span className={`chip mt-1 ${isCur ? 'bg-mint-200 text-mint-800' : 'bg-brand-200 text-brand-800'}`}>{t(isCur ? 'schedule.now' : 'schedule.next')}</span>}
                  </div>
                  {canEdit && r.id && <button type="button" className="btn-ghost btn-sm !px-2 text-rose-700" onClick={() => remove(r.id!)} aria-label={`${t('common.delete')} ${r.subject}`}><Trash2 className="h-5 w-5" aria-hidden /></button>}
                </li>);
            })}
          </ol>)}
      </section>

      {canEdit && (showForm ? (
        <form onSubmit={add} noValidate className="card space-y-4" aria-labelledby="add-ev">
          <h3 id="add-ev" className="text-lg font-extrabold text-brand-900">{t('schedule.add')}</h3>
          {err && <p role="alert" className="text-sm font-semibold text-rose-700">{err}</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t('field.day')} htmlFor="ev-day"><select id="ev-day" className="input" value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })}>{SCHOOL_DAY_INDEXES.map((d) => <option key={d} value={d}>{t(`day.${DAY_KEYS[d]}`)}</option>)}</select></Field>
            <Field label={t('field.startTime')} htmlFor="ev-s"><input id="ev-s" type="time" className="input" dir="ltr" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
            <Field label={t('field.endTime')} htmlFor="ev-e"><input id="ev-e" type="time" className="input" dir="ltr" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
            <Field label={t('field.subject')} htmlFor="ev-sub" required><input id="ev-sub" className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} maxLength={80} /></Field>
            <Field label={t('field.classroom')} htmlFor="ev-room"><input id="ev-room" className="input" value={f.classroom} onChange={(e) => setF({ ...f, classroom: e.target.value })} maxLength={60} /></Field>
            <Field label={t('field.activityType')} htmlFor="ev-type"><select id="ev-type" className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{ACTIVITY_TYPES.map((a) => <option key={a} value={a}>{t(`activity.${a}`)}</option>)}</select></Field>
          </div>
          <div className="flex gap-3"><button className="btn-primary" disabled={busy}>{busy && <Spinner />}{t('common.save')}</button><button type="button" className="btn-soft" onClick={() => setShowForm(false)}>{t('common.cancel')}</button></div>
        </form>
      ) : <button type="button" className="btn-soft" onClick={() => setShowForm(true)}><Plus className="h-5 w-5" aria-hidden />{t('schedule.add')}</button>)}
    </div>
  );
}
