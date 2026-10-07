import { Link } from 'react-router-dom';
import { Droplets, Utensils, CalendarClock, FileText, Bell, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useI18n } from '../../i18n';
import { ChildPage, useChild } from '../../features/parent/ChildPage';
import { NotificationList } from '../../features/notifications/NotificationList';
import { MealStatusBadge, InfoBanner } from '../../components/ui';
import { Sparkline } from '../../features/glucose/charts';
import { api } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { DAY_KEYS, fmtClock, greetingKey } from '../../utils/format';

function Inner() {
  const { child, home } = useChild(); const { user } = useAuth(); const { t, tx, grade, fmtDate, fmtTime, lang } = useI18n();
  const g = child.latestGlucose; const m = child.latestMeal; const na = child.nextActivity; const ex = child.upcomingExam;
  const spark = useAsync(() => api.glucose(child.id, 7), [child.id]);
  const when = (off: number, date: string) => off === 0 ? t('rel.today') : off === 1 ? t('rel.tomorrow') : t(`day.${DAY_KEYS[new Date(date + 'T12:00:00').getDay()]}`);
  const firstName = (user?.name ?? '').replace(/^(Mrs?\.|Ms\.|Dr\.)\s*/i, '');
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-mint-700 p-6 text-white shadow-glow sm:p-8" aria-labelledby="hello">
        <div className="pointer-events-none absolute -end-10 -top-10 h-56 w-56 rounded-full bg-mint-300/25 blur-3xl" aria-hidden />
        <h1 id="hello" className="text-3xl font-extrabold sm:text-4xl">{t(greetingKey())}, {firstName} 💚</h1>
        <p className="mt-2 text-white/85">{t('parent.following', { name: child.name })} · {grade(child.grade)}</p>
        <p className="mt-1 text-sm text-white/70">{t('brand.tagline')}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="card" aria-labelledby="c-g"><div className="mb-2 flex items-center gap-2 text-brand-700"><Droplets className="h-5 w-5" aria-hidden /><h2 id="c-g" className="font-extrabold">{t('parent.latestGlucose')}</h2></div>
          {g ? (<><p className="text-5xl font-extrabold text-brand-950">{g.value}<span className="ms-1 text-base font-bold text-ink-500">{t('unit.mgdl')}</span></p><p className="text-sm font-semibold text-mint-700">{t('glucose.latestLabel')}</p><p className="text-xs text-ink-500">{fmtDate(g.recordedAt, { day: 'numeric', month: 'short' })} · {fmtTime(g.recordedAt)}</p>
            {spark.data && <div className="mt-2"><Sparkline readings={spark.data.readings} /></div>}</>) : <p className="text-ink-500">{t('empty.glucose')}</p>}</section>

        <section className="card" aria-labelledby="c-m"><div className="mb-2 flex items-center gap-2 text-brand-700"><Utensils className="h-5 w-5" aria-hidden /><h2 id="c-m" className="font-extrabold">{t('parent.latestMeal')}</h2></div>
          {m ? (<><MealStatusBadge status={m.status} size="lg" /><p className="mt-3 text-sm text-ink-600">{t(`mealType.${m.mealType}`)} · {fmtDate(m.createdAt, { day: 'numeric', month: 'short' })}</p>
            <Link to="/parent/meals" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">{t('parent.viewMeal')}<ArrowRight className="h-4 w-4 rtl-flip" aria-hidden /></Link></>) : <p className="text-ink-500">{t('empty.meals')}</p>}</section>

        <section className="card" aria-labelledby="c-a"><div className="mb-2 flex items-center gap-2 text-brand-700"><CalendarClock className="h-5 w-5" aria-hidden /><h2 id="c-a" className="font-extrabold">{t('parent.nextActivity')}</h2></div>
          {na ? (<><p className="text-3xl font-extrabold text-brand-950">{tx('subject', na.subject)}</p><p className="mt-1 text-lg font-bold text-mint-700" dir="ltr">{fmtClock(na.start, lang)}</p><p className="text-sm text-ink-500">{when(na.dayOffset, na.date)}</p></>) : <p className="text-ink-500">{t('empty.schedule')}</p>}
          <Link to="/parent/schedule" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">{t('parent.fullSchedule')}<ArrowRight className="h-4 w-4 rtl-flip" aria-hidden /></Link></section>

        <section className="card" aria-labelledby="c-e"><div className="mb-2 flex items-center gap-2 text-brand-700"><FileText className="h-5 w-5" aria-hidden /><h2 id="c-e" className="font-extrabold">{t('parent.upcomingExam')}</h2></div>
          {ex ? (<><p className="text-3xl font-extrabold text-brand-950">{tx('subject', ex.subject)}</p><p className="mt-1 text-lg font-bold text-rose-700">{ex.daysUntil === 0 ? t('rel.today') : ex.daysUntil === 1 ? t('rel.tomorrow') : t('rel.inDays', { n: ex.daysUntil })}</p><p className="text-sm text-ink-500">{fmtDate(ex.date, { weekday: 'long', day: 'numeric', month: 'short' })} · <span dir="ltr">{fmtClock(ex.time, lang)}</span></p></>) : <p className="text-ink-500">{t('empty.exams')}</p>}</section>
      </div>

      <section aria-labelledby="c-n">
        <div className="mb-3 flex items-center justify-between"><h2 id="c-n" className="flex items-center gap-2 text-xl font-extrabold text-brand-950"><Bell className="h-5 w-5 text-brand-600" aria-hidden />{t('nav.notifications')}</h2><Link to="/parent/notifications" className="text-sm font-bold text-brand-700 hover:underline">{t('common.viewAll')}</Link></div>
        <NotificationList items={home.notifications.slice(0, 3)} compact />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/parent/wellness" className="card flex items-center gap-4 transition hover:-translate-y-0.5 hover:shadow-mint"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-mint-400 to-mint-600 text-white"><Sparkles className="h-7 w-7" aria-hidden /></div><div><p className="text-lg font-extrabold text-brand-950">{t('wellness.title')}</p><p className="text-sm text-ink-600">{t('wellness.cardHint')}</p></div></Link>
        <Link to="/parent/patterns" className="card flex items-center gap-4 transition hover:-translate-y-0.5 hover:shadow-glow"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white"><ShieldCheck className="h-7 w-7" aria-hidden /></div><div><p className="text-lg font-extrabold text-brand-950">{t('patterns.title')}</p><p className="text-sm text-ink-600">{t('patterns.cardHint')}</p></div></Link>
      </div>
      <InfoBanner>{t('disclaimer.short')}</InfoBanner>
    </div>
  );
}
export default function ParentHome() { return <ChildPage><Inner /></ChildPage>; }
