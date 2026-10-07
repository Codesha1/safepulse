import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ScanLine, User, Stethoscope, Droplets, Utensils, CalendarDays, FileText, Bell, Sparkles, Phone, Mail, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { ErrorBanner, EmptyState, InfoBanner, MealStatusBadge, PageSkeleton, StudentStatusChip, Tabs } from '../../components/ui';
import { GlucosePanel } from '../../features/glucose/GlucosePanel';
import { MealsPanel } from '../../features/meals/MealsPanel';
import { SchedulePanel } from '../../features/schedule/SchedulePanel';
import { ExamsPanel } from '../../features/schedule/ExamsPanel';
import { PatternsPanel } from '../../features/analytics/PatternsPanel';
import { NotificationList } from '../../features/notifications/NotificationList';
import { ApiError } from '../../services/api';
import { DAY_KEYS, fmtClock } from '../../utils/format';

const TABS = ['overview', 'medical', 'glucose', 'meals', 'schedule', 'exams', 'notifications', 'patterns'] as const;
type Tab = (typeof TABS)[number];
const ICONS: Record<Tab, JSX.Element> = {
  overview: <User className="h-4 w-4" aria-hidden />, medical: <Stethoscope className="h-4 w-4" aria-hidden />, glucose: <Droplets className="h-4 w-4" aria-hidden />, meals: <Utensils className="h-4 w-4" aria-hidden />,
  schedule: <CalendarDays className="h-4 w-4" aria-hidden />, exams: <FileText className="h-4 w-4" aria-hidden />, notifications: <Bell className="h-4 w-4" aria-hidden />, patterns: <Sparkles className="h-4 w-4" aria-hidden />,
};
const MED_FIELDS = ['allergies', 'conditions', 'hypoHistory', 'hyperHistory', 'medicationInfo', 'foodRestrictions', 'activityConsiderations', 'emergencyInstructions', 'physicianContact', 'carePlanNotes'] as const;

