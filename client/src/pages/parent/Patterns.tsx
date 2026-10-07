import { useI18n } from '../../i18n';
import { ChildPage, useChild } from '../../features/parent/ChildPage';
import { PatternsPanel } from '../../features/analytics/PatternsPanel';
function Inner() { const { child } = useChild(); return <PatternsPanel studentId={child.id} />; }
export default function ParentPatterns() { const { t } = useI18n(); return <ChildPage title={t('patterns.title')} subtitle={t('patterns.sub')}><Inner /></ChildPage>; }
