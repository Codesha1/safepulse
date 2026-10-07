import { Link } from 'react-router-dom';
import { Users, Eye, CalendarCheck, Bell, UserPlus, ScanLine, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useI18n } from '../../i18n';
import { api } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { ErrorBanner, PageSkeleton, StatCard, StudentStatusChip, EmptyState, InfoBanner } from '../../components/ui';
import { greetingKey } from '../../utils/format';

export default function NurseDashboard() {
  const { t, grade } = useI18n(); const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.dashboard(), []);
  if (loading) return <PageSkeleton rows={2} />;
  if (error || !data) return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  const actions = [
    { to: '/nurse/register', Icon: UserPlus, k: 'register', g: 'from-brand-500 to-brand-800', sh: 'hover:shadow-glow' },
    { to: '/nurse/meals', Icon: ScanLine, k: 'analyze', g: 'from-mint-400 to-mint-700', sh: 'hover:shadow-mint' },
    { to: '/nurse/students', Icon: Users, k: 'students', g: 'from-fuchsia-500 to-brand-700', sh: 'hover:shadow-glow' },
    { to: '/nurse/notifications', Icon: Bell, k: 'notifications', g: 'from-amber-400 to-orange-500', sh: 'hover:shadow-glass' },
    { to: '/nurse/insights', Icon: Sparkles, k: 'insights', g: 'from-sky-400 to-brand-600', sh: 'hover:shadow-glow' },
  ];
  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-mint-700 p-6 text-white shadow-glow sm:p-8" aria-labelledby="nd-title">
        <div className="pointer-events-none absolute -end-12 -top-12 h-60 w-60 rounded-full bg-mint-300/25 blur-3xl" aria-hidden />
        <p className="text-sm font-semibold text-white/80">{t(greetingKey())}, {user?.name}</p>
        <h1 id="nd-title" className="mt-1 text-3xl font-extrabold sm:text-4xl">{t('nurse.dashboard')}</h1>
        <p className="mt-1 text-white/80">{t('nurse.dashboardSub')}</p>
      </section>

      <section aria-label={t('nurse.overview')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/nurse/students" className="block"><StatCard icon={<Users className="h-7 w-7" aria-hidden />} label={t('nurse.totalStudents')} value={data.totalStudents} /></Link>
        <Link to="/nurse/students?filter=review" className="block"><StatCard tone="amber" icon={<Eye className="h-7 w-7" aria-hidden />} label={t('nurse.needsReview')} value={data.needsReview} /></Link>
        <Link to="/nurse/students" className="block"><StatCard tone="mint" icon={<CalendarCheck className="h-7 w-7" aria-hidden />} label={t('nurse.todaysActivities')} value={data.todaysActivities} hint={t('nurse.todaysHint')} /></Link>
        <Link to="/nurse/notifications" className="block"><StatCard tone="rose" icon={<Bell className="h-7 w-7" aria-hidden />} label={t('nav.notifications')} value={data.notifications} /></Link>
      </section>

      <section aria-labelledby="qa"><h2 id="qa" className="mb-3 text-xl font-extrabold text-brand-950">{t('nurse.quickActions')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map(({ to, Icon, k, g, sh }) => (
            <Link key={k} to={to} className={`group card flex min-h-[132px] items-center gap-5 transition duration-300 hover:-translate-y-1 ${sh}`}>
              <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${g} text-white shadow-lg transition group-hover:scale-105`}><Icon className="h-8 w-8" aria-hidden /></div>
              <div className="min-w-0 flex-1"><p className="text-lg font-extrabold text-brand-950">{t(`action.${k}`)}</p><p className="text-sm text-ink-500">{t(`actionHint.${k}`)}</p></div>
              <ArrowRight className="h-5 w-5 shrink-0 text-brand-500 transition group-hover:translate-x-1 rtl-flip" aria-hidden />
            </Link>))}
        </div>
      </section>

      <section aria-labelledby="nr"><h2 id="nr" className="mb-3 text-xl font-extrabold text-brand-950">{t('nurse.needsReviewList')}</h2>
        {data.needsReviewList.length === 0 ? <EmptyState icon={<Eye className="h-8 w-8" aria-hidden />} title={t('empty.needsReview')} hint={t('empty.needsReviewHint')} /> : (
          <ul className="grid gap-3 md:grid-cols-2">{data.needsReviewList.map((s) => (
            <li key={s.id}><Link to={`/nurse/students/${s.id}`} className="card flex min-h-[72px] items-center justify-between gap-3 !p-4 transition hover:-translate-y-0.5 hover:shadow-glow"><div><p className="font-extrabold text-brand-950">{s.name}</p><p className="text-sm text-ink-500">{grade(s.grade)}</p></div><StudentStatusChip status={s.status} /></Link></li>))}</ul>)}
      </section>
      <InfoBanner>{t('disclaimer.short')}</InfoBanner>
    </div>
  );
}
