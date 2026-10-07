import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../components/Brand';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AppFooter } from '../components/Footer';
import { Particles } from '../components/Particles';
import { useI18n } from '../i18n';

export function PublicShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="app-bg relative flex min-h-screen flex-col overflow-hidden">
      <Particles tone="light" density={34} />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-[70] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-bold">{t('common.skip')}</a>
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4">
        <Link to="/login" aria-label="SafePulse"><Wordmark /></Link>
        <LanguageSwitcher />
      </header>
      <main id="main" tabIndex={-1} className={`relative z-10 mx-auto w-full flex-1 px-5 py-6 outline-none ${wide ? 'max-w-7xl' : 'max-w-5xl'}`}>{children}</main>
      <div className="relative z-10"><AppFooter /></div>
    </div>
  );
}
