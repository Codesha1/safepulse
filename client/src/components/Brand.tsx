import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import { GraduationCap, Users } from 'lucide-react';
import { useI18n } from '../i18n';

/** SafePulse mark: gradient tile with an ECG pulse. */
export function PulseMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="SafePulse">
      <defs><linearGradient id="spm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#10b981" /></linearGradient></defs>
      <rect width="64" height="64" rx="16" fill="url(#spm)" />
      <path d="M8 34h13l5-12 9 24 6-16 3 4h12" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function Wordmark({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <PulseMark className="h-9 w-9" />
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-900'}`}>Safe<span className={light ? 'text-mint-300' : 'text-mint-600'}>Pulse</span></span>
    </span>
  );
}

let brandPromise: ReturnType<typeof api.brand> | null = null;
const getBrand = () => (brandPromise ??= api.brand().catch(() => ({ team: null, logo: null })));

/**
 * Shows YOUR uploaded image (client/public/assets/team.* and logo.*, see README there).
 * If the file isn't there yet, a neutral labelled placeholder is shown — never a generated image.
 */
export function BrandAsset({ kind, className = '', imgClass = '', alt, fallback }: { kind: 'team' | 'logo'; className?: string; imgClass?: string; alt?: string; fallback?: ReactNode }) {
  const { t } = useI18n(); const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { let on = true; getBrand().then((b) => { if (on) setUrl(b[kind]); }); return () => { on = false; }; }, [kind]);
  const label = alt || t(kind === 'team' ? 'brand.teamAlt' : 'brand.logoAlt');
  if (!url) {
    return (
      <div className={`grid place-items-center bg-gradient-to-br from-brand-200/60 to-mint-200/60 text-brand-800 ${className}`} role="img" aria-label={label}>
        {fallback ?? (kind === 'team' ? <Users className="h-1/2 w-1/2 opacity-70" aria-hidden /> : <GraduationCap className="h-1/2 w-1/2 opacity-70" aria-hidden />)}
      </div>
    );
  }
  return <img src={url} alt={label} className={`${className} ${imgClass}`} onError={() => setUrl(null)} decoding="async" />;
}
