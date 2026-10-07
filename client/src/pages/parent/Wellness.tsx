import { useI18n } from '../../i18n';
import { ChildPage, useChild } from '../../features/parent/ChildPage';
import { WellnessPanel } from '../../features/wellness/WellnessPanel';
function Inner() { const { child } = useChild(); return <WellnessPanel studentId={child.id} />; }
export default function ParentWellness() { const { t } = useI18n(); return <ChildPage title={t('wellness.title')} subtitle={t('wellness.sub')}><Inner /></ChildPage>; }
