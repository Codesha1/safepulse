import { CheckCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { ErrorBanner, PageSkeleton, Spinner, useToast } from '../../components/ui';
import { NotificationList } from '../../features/notifications/NotificationList';
import { useState } from 'react';
import { errorKey } from '../../utils/errors';

export default function NotificationsPage({ role }: { role: 'NURSE' | 'PARENT' }) {
  const { t } = useI18n(); const toast = useToast(); const [busy, setBusy] = useState(false);
  const { data, loading, error, reload, refresh } = useAsync(() => api.notifications(), []);
  const ping = () => window.dispatchEvent(new Event('sp:notifications'));
  const readAll = async () => { setBusy(true); try { await api.markAllRead(); await refresh(); ping(); toast(t('notif.allRead')); } catch (e) { toast(t(errorKey(e)), 'err'); } finally { setBusy(false); } };
  const readOne = async (id: number) => { try { await api.markRead(id); await refresh(); ping(); } catch (e) { toast(t(errorKey(e)), 'err'); } };
  if (loading) return <PageSkeleton rows={2} />;
  if (error || !data) return <ErrorBanner message={t('errors.generic')} onRetry={reload} />;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="h-page">{t('nav.notifications')}</h1><p className="mt-1 text-ink-600">{t(role === 'NURSE' ? 'notif.subNurse' : 'notif.subParent')}</p></div>
        {data.unread > 0 && <button className="btn-soft" onClick={readAll} disabled={busy}>{busy ? <Spinner /> : <CheckCheck className="h-5 w-5" aria-hidden />}{t('notif.markAll')}</button>}</div>
      <NotificationList items={data.notifications} onRead={readOne} studentLinks={role === 'NURSE'} />
    </div>
  );
}
