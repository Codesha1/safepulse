import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n';
import { useAuth } from '../features/auth/AuthContext';
import { homeFor } from '../features/auth/ProtectedRoute';
import { BrandAsset, PulseMark } from '../components/Brand';
import { Particles, PulseLine } from '../components/Particles';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const INTRO_MS = 5000;
const SEEN = 'sp_intro_seen';

export default function Welcome() {
  const { tIn, t } = useI18n(); const nav = useNavigate(); const { user, loading } = useAuth();
  const seen = (() => { try { return sessionStorage.getItem(SEEN) === '1'; } catch { return false; } })();
  const [done, setDone] = useState(false); const go = useRef(false);

  const proceed = () => {
    if (go.current) return; go.current = true;
    try { sessionStorage.setItem(SEEN, '1'); } catch { /* ignore */ }
    nav('/login', { replace: true });
  };
  useEffect(() => {
    if (seen) return;
    const id = setTimeout(() => { setDone(true); proceed(); }, INTRO_MS);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') proceed(); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(id); window.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (seen) return loading ? null : <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
  const d = (ms: number) => ({ animationDelay: `${ms}ms` });

  return (
    <main className="intro-bg relative grid min-h-screen place-items-center overflow-hidden px-5 py-10 text-white" aria-labelledby="intro-title">
      <Particles tone="dark" density={64} />
      <div className="pointer-events-none absolute -top-24 start-[-8%] h-[420px] w-[420px] rounded-full bg-brand-500/30 blur-3xl animate-float" aria-hidden />
      <div className="pointer-events-none absolute -bottom-28 end-[-6%] h-[460px] w-[460px] rounded-full bg-mint-400/25 blur-3xl animate-float [animation-delay:2s]" aria-hidden />
      <div className="absolute end-4 top-4 z-20"><LanguageSwitcher dark /></div>

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <div className="animate-rise flex items-center gap-4 sm:gap-6" style={d(100)}>
          <BrandAsset kind="team" className="h-28 w-28 rounded-[2rem] bg-white/15 object-cover shadow-glow ring-2 ring-white/50 sm:h-40 sm:w-40" />
          <BrandAsset kind="logo" className="h-20 w-20 rounded-full bg-white object-contain p-2 shadow-mint ring-2 ring-white/60 sm:h-28 sm:w-28" />
        </div>

        <p className="animate-rise mt-6 text-sm font-bold uppercase tracking-[0.35em] text-mint-200 sm:text-base" style={d(500)}>Top Tech</p>

        <div className="animate-rise relative mt-3" style={d(800)}>
          <span className="absolute inset-0 -z-10 mx-auto h-24 w-24 rounded-full bg-brand-400/40 blur-2xl animate-pulse" aria-hidden />
          <h1 id="intro-title" className="flex items-center justify-center gap-3 text-5xl font-extrabold tracking-tight sm:text-7xl">
            <PulseMark className="h-12 w-12 sm:h-16 sm:w-16" /><span>Safe<span className="bg-gradient-to-r from-mint-200 to-mint-400 bg-clip-text text-transparent">Pulse</span></span>
          </h1>
        </div>

        <PulseLine className="animate-rise mt-4 h-14 w-full max-w-xl" loop />

        <div className="animate-rise mt-3 space-y-1" style={d(1300)}>
          <p lang="ar" dir="rtl" className="font-arabic text-2xl font-bold sm:text-3xl">{tIn('ar', 'welcome.title')}</p>
          <p lang="en" dir="ltr" className="text-xl font-semibold text-white/90 sm:text-2xl">{tIn('en', 'welcome.title')}</p>
        </div>
        <div className="animate-rise mt-4 glass-dark rounded-2xl px-6 py-3" style={d(1800)}>
          <p lang="en" dir="ltr" className="text-base font-bold text-mint-100 sm:text-lg">{tIn('en', 'brand.tagline')}</p>
          <p lang="ar" dir="rtl" className="font-arabic text-base text-white/90 sm:text-lg">{tIn('ar', 'brand.tagline')}</p>
        </div>

        <div className="animate-rise mt-8 flex w-full max-w-xs flex-col items-center gap-3" style={d(2200)}>
          <button type="button" onClick={proceed} className="btn min-w-[220px] bg-white text-brand-900 shadow-xl hover:bg-mint-50">
            <span lang="en" dir="ltr">{tIn('en', 'welcome.continue')}</span><span aria-hidden>·</span><span lang="ar" dir="rtl" className="font-arabic">{tIn('ar', 'welcome.continue')}</span><ArrowRight className="h-5 w-5 rtl-flip" aria-hidden />
          </button>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label={t('welcome.loading')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={done ? 100 : undefined}>
            <div className="h-full rounded-full bg-gradient-to-r from-brand-300 to-mint-300" style={{ animation: `progress ${INTRO_MS}ms linear forwards` }} />
          </div>
        </div>
      </div>
    </main>
  );
}
