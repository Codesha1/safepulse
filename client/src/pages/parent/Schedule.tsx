import { useI18n } from '../../i18n';
import { ChildPage, useChild } from '../../features/parent/ChildPage';
import { SchedulePanel } from '../../features/schedule/SchedulePanel';
import { ExamsPanel } from '../../features/schedule/ExamsPanel';
function Inner() { const { t } = useI18n(); const { child } = useChild(); return (<><SchedulePanel studentId={child.id} canEdit={false} /><h2 className="pt-2 text-2xl font-extrabold text-brand-950">{t('tabs.exams')}</h2><ExamsPanel studentId={child.id} canEdit={false} /></>); }
export default function ParentSchedule() { const { t } = useI18n(); return <ChildPage title={t('parent.scheduleTitle')} subtitle={t('parent.scheduleSub')}><Inner /></ChildPage>; }
