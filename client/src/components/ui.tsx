import { useEffect, useRef, useState, createContext, useContext, useCallback, type ReactNode } from 'react';
import { AlertOctagon, CheckCircle2, Eye, Info, Loader2, X, AlertTriangle, CircleDashed, Inbox } from 'lucide-react';
import { useI18n } from '../i18n';
import type { MealStatus, StudentStatus } from '../services/types';

export const Spinner = ({ className = 'h-5 w-5' }: { className?: string }) => <Loader2 className={`animate-spin ${className}`} aria-hidden />;

export function Skeleton({ className = 'h-24' }: { className?: string }) { return <div className={`skeleton ${className}`} aria-hidden />; }
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-live="polite" aria-label={t('common.loading')} className="space-y-4">
      <Skeleton className="h-10 w-2/3 sm:w-1/3" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-40" />)}
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-brand-200 bg-white/50 px-6 py-10 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-mint-100 text-brand-700">{icon ?? <Inbox className="h-8 w-8" aria-hidden />}</div>
      <p className="text-lg font-bold text-brand-900">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-ink-500">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden /> <span className="flex-1">{message}</span>
      {onRetry && <button type="button" className="btn-danger btn-sm" onClick={onRetry}>{t('common.retry')}</button>}
    </div>
  );
}
export function InfoBanner({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'amber' | 'mint' }) {
  const c = { brand: 'border-brand-200 bg-brand-50 text-brand-900', amber: 'border-amber-200 bg-amber-50 text-amber-900', mint: 'border-mint-200 bg-mint-50 text-mint-800' }[tone];
  return <div className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm ${c}`}><Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /><div>{children}</div></div>;
}

const MEAL = {
  GREEN: { cls: 'bg-mint-100 text-mint-800 ring-mint-300', Icon: CheckCircle2, key: 'status.green', dot: 'bg-mint-500' },
  YELLOW: { cls: 'bg-amber-100 text-amber-900 ring-amber-300', Icon: Eye, key: 'status.yellow', dot: 'bg-amber-500' },
  RED: { cls: 'bg-rose-100 text-rose-800 ring-rose-300', Icon: AlertOctagon, key: 'status.red', dot: 'bg-rose-500' },
} as const;
export const mealStatusStyle = (s: MealStatus) => MEAL[s];

/** Status is always icon + text + colour (never colour alone). */
export function MealStatusBadge({ status, size = 'md' }: { status: MealStatus; size?: 'md' | 'lg' }) {
  const { t } = useI18n(); const m = MEAL[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full font-bold ring-1 ${m.cls} ${size === 'lg' ? 'px-5 py-2.5 text-lg' : 'px-3 py-1 text-xs'}`}>
      <m.Icon className={size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} aria-hidden />{t(m.key)}
    </span>
  );
}
export function StudentStatusChip({ status }: { status: StudentStatus }) {
  const { t } = useI18n();
  const map = {
    ok: { cls: 'bg-mint-100 text-mint-800', Icon: CheckCircle2, key: 'studentStatus.ok' },
    review: { cls: 'bg-amber-100 text-amber-900', Icon: Eye, key: 'studentStatus.review' },
    attention: { cls: 'bg-rose-100 text-rose-800', Icon: AlertOctagon, key: 'studentStatus.attention' },
    none: { cls: 'bg-slate-100 text-slate-600', Icon: CircleDashed, key: 'studentStatus.none' },
  }[status];
  return <span className={`chip ${map.cls}`}><map.Icon className="h-3.5 w-3.5" aria-hidden />{t(map.key)}</span>;
}

export const PrototypeBadge = ({ label }: { label: string }) => (
  <span className="chip bg-brand-100 text-brand-800 ring-1 ring-brand-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" aria-hidden />{label}</span>
);

export function Field({ label, htmlFor, hint, error, required, children }: { label: string; htmlFor: string; hint?: string; error?: string | null; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">{label}{required && <span className="text-rose-600" aria-hidden> *</span>}</label>
      {children}
      {hint && !error && <p id={`${htmlFor}-hint`} className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && <p id={`${htmlFor}-err`} role="alert" className="mt-1 text-xs font-semibold text-rose-700">{error}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null); const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-rise sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
          <h2 className="text-lg font-extrabold text-brand-900">{title}</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm !px-2" aria-label={t('common.close')}><X className="h-5 w-5" aria-hidden /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Toasts ───────────────────────────────────────────────────────────────────
type Toast = { id: number; msg: string; tone: 'ok' | 'err' };
const ToastCtx = createContext<(msg: string, tone?: 'ok' | 'err') => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((msg: string, tone: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, msg, tone }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6" role="status" aria-live="polite">
        {items.map((x) => (
          <div key={x.id} className={`pointer-events-auto flex animate-rise items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${x.tone === 'ok' ? 'bg-mint-700' : 'bg-rose-700'}`}>
            {x.tone === 'ok' ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : <AlertTriangle className="h-5 w-5" aria-hidden />}{x.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string; icon?: ReactNode }[]; value: T; onChange: (v: T) => void; label: string }) {
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
    let n = i;
    if (e.key === 'ArrowRight') n = (i + dir + tabs.length) % tabs.length;
    else if (e.key === 'ArrowLeft') n = (i - dir + tabs.length) % tabs.length;
    else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1; else return;
    e.preventDefault(); onChange(tabs[n].id);
    (e.currentTarget.parentElement?.children[n] as HTMLElement)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {tabs.map((tb, i) => (
        <button key={tb.id} role="tab" type="button" id={`tab-${tb.id}`} aria-selected={value === tb.id} aria-controls={`panel-${tb.id}`} tabIndex={value === tb.id ? 0 : -1}
          onClick={() => onChange(tb.id)} onKeyDown={(e) => onKey(e, i)}
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-bold transition ${value === tb.id ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md' : 'bg-white/70 text-brand-800 hover:bg-brand-100'}`}>
          {tb.icon}{tb.label}
        </button>
      ))}
    </div>
  );
}

export function StatCard({ icon, label, value, tone = 'brand', hint }: { icon: ReactNode; label: string; value: ReactNode; tone?: 'brand' | 'mint' | 'amber' | 'rose'; hint?: string }) {
  const g = { brand: 'from-brand-500 to-brand-700', mint: 'from-mint-400 to-mint-600', amber: 'from-amber-400 to-orange-500', rose: 'from-rose-400 to-rose-600' }[tone];
  return (
    <div className="card flex h-full items-center gap-4">
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${g} text-white shadow-lg`}>{icon}</div>
      <div className="min-w-0"><div className="text-3xl font-extrabold leading-none text-brand-950">{value}</div><div className="mt-1 text-sm font-semibold text-ink-500">{label}</div>{hint && <div className="text-xs text-ink-400">{hint}</div>}</div>
    </div>
  );
}
