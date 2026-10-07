export type Role = 'NURSE' | 'PARENT';
export interface User { id: number; email: string; role: Role; name: string; mustChangePassword: boolean; isDemo: boolean }
export type Bi = { en: string; ar: string };
export type MealStatus = 'GREEN' | 'YELLOW' | 'RED';
export type StudentStatus = 'ok' | 'review' | 'attention' | 'none';
export interface Glucose { id: number; value: number; context: string; recordedAt: string }
export interface NextActivity { subject: string; type: string; start: string; dayOffset: number; date: string }
export interface StudentSummary {
  id: number; code: string; name: string; grade: string; diabetesType: string | null;
  latestGlucose: Glucose | null; lastMeal: { id: number; status: MealStatus; createdAt: string } | null;
  nextActivity: NextActivity | null; status: StudentStatus;
}
export interface Medical {
  allergies?: string; conditions?: string; hypoHistory?: string; hyperHistory?: string; medicationInfo?: string; foodRestrictions?: string;
  activityConsiderations?: string; emergencyInstructions?: string; physicianContact?: string; carePlanNotes?: string;
}
export interface ParentInfo { name: string; email: string; relationship?: string; phone?: string; preferredContact?: string; emergencyContact?: string }
export interface StudentDetail extends StudentSummary { diagnosisDate: string | null; createdAt: string; parent?: ParentInfo; medical?: Medical }
export interface Food { key: string | null; name: Bi; portion: Bi; carbs: number; protein: number; fat: number; fiber: number; drink?: boolean; sugary?: boolean }
export interface Nutrition { carbs: number; protein: number; fat: number; fiber: number }
export interface Meal {
  id: number; studentId: number; mealType: string; source: string; estimateMode: 'demo' | 'ai'; hasImage: boolean; createdAt: string;
  foods: Food[]; nutrition: Nutrition; status: MealStatus; reason: Bi; suggestions: Bi[];
}
export interface ScheduleEvent { id: number; day: number; start: string; end: string | null; subject: string; classroom: string | null; type: string }
export interface Exam { id: number; subject: string; date: string; time: string; type: string | null }
export interface NotificationItem {
  id: number; studentId: number | null; studentName?: string; mealId: number | null; kind: string; severity: 'info' | 'review' | 'attention' | 'good';
  title: Bi; body: Bi; suggestion: Bi | null; isRead: boolean; createdAt: string;
}
export interface PatternItem { id: string; icon: string; n: number; strength: 'slight' | 'noticeable'; title: Bi; text: Bi; awareness: Bi }
export interface DemoMeal { id: string; title: Bi }
export interface CatalogFood { key: string; name: Bi; portion: Bi; carbs: number }
export interface ParentChild extends StudentSummary { latestMeal: Meal | null; upcomingExam: (Exam & { daysUntil: number }) | null }
export type WellnessPlan = Record<'meals' | 'hydration' | 'sleep' | 'activity' | 'stress' | 'school', Bi[]>;
