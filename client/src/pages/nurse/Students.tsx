import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, UserPlus, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorBanner, MealStatusBadge, PageSkeleton, StudentStatusChip } from '../../components/ui';
import { fmtClock, DAY_KEYS } from '../../utils/format';
import type { StudentSummary } from '../../services/types';

const FILTERS = ['all', 'review', 'attention', 'ok', 'none'] as const;

export default function Students() {
  const { t, tx, grade, lang, fmtDate, fmtTime } = useI18n(); const [sp, setSp] = useSearchParams();
  const { data, loading, error, reload } = useAsync(() => api.students(), []);
  const [q, setQ] = useState(''); const [gr, setGr] = useState('all');
  const filter = (FILTERS as readonly string[]).includes(sp.get('filter') || '') ? (sp.get('filter') as (typeof FILTERS)[number]) : 'all';
  const list = data?.students ?? [];
  const grades = useMemo(() => [...new Set(list.map((s) => s.grade.split('-')[0]))].sort(), [list]);
  const rows = useMemo(() => list.filter((s) => {
    if (filter === 'review' && !(s.status === 'review' || s.status === 'attention')) return false;
    if (filter !== 'all' && filter !== 'review' && s.status !== filter) return false;
    if (gr !== 'all' && !s.grade.startsWith(gr)) return false;
    const needle = q.trim().toLowerCase();
    return !needle || s.name.toLowerCase().includes(needle) || s.code.toLowerCase().includes(needle);
  }), [list, q, gr, filter]);

  const nextLabel = (s: StudentSummary) => {
    const n = s.nextActivity; if (!n) return '—';
    const when = n.dayOffset === 0 ? t('rel.today') : n.dayOffset === 1 ? t('rel.tomorrow') : t(`day.${DAY_KEYS[new Date(n.date + 'T12:00:00').getDay()]}`);
    return `${tx('subject', n.subject)} · ${when} ${fmtClock(n.start, lang)}`;
  };
  const gl = (s: StudentSummary) => s.latestGlucose ? <span><b className="text-brand-950">{s.latestGlucose.value}</b> <span className="text-xs text-ink-500">{t('unit.mgdl')}</span><span className="block text-xs text-ink-400">{fmtDate(s.latestGlucose.recordedAt, { day: 'numeric', month: 'short' })} {fmtTime(s.latestGlucose.recordedAt)}</span></span> : <span className="text-ink-400">—</span>;

  if (loading) return <PageSkeleton rows={2} />;
  if (error) return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="h-page">{t('nav.students')}</h1><p className="mt-1 text-ink-600">{t('students.sub', { n: list.length })}</p></div><Link to="/nurse/register" className="btn-primary"><UserPlus className="h-5 w-5" aria-hidden />{t('nav.register')}</Link></div>
      {list.length === 0 ? <EmptyState icon={<Users className="h-8 w-8" aria-hidden />} title={t('empty.students')} hint={t('empty.studentsHint')} action={<Link to="/nurse/register" className="btn-primary">{t('nav.register')}</Link>} /> : (<>
        <div className="card space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_200px]">
            <div className="relative"><label htmlFor="sq" className="sr-only">{t('students.search')}</label><Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" aria-hidden /><input id="sq" type="search" className="input ps-12" placeholder={t('students.search')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div><label htmlFor="gf" className="sr-only">{t('students.gradeFilter')}</label><select id="gf" className="input" value={gr} onChange={(e) => setGr(e.target.value)}><option value="all">{t('students.allGrades')}</option>{grades.map((g) => <option key={g} value={g}>{grade(g)}</option>)}</select></div>
          </div>
          <div role="group" aria-label={t('students.statusFilter')} className="flex flex-wrap gap-2">{FILTERS.map((f) => <button key={f} type="button" aria-pressed={filter === f} onClick={() => setSp(f === 'all' ? {} : { filter: f })} className={`min-h-[44px] rounded-2xl px-4 text-sm font-bold ${filter === f ? 'bg-brand-700 text-white' : 'bg-white text-brand-800 ring-1 ring-brand-200 hover:bg-brand-50'}`}>{t(`filter.${f}`)}</button>)}</div>
        </div>
        {rows.length === 0 ? <EmptyState icon={<Search className="h-8 w-8" aria-hidden />} title={t('empty.noMatch')} hint={t('empty.noMatchHint')} /> : (<>
          <p className="sr-only" role="status">{t('students.results', { n: rows.length })}</p>
          <div className="card hidden overflow-x-auto !p-0 lg:block">
            <table className="w-full text-start text-sm"><caption className="sr-only">{t('nav.students')}</caption>
              <thead className="bg-brand-50 text-xs uppercase tracking-wide text-ink-500"><tr>{['student', 'grade', 'glucose', 'meal', 'next', 'status'].map((c) => <th key={c} scope="col" className="px-4 py-3 text-start font-bold">{t(`students.col.${c}`)}</th>)}</tr></thead>
              <tbody className="divide-y divide-brand-100">{rows.map((s) => (
                <tr key={s.id} className="transition hover:bg-brand-50/70">
                  <td className="px-4 py-3"><Link to={`/nurse/students/${s.id}`} className="font-extrabold text-brand-900 hover:underline">{s.name}</Link><div className="text-xs text-ink-400" dir="ltr">{s.code}</div></td>
                  <td className="px-4 py-3">{grade(s.grade)}</td><td className="px-4 py-3">{gl(s)}</td>
                  <td className="px-4 py-3">{s.lastMeal ? <MealStatusBadge status={s.lastMeal.status} /> : <span className="text-ink-400">—</span>}</td>
                  <td className="px-4 py-3 text-ink-700">{nextLabel(s)}</td><td className="px-4 py-3"><StudentStatusChip status={s.status} /></td>
                </tr>))}</tbody></table>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">{rows.map((s) => (
            <li key={s.id}><Link to={`/nurse/students/${s.id}`} className="card block !p-4 transition active:scale-[.99]">
              <div className="flex items-start justify-between gap-2"><div><p className="font-extrabold text-brand-950">{s.name}</p><p className="text-xs text-ink-500">{grade(s.grade)} · <span dir="ltr">{s.code}</span></p></div><StudentStatusChip status={s.status} /></div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm"><div><dt className="text-xs text-ink-500">{t('students.col.glucose')}</dt><dd>{gl(s)}</dd></div><div><dt className="text-xs text-ink-500">{t('students.col.meal')}</dt><dd>{s.lastMeal ? <MealStatusBadge status={s.lastMeal.status} /> : '—'}</dd></div><div className="col-span-2"><dt className="text-xs text-ink-500">{t('students.col.next')}</dt><dd>{nextLabel(s)}</dd></div></dl></Link></li>))}</ul>
        </>)}
      </>)}
    </div>
  );
}
