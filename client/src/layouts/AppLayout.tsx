import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, ScanLine, Users, Bell, Sparkles, LogOut, Home, Utensils, LineChart, CalendarDays, HeartPulse, RotateCcw, Menu } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import { Wordmark, BrandAsset } from '../components/Brand';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AppFooter } from '../components/Footer';
import { Modal, Spinner, useToast } from '../components/ui';
import { errorKey } from '../utils/errors';

interface Item { to: string; labelKey: string; icon: ReactNode; end?: boolean; badge?: boolean }
const ic = 'h-5 w-5';
const NURSE_ITEMS: Item[] = [
  { to: '/nurse', labelKey: 'nav.dashboard', icon: <LayoutDashboard className={ic} aria-hidden />, end: true },
  { to: '/nurse/register', labelKey: 'nav.register', icon: <UserPlus className={ic} aria-hidden /> },
  { to: '/nurse/meals', labelKey: 'nav.analyzeMeal', icon: <ScanLine className={ic} aria-hidden /> },
  { to: '/nurse/students', labelKey: 'nav.students', icon: <Users className={ic} aria-hidden /> },
  { to: '/nurse/notifications', labelKey: 'nav.notifications', icon: <Bell className={ic} aria-hidden />, badge: true },
  { to: '/nurse/insights', labelKey: 'nav.insights', icon: <Sparkles className={ic} aria-hidden /> },
];
const PARENT_ITEMS: Item[] = [
  { to: '/parent', labelKey: 'nav.home', icon: <Home className={ic} aria-hidden />, end: true },
  { to: '/parent/meals', labelKey: 'nav.meals', icon: <Utensils className={ic} aria-hidden /> },
  { to: '/parent/trends', labelKey: 'nav.trends', icon: <LineChart className={ic} aria-hidden /> },
  { to: '/parent/schedule', labelKey: 'nav.schedule', icon: <CalendarDays className={ic} aria-hidden /> },
  { to: '/parent/wellness', labelKey: 'nav.wellness', icon: <HeartPulse className={ic} aria-hidden /> },
  { to: '/parent/patterns', labelKey: 'nav.patterns', icon: <Sparkles className={ic} aria-hidden /> },
  { to: '/parent/notifications', labelKey: 'nav.notifications', icon: <Bell className={ic} aria-hidden />, badge: true },
];

