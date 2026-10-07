import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { PublicShell } from '../layouts/PublicShell';
import { useI18n } from '../i18n';

export default function NotFound() {
  const { t } = useI18n();
  return (<PublicShell><div className="card mx-auto max-w-md text-center"><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Compass className="h-8 w-8" aria-hidden /></div>
    <h1 className="text-2xl font-extrabold text-brand-950">{t('notFound.title')}</h1><p className="mt-2 text-ink-600">{t('notFound.body')}</p><Link to="/login" className="btn-primary mt-6">{t('notFound.home')}</Link></div></PublicShell>);
}