export default function StudentProfile() {
  const { id } = useParams(); const sid = Number(id); const { t, tx, grade, lang, fmtDate, fmtTime } = useI18n(); const [sp, setSp] = useSearchParams();
  const tab: Tab = (TABS as readonly string[]).includes(sp.get('tab') || '') ? (sp.get('tab') as Tab) : 'overview';
  const { data, loading, error, reload } = useAsync(() => api.student(sid), [sid]);
  const notes = useAsync(() => (tab === 'notifications' ? api.studentNotifications(sid) : Promise.resolve(null)), [sid, tab]);

  if (loading) return <PageSkeleton rows={2} />;
  if (error || !data) {
    if (error instanceof ApiError && error.status === 404) return <EmptyState title={t('profile.notFound')} action={<Link to="/nurse/students" className="btn-primary">{t('nav.students')}</Link>} />;
    return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  }
  const s = data.student;
  const nextText = s.nextActivity ? `${tx('subject', s.nextActivity.subject)} · ${s.nextActivity.dayOffset === 0 ? t('rel.today') : s.nextActivity.dayOffset === 1 ? t('rel.tomorrow') : t(`day.${DAY_KEYS[new Date(s.nextActivity.date + 'T12:00:00').getDay()]}`)} ${fmtClock(s.nextActivity.start, lang)}` : '—';
  return (
    <div className="space-y-5">
      <Link to="/nurse/students" className="btn-ghost btn-sm -ms-2"><ArrowLeft className="h-4 w-4 rtl-flip" aria-hidden />{t('nav.students')}</Link>
      <header className="card flex flex-wrap items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-mint-500 text-2xl font-extrabold text-white">{s.name.charAt(0)}</div>
        <div className="min-w-0 flex-1"><h1 className="text-2xl font-extrabold text-brand-950 sm:text-3xl">{s.name}</h1><p className="text-ink-500">{grade(s.grade)} · <span dir="ltr">{s.code}</span>{s.diabetesType ? ` · ${t(`diabetes.${s.diabetesType}`)}` : ''}</p></div>
        <StudentStatusChip status={s.status} />
        <Link to={`/nurse/meals?student=${s.id}`} className="btn-mint"><ScanLine className="h-5 w-5" aria-hidden />{t('action.analyze')}</Link>
      </header>
      <Tabs label={t('profile.sections')} value={tab} onChange={(v) => setSp(v === 'overview' ? {} : { tab: v })} tabs={TABS.map((x) => ({ id: x, label: t(`tabs.${x}`), icon: ICONS[x] }))} />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-5">
        {tab === 'overview' && (<>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="card"><p className="text-sm font-semibold text-ink-500">{t('glucose.latest')}</p>{s.latestGlucose ? <><p className="text-4xl font-extrabold text-brand-950">{s.latestGlucose.value}<span className="ms-1 text-base text-ink-500">{t('unit.mgdl')}</span></p><p className="text-xs text-ink-500">{fmtDate(s.latestGlucose.recordedAt, { day: 'numeric', month: 'short' })} {fmtTime(s.latestGlucose.recordedAt)}</p></> : <p className="mt-2 text-ink-400">—</p>}</div>
            <div className="card"><p className="mb-2 text-sm font-semibold text-ink-500">{t('students.col.meal')}</p>{s.lastMeal ? <><MealStatusBadge status={s.lastMeal.status} size="lg" /><p className="mt-2 text-xs text-ink-500">{fmtDate(s.lastMeal.createdAt, { day: 'numeric', month: 'short' })}</p></> : <p className="text-ink-400">{t('empty.meals')}</p>}</div>
            <div className="card"><p className="text-sm font-semibold text-ink-500">{t('students.col.next')}</p><p className="mt-1 text-xl font-extrabold text-brand-950">{nextText}</p></div>
            <div className="card"><p className="text-sm font-semibold text-ink-500">{t('field.diagnosisDate')}</p><p className="mt-1 text-xl font-extrabold text-brand-950">{s.diagnosisDate ? fmtDate(s.diagnosisDate) : '—'}</p></div>
          </div>
          {s.parent && <section className="card" aria-labelledby="pi"><h2 id="pi" className="mb-3 flex items-center gap-2 text-lg font-extrabold text-brand-900"><Shield className="h-5 w-5" aria-hidden />{t('profile.parent')}</h2>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm"><div><dt className="text-ink-500">{t('field.parentName')}</dt><dd className="font-bold">{s.parent.name}</dd></div><div><dt className="text-ink-500">{t('field.relationship')}</dt><dd className="font-bold">{s.parent.relationship ? t(`relationship.${s.parent.relationship.toLowerCase()}`) : '—'}</dd></div>
              <div><dt className="flex items-center gap-1 text-ink-500"><Mail className="h-3.5 w-3.5" aria-hidden />{t('field.email')}</dt><dd className="break-all font-bold" dir="ltr">{s.parent.email}</dd></div><div><dt className="flex items-center gap-1 text-ink-500"><Phone className="h-3.5 w-3.5" aria-hidden />{t('field.phone')}</dt><dd className="font-bold" dir="ltr">{s.parent.phone || '—'}</dd></div>
              <div><dt className="text-ink-500">{t('field.preferredContact')}</dt><dd className="font-bold">{s.parent.preferredContact ? t(`contact.${s.parent.preferredContact}`) : '—'}</dd></div><div><dt className="text-ink-500">{t('field.emergencyContact')}</dt><dd className="font-bold">{s.parent.emergencyContact || '—'}</dd></div></dl></section>}
        </>)}
        {tab === 'medical' && (<>
          <InfoBanner tone="amber">{t('medical.note')}</InfoBanner>
          <div className="grid gap-4 md:grid-cols-2">{MED_FIELDS.map((k) => (<section key={k} className="card !p-4"><h3 className="text-sm font-bold text-ink-500">{t(`medical.${k}`)}</h3><p className="mt-1 whitespace-pre-wrap text-ink-800">{s.medical?.[k] || <span className="text-ink-400">{t('medical.notEntered')}</span>}</p></section>))}</div>
        </>)}
        {tab === 'glucose' && <GlucosePanel studentId={sid} canAdd />}
        {tab === 'meals' && <MealsPanel studentId={sid} audience="nurse" />}
        {tab === 'schedule' && <SchedulePanel studentId={sid} canEdit />}
        {tab === 'exams' && <ExamsPanel studentId={sid} canEdit />}
        {tab === 'notifications' && (notes.loading ? <PageSkeleton rows={1} /> : notes.error ? <ErrorBanner message={t('errors.generic')} onRetry={notes.reload} /> : <><InfoBanner>{t('profile.notifNote')}</InfoBanner><NotificationList items={notes.data?.notifications ?? []} /></>)}
        {tab === 'patterns' && <PatternsPanel studentId={sid} />}
      </div>
    </div>
  );
}
