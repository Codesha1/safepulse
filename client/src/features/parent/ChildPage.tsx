import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Users } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorBanner, PageSkeleton } from '../../components/ui';
import type { ParentChild, NotificationItem } from '../../services/types';

interface Home { children: ParentChild[]; notifications: NotificationItem[] }
const Ctx = createContext<{ child: ParentChild; home: Home; reload: () => void } | null>(null);
export const useChild = () => useContext(Ctx)!;

const KEY = 'sp_child';

/** Loads the parent's children once per page and provides the selected child. */
export function ChildPage({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  const { t } = useI18n();
  const { data, loading, error, reload } = useAsync(() => api.parentHome(), []);
  const [sel, setSel] = useState<number | null>(() => { try { return Number(localStorage.getItem(KEY)) || null; } catch { return null; } });
  useEffect(() => { try { if (sel) localStorage.setItem(KEY, String(sel)); } catch { /* ignore */ } }, [sel]);
  if (loading) return <PageSkeleton />;
  if (error || !data) return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  if (!data.children.length) return <EmptyState icon={<Users className="h-8 w-8" aria-hidden />} title={t('empty.children')} hint={t('empty.childrenHint')} />;
  const child = data.children.find((c) => c.id === sel) ?? data.children[0];
  return (
    <Ctx.Provider value={{ child, home: data, reload }}>
      <div className="space-y-6">
        {(title || data.children.length > 1) && (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>{title && <h1 className="h-page">{title}</h1>}{subtitle && <p className="mt-1 text-ink-600">{subtitle}</p>}</div>
            {data.children.length > 1 && (<div><label htmlFor="child-sel" className="label">{t('parent.child')}</label><select id="child-sel" className="input min-w-[200px]" value={child.id} onChange={(e) => setSel(Number(e.target.value))}>{data.children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>)}
          </div>)}
        {children}
      </div>
    </Ctx.Provider>
  );
}