export function AppLayout({ role }: { role: 'NURSE' | 'PARENT' }) {
  const { user, logout } = useAuth(); const { t } = useI18n(); const nav = useNavigate(); const loc = useLocation(); const toast = useToast();
  const items = role === 'NURSE' ? NURSE_ITEMS : PARENT_ITEMS;
  const [unread, setUnread] = useState(0); const [confirmReset, setConfirmReset] = useState(false); const [resetting, setResetting] = useState(false);

  const loadUnread = useCallback(() => { api.notifications().then((r) => setUnread(r.unread)).catch(() => {}); }, []);
  useEffect(() => { loadUnread(); }, [loc.pathname, loadUnread]);
  useEffect(() => { const h = () => loadUnread(); window.addEventListener('sp:notifications', h); return () => window.removeEventListener('sp:notifications', h); }, [loadUnread]);

  const doLogout = async () => { await logout(); nav('/login', { replace: true }); };
  const doReset = async () => {
    setResetting(true);
    try { await api.resetDemo(); toast(t('demo.resetDone')); setConfirmReset(false); nav('/nurse', { replace: true }); window.location.reload(); }
    catch (e) { toast(t(errorKey(e)), 'err'); } finally { setResetting(false); }
  };

  const link = (it: Item, mobile = false) => (
    <NavLink key={it.to} to={it.to} end={it.end}
      className={({ isActive }) => mobile
        ? `relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-bold ${isActive ? 'text-brand-700' : 'text-ink-500'}`
        : `relative flex min-h-[48px] items-center gap-3 rounded-2xl px-4 text-[15px] font-semibold transition ${isActive ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md' : 'text-brand-900 hover:bg-brand-100/80'}`}>
      {it.icon}<span className={mobile ? 'max-w-full truncate' : ''}>{t(it.labelKey)}</span>
      {it.badge && unread > 0 && <span className={`absolute grid h-5 min-w-[20px] place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white ${mobile ? 'end-3 top-1.5' : 'end-3'}`} aria-label={t('nav.unread', { n: unread })}>{unread}</span>}
    </NavLink>
  );

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-[70] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-bold">{t('common.skip')}</a>
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <Wordmark />
          <span className="chip hidden bg-brand-100 text-brand-800 sm:inline-flex">{t(role === 'NURSE' ? 'role.nurseBadge' : 'role.parentBadge')}</span>
          <div className="ms-auto flex items-center gap-2">
            {user?.isDemo && <span className="chip hidden bg-amber-100 text-amber-900 md:inline-flex">{t('demo.badge')}</span>}
            {role === 'NURSE' && user?.isDemo && <button type="button" className="btn-ghost btn-sm hidden md:inline-flex" onClick={() => setConfirmReset(true)}><RotateCcw className="h-4 w-4" aria-hidden />{t('demo.reset')}</button>}
            <LanguageSwitcher />
            <span className="hidden max-w-[180px] truncate text-sm font-semibold text-ink-700 lg:block">{user?.name}</span>
            <button type="button" onClick={doLogout} className="btn-soft btn-sm" aria-label={t('nav.logout')}><LogOut className="h-4 w-4 rtl-flip" aria-hidden /><span className="hidden sm:inline">{t('nav.logout')}</span></button>
          </div>
        </div>
        {role === 'PARENT' && <nav aria-label={t('nav.main')} className="mx-auto hidden max-w-7xl gap-1.5 overflow-x-auto px-4 pb-2.5 md:flex">{items.map((i) => link(i))}</nav>}
      </header>

      <div className={`mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 pb-24 pt-6 md:pb-6 ${role === 'NURSE' ? 'md:grid md:grid-cols-[250px_1fr]' : ''}`}>
        {role === 'NURSE' && (
          <aside className="hidden md:block">
            <nav aria-label={t('nav.main')} className="glass sticky top-24 space-y-1.5 rounded-3xl p-3">{items.map((i) => link(i))}</nav>
            <div className="glass mt-4 flex items-center gap-3 rounded-3xl p-3"><BrandAsset kind="logo" className="h-12 w-12 rounded-xl bg-white object-contain p-1" /><p className="text-xs font-semibold leading-snug text-ink-500">{t('brand.byTopTech')}</p></div>
          </aside>
        )}
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none"><Outlet /></main>
      </div>

      <nav aria-label={t('nav.main')} className="fixed inset-x-0 bottom-0 z-40 flex border-t border-brand-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {(role === 'PARENT' ? items.filter((i) => i.to !== '/parent/patterns' && i.to !== '/parent/meals') : items.filter((i) => i.to !== '/nurse/insights')).map((i) => link(i, true))}
        <MoreMenu role={role} t={t} items={items} />
      </nav>
      <AppFooter />

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title={t('demo.reset')}>
        <p className="text-ink-700">{t('demo.resetConfirm')}</p>
        <div className="mt-5 flex gap-3"><button className="btn-primary" onClick={doReset} disabled={resetting}>{resetting && <Spinner />}{t('demo.resetYes')}</button><button className="btn-soft" onClick={() => setConfirmReset(false)}>{t('common.cancel')}</button></div>
      </Modal>
    </div>
  );
}

function MoreMenu({ role, t, items }: { role: string; t: (k: string) => string; items: Item[] }) {
  const [open, setOpen] = useState(false); const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const hidden = role === 'PARENT' ? items.filter((i) => i.to === '/parent/patterns' || i.to === '/parent/meals') : items.filter((i) => i.to === '/nurse/insights');
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-ink-500" aria-haspopup="dialog"><Menu className="h-5 w-5" aria-hidden />{t('nav.more')}</button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('nav.more')}>
        <div className="grid gap-2">{hidden.map((i) => <NavLink key={i.to} to={i.to} className="flex min-h-[52px] items-center gap-3 rounded-2xl bg-brand-50 px-4 font-bold text-brand-900">{i.icon}{t(i.labelKey)}</NavLink>)}</div>
      </Modal>
    </>
  );
}
