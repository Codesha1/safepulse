import { useI18n } from '../../i18n';
import { ChildPage, useChild } from '../../features/parent/ChildPage';
import { MealsPanel } from '../../features/meals/MealsPanel';
function Inner() { const { child } = useChild(); return <MealsPanel studentId={child.id} audience="parent" />; }
export default function ParentMeals() { const { t } = useI18n(); return <ChildPage title={t('parent.mealsTitle')} subtitle={t('parent.mealsSub')}><Inner /></ChildPage>; }
