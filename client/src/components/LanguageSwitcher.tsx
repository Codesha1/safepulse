import { useI18n } from '../i18n';

export function LanguageSwitcher({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  const { lang, setLang, t } = useI18n();
  const base = 'min-h-[40px] min-w-[52px] rounded-full px-3 text-sm font-bold transition';
  const on = dark ? 'bg-white text-brand-900' : 'bg-brand-700 text-white';
  const off = dark ? 'text-white/80 hover:bg-white/15' : 'text-brand-800 hover:bg-brand-100';
  return (
    <div role="group" aria-label={t('lang.switch')} className={`inline-flex items-center rounded-full p-1 ${dark ? 'glass-dark' : 'bg-white/80 ring-1 ring-brand-200'} ${className}`}>
      <button type="button" lang="en" dir="ltr" aria-pressed={lang === 'en'} onClick={() => setLang('en')} className={`${base} ${lang === 'en' ? on : off}`}>EN</button>
      <button type="button" lang="ar" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')} className={`${base} ${lang === 'ar' ? on : off}`}>العربية</button>
    </div>
  );
}
