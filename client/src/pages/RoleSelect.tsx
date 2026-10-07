import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Stethoscope, HeartHandshake, ArrowRight, Play } from 'lucide-react';
import { PublicShell } from '../layouts/PublicShell';
import { useI18n } from '../i18n';
import { useAuth } from '../features/auth/AuthContext';
import { SafePulseCore } from '../components/SafePulseCore';
import { Spinner, useToast } from '../components/ui';
import { errorKey } from '../utils/errors';
import type { Role } from '../services/types';

export default function RoleSelect() {
  const { t, tIn } = useI18n(); const { demoMode, demoLogin } = useAuth(); const nav = useNavigate(); const toast = useToast();
  const [busy, setBusy] = useState<Role | null>(null);
  const demo = async (r: Role) => {
    setBusy(r);
    try { await demoLogin(r); nav(r === 'NURSE' ? '/nurse' : '/parent', { replace: true }); }
    catch (e) { toast(t(errorKey(e)), 'err'); } finally { setBusy(null); }
  };
  const cards = [
    { role: 'NURSE' as Role, to: '/nurse/login', Icon: Stethoscope, k: 'role.nurse', g: 'from-brand-600 to-brand-800', glow: 'hover:shadow-glow' },
    { role: 'PARENT' as Role, to: '/parent/login', Icon: HeartHandshake, k: 'role.parent', g: 'from-mint-500 to-mint-700', glow: 'hover:shadow-mint' },
  ];
  return (
    <PublicShell wide>
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <section aria-labelledby="login-title">
          <p className="chip mb-3 bg-brand-100 text-brand-800">{t('brand.prototype')}</p>
          <h1 id="login-title" className="text-4xl font-extrabold tracking-tight text-brand-950 sm:text-5xl">{t('welcome.title')}</h1>
          <p className="mt-3 max-w-xl text-lg text-ink-600">{t('login.subtitle')}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {cards.map((c) => (
              <Link key={c.role} to={c.to} className={`group card relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 ${c.glow}`}>
                <div className={`mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${c.g} text-white shadow-lg`}><c.Icon className="h-8 w-8" aria-hidden /></div>
                <h2 className="text-2xl font-extrabold text-brand-950">{t(c.k)}</h2>
                <p className="mt-0.5 text-base font-semibold text-ink-500" lang={t('lang.other') === 'ar' ? 'ar' : 'en'}>{tIn(t('lang.other') === 'ar' ? 'ar' : 'en', c.k)}</p>
                <p className="mt-3 text-sm text-ink-600">{t(`${c.k}Desc`)}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 font-bold text-brand-700">{t('login.continueAs')}<ArrowRight className="h-5 w-5 transition group-hover:translate-x-1 rtl-flip rtl:group-hover:-translate-x-1" aria-hidden /></span>
              </Link>
            ))}
          </div>

          {demoMode && (
            <div className="glass mt-6 rounded-3xl p-5" role="group" aria-labelledby="demo-title">
              <h2 id="demo-title" className="flex items-center gap-2 text-lg font-extrabold text-brand-900"><Play className="h-5 w-5 text-mint-600" aria-hidden />{t('demo.explore')}</h2>
              <p className="mt-1 text-sm text-ink-600">{t('demo.exploreHint')}</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => demo('NURSE')} disabled={!!busy} className="btn-primary flex-1">{busy === 'NURSE' ? <Spinner /> : <Stethoscope className="h-5 w-5" aria-hidden />}{t('demo.nurse')}</button>
                <button type="button" onClick={() => demo('PARENT')} disabled={!!busy} className="btn-mint flex-1">{busy === 'PARENT' ? <Spinner /> : <HeartHandshake className="h-5 w-5" aria-hidden />}{t('demo.parent')}</button>
              </div>
            </div>
          )}
        </section>
        <aside className="hidden lg:block" aria-label={t('core.title')}><SafePulseCore /></aside>
      </div>
    </PublicShell>
  );
}
