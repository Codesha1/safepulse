import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { Wordmark, BrandAsset } from './Brand';
import { LanguageSwitcher } from './LanguageSwitcher';

export function AppFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-12 border-t border-brand-100 bg-white/60 backdrop-blur" role="contentinfo">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:grid-cols-[1.4fr_1fr_auto] md:items-start">
        <div className="space-y-2">
          <Wordmark />
          <p className="text-sm font-semibold text-brand-800">{t('brand.byTopTech')}</p>
          <p className="text-sm text-ink-500">{t('brand.tagline')}</p>
        </div>
        <nav aria-label={t('footer.nav')} className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-brand-800">
          <Link className="rounded hover:underline" to="/login">{t('footer.login')}</Link>
          <Link className="rounded hover:underline" to="/about">{t('footer.about')}</Link>
          <Link className="rounded hover:underline" to="/about#whats-next">{t('footer.whatsNext')}</Link>
          <Link className="rounded hover:underline" to="/about#top-tech">{t('footer.topTech')}</Link>
        </nav>
        <div className="flex items-center gap-4 md:flex-col md:items-end">
          <LanguageSwitcher />
          <BrandAsset kind="logo" className="h-14 w-14 rounded-2xl bg-white object-contain p-1 shadow ring-1 ring-brand-100" />
        </div>
      </div>
      <p className="border-t border-brand-100 px-5 py-4 text-center text-xs leading-relaxed text-ink-500">{t('disclaimer.full')}</p>
    </footer>
  );
}
