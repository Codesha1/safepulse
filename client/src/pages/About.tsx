import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Brain, Rocket, Gauge, ShieldCheck, Cloud, Stethoscope, Building2, LineChart, Accessibility, Home } from 'lucide-react';
import { PublicShell } from '../layouts/PublicShell';
import { useI18n } from '../i18n';
import { SafePulseCore } from '../components/SafePulseCore';
import { BrandAsset } from '../components/Brand';

const NEXT = [
  { k: 'ai', Icon: Brain }, { k: 'portion', Icon: Gauge }, { k: 'monitor', Icon: LineChart }, { k: 'cloud', Icon: Cloud },
  { k: 'pro', Icon: Stethoscope }, { k: 'multi', Icon: Building2 }, { k: 'analytics', Icon: ShieldCheck }, { k: 'a11y', Icon: Accessibility },
];

export default function About() {
  const { t } = useI18n(); const { hash } = useLocation();
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [hash]);
  return (
    <PublicShell wide>
      <div className="space-y-14">
        <section className="grid items-center gap-8 lg:grid-cols-2" aria-labelledby="about-title">
          <div><p className="chip mb-3 bg-brand-100 text-brand-800">{t('brand.prototype')}</p>
            <h1 id="about-title" className="text-4xl font-extrabold tracking-tight text-brand-950 sm:text-5xl">{t('about.title')}</h1>
            <p className="mt-4 text-lg text-ink-600">{t('about.body')}</p>
            <Link to="/login" className="btn-primary mt-6"><Home className="h-5 w-5" aria-hidden />{t('footer.login')}</Link></div>
          <SafePulseCore />
        </section>

        <section id="top-tech" className="glass overflow-hidden rounded-[2rem] scroll-mt-24" aria-labelledby="tt-title">
          <div className="grid items-center md:grid-cols-2">
            <BrandAsset kind="team" className="aspect-[4/3] w-full object-cover md:h-full" />
            <div className="p-8 sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.3em] text-mint-700">Top Tech</p>
              <h2 id="tt-title" className="mt-2 text-3xl font-extrabold text-brand-950">{t('about.builtBy')}</h2>
              <blockquote className="mt-4 border-s-4 border-mint-400 ps-4 text-lg font-medium text-ink-700">{t('about.quote')}</blockquote></div>
          </div>
        </section>

        <section id="whats-next" className="scroll-mt-24" aria-labelledby="wn-title">
          <div className="mb-6 flex flex-wrap items-center gap-3"><h2 id="wn-title" className="flex items-center gap-2 text-3xl font-extrabold text-brand-950"><Rocket className="h-7 w-7 text-brand-600" aria-hidden />{t('about.whatsNext')}</h2><span className="chip bg-amber-100 text-amber-900 ring-1 ring-amber-300">{t('about.futureLabel')}</span></div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NEXT.map(({ k, Icon }) => (<li key={k} className="card"><div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-mint-100 text-brand-700"><Icon className="h-6 w-6" aria-hidden /></div>
              <h3 className="font-extrabold text-brand-900">{t(`next.${k}.title`)}</h3><p className="mt-1 text-sm text-ink-600">{t(`next.${k}.desc`)}</p></li>))}
          </ul>
        </section>
      </div>
    </PublicShell>
  );
}
