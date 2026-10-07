import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, Eye, AlertOctagon, Info } from 'lucide-react';
import { useI18n } from '../../i18n';
import { EmptyState } from '../../components/ui';
import type { NotificationItem } from '../../services/types';

const SEV = {
  good: { Icon: CheckCircle2, cls: 'bg-mint-100 text-mint-700', ring: 'ring-mint-200' },
  review: { Icon: Eye, cls: 'bg-amber-100 text-amber-800', ring: 'ring-amber-200' },
  attention: { Icon: AlertOctagon, cls: 'bg-rose-100 text-rose-700', ring: 'ring-rose-200' },
  info: { Icon: Info, cls: 'bg-brand-100 text-brand-700', ring: 'ring-brand-200' },
} as const;

export function NotificationList({ items, onRead, studentLinks = false, compact = false }: { items: NotificationItem[]; onRead?: (id: number) => void; studentLinks?: boolean; compact?: boolean }) {
  const { t, bi, fmtDate, fmtTime } = useI18n();
  if (!items.length) return <EmptyState icon={<Bell className="h-8 w-8" aria-hidden />} title={t('empty.notifications')} hint={t('empty.notificationsHint')} />;
  return (
    <ul className="space-y-3">
      {items.map((n) => { const s = SEV[n.severity] ?? SEV.info;
        return (
          <li key={n.id} className={`card relative !p-4 ring-1 ${s.ring} ${n.isRead ? 'opacity-85' : ''}`}>
            <div className="flex gap-4">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${s.cls}`}><s.Icon className="h-6 w-6" aria-hidden /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-extrabold text-brand-950">{bi(n.title)}</h3>
                  {!n.isRead && <span className="chip bg-rose-100 text-rose-700"><span className="h-1.5 w-1.5 rounded-full bg-rose-600" aria-hidden />{t('notif.new')}</span>}
                  <span className="ms-auto text-xs text-ink-400">{fmtDate(n.createdAt, { day: 'numeric', month: 'short' })} · {fmtTime(n.createdAt)}</span>
                </div>
                {n.studentName && (studentLinks && n.studentId ? <Link to={`/nurse/students/${n.studentId}`} className="text-sm font-bold text-brand-700 hover:underline">{n.studentName}</Link> : <p className="text-sm font-bold text-brand-700">{n.studentName}</p>)}
                <p className="mt-1 text-ink-700">{bi(n.body)}</p>
                {n.suggestion && !compact && <p className="mt-2 rounded-2xl bg-white/80 px-3 py-2 text-sm text-ink-700 ring-1 ring-brand-100"><b>{t('notif.suggestion')}:</b> {bi(n.suggestion)}</p>}
                {onRead && !n.isRead && <button type="button" className="btn-ghost btn-sm mt-2 -ms-2" onClick={() => onRead(n.id)}>{t('notif.markRead')}</button>}
              </div>
            </div>
          </li>); })}
    </ul>
  );
}
