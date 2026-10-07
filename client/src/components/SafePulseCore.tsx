import { useState } from 'react';
import { Brain, Utensils, Droplets, CalendarClock, School, HeartHandshake, HeartPulse } from 'lucide-react';
import { useI18n } from '../i18n';

const NODES = [
  { id: 'vision', Icon: Brain, titleKey: 'core.vision.title', descKey: 'core.vision.desc' },
  { id: 'meals', Icon: Utensils, titleKey: 'core.meals.title', descKey: 'core.meals.desc' },
  { id: 'glucose', Icon: Droplets, titleKey: 'core.glucose.title', descKey: 'core.glucose.desc' },
  { id: 'schedule', Icon: CalendarClock, titleKey: 'core.schedule.title', descKey: 'core.schedule.desc' },
  { id: 'school', Icon: School, titleKey: 'core.school.title', descKey: 'core.school.desc' },
  { id: 'family', Icon: HeartHandshake, titleKey: 'core.family.title', descKey: 'core.family.desc' },
] as const;

/** Interactive SafePulse Core: glowing pulse with six orbiting capabilities. */
export function SafePulseCore() {
  const { t } = useI18n(); const [active, setActive] = useState<string | null>(null);
  const cur = NODES.find((n) => n.id === active);
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <div className="relative mx-auto aspect-square w-full max-w-[400px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="36" fill="none" stroke="url(#coreRing)" strokeWidth=".4" strokeDasharray="1.2 1.8" />
          <circle cx="50" cy="50" r="26" fill="none" stroke="rgba(124,58,237,.18)" strokeWidth=".3" />
          <defs><linearGradient id="coreRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#10b981" /></linearGradient></defs>
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute inset-0 rounded-full bg-brand-500/30 animate-pulse-ring" aria-hidden />
          <span className="absolute inset-0 rounded-full bg-mint-400/25 animate-pulse-ring [animation-delay:1.4s]" aria-hidden />
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-brand-600 via-brand-700 to-mint-600 text-white shadow-glow sm:h-28 sm:w-28">
            <HeartPulse className="h-11 w-11" aria-hidden /><span className="sr-only">SafePulse Core</span>
          </div>
        </div>
        {NODES.map((n, i) => {
          const a = ((-90 + i * 60) * Math.PI) / 180; const x = 50 + 38 * Math.cos(a), y = 50 + 38 * Math.sin(a); const on = active === n.id;
          return (
            <button key={n.id} type="button" aria-pressed={on}
              onMouseEnter={() => setActive(n.id)} onFocus={() => setActive(n.id)} onClick={() => setActive(on ? null : n.id)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl p-1.5 transition ${on ? 'scale-110' : 'hover:scale-105'}`}>
              <span className={`grid h-12 w-12 place-items-center rounded-2xl shadow-md ring-1 transition sm:h-14 sm:w-14 ${on ? 'bg-gradient-to-br from-brand-600 to-mint-600 text-white ring-white shadow-glow' : 'bg-white/90 text-brand-700 ring-brand-200'}`}><n.Icon className="h-6 w-6" aria-hidden /></span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-tight sm:text-xs ${on ? 'bg-brand-700 text-white' : 'bg-white/80 text-brand-900'}`}>{t(n.titleKey)}</span>
            </button>
          );
        })}
      </div>
      <div className="glass mt-2 min-h-[92px] rounded-2xl p-4 text-center" aria-live="polite">
        {cur ? (<><p className="font-extrabold text-brand-900">{t(cur.titleKey)}</p><p className="mt-1 text-sm text-ink-700">{t(cur.descKey)}</p></>) : <p className="pt-3 text-sm font-medium text-ink-500">{t('core.hint')}</p>}
      </div>
    </div>
  );
}
