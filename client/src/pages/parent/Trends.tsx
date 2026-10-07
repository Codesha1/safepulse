import { useI18n } from '../../i18n';
import { ChildPage, useChild } from '../../features/parent/ChildPage';
import { GlucosePanel } from '../../features/glucose/GlucosePanel';
function Inner() { const { child } = useChild(); return <GlucosePanel studentId={child.id} canAdd={false} />; }
export default function ParentTrends() { const { t } = useI18n(); return <ChildPage title={t('parent.trendsTitle')} subtitle={t('parent.trendsSub')}><Inner /></ChildPage>; }
