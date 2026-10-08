import type * as T from './types';

export class ApiError extends Error {
  constructor(public status: number, public code: string, public field?: string) { super(code); }
}

async function req<R>(method: string, url: string, body?: unknown): Promise<R> {
  let res: Response;
  try {
    res = await fetch('/api' + url, {
      method, credentials: 'same-origin',
      headers: body && !(body instanceof FormData) ? { 'content-type': 'application/json' } : undefined,
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK');
  }
  let data: any = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) {
    if (res.status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/me')) window.dispatchEvent(new Event('sp:unauthorized'));
    throw new ApiError(res.status, data?.error || (res.status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN'), data?.field);
  }
  return data as R;
}
const get = <R,>(u: string) => req<R>('GET', u);
const post = <R,>(u: string, b?: unknown) => req<R>('POST', u, b ?? {});
const del = <R,>(u: string) => req<R>('DELETE', u);

export interface RegisterPayload {
  student: { name: string; code?: string; grade: string; diabetesType: string; diagnosisDate: string };
  medical: Record<string, string>;
  schedule: { day: number; start: string; end?: string; subject: string; classroom?: string; type: string }[];
  exams: { subject: string; date: string; time: string; type?: string }[];
  parent: { name: string; relationship: string; phone: string; email: string; preferredContact: string; emergencyContact: string };
}
export interface RegisterResult {
  studentId: number; parentEmail: string; newAccount: boolean; tempPassword: string | null;
  email: { sent: boolean; configured: boolean; reason: string | null; preview: { subject: string; html: string } | null } | null;
}

export const api = {
  config: () => get<{ demoMode: boolean }>('/auth/config'),
  me: () => get<{ user: T.User | null }>('/auth/me'),
  brand: () => get<{ team: string | null; logo: string | null }>('/brand'),
  login: (email: string, password: string, role: T.Role) => post<{ user: T.User }>('/auth/login', { email, password, role }),
  demoLogin: (role: T.Role) => post<{ user: T.User }>('/auth/demo', { role }),
  logout: () => post('/auth/logout'),
  changePassword: (current: string, next: string) => post('/auth/change-password', { current, next }),
  forgot: (email: string) => post('/auth/forgot', { email }),
  reset: (token: string, password: string) => post('/auth/reset', { token, password }),

  dashboard: () => get<{ totalStudents: number; needsReview: number; todaysActivities: number; notifications: number; needsReviewList: { id: number; name: string; grade: string; status: T.StudentStatus }[] }>('/dashboard'),
  students: () => get<{ students: T.StudentSummary[] }>('/students'),
  student: (id: number) => get<{ student: T.StudentDetail }>(`/students/${id}`),
  register: (p: RegisterPayload) => post<RegisterResult>('/students', p),
  meals: (id: number) => get<{ meals: T.Meal[] }>(`/students/${id}/meals`),
  glucose: (id: number, days = 30) => get<{ readings: T.Glucose[]; exams: T.Exam[]; peDays: number[] }>(`/students/${id}/glucose?days=${days}`),
  addGlucose: (id: number, value: number, context: string) => post(`/students/${id}/glucose`, { value, context }),
  schedule: (id: number) => get<{ events: T.ScheduleEvent[] }>(`/students/${id}/schedule`),
  addEvent: (id: number, e: Omit<T.ScheduleEvent, 'id'>) => post(`/students/${id}/schedule`, { day: e.day, start: e.start, end: e.end || undefined, subject: e.subject, classroom: e.classroom || undefined, type: e.type }),
  delEvent: (id: number, eid: number) => del(`/students/${id}/schedule/${eid}`),
  exams: (id: number) => get<{ exams: T.Exam[] }>(`/students/${id}/exams`),
  addExam: (id: number, e: { subject: string; date: string; time: string; type?: string }) => post(`/students/${id}/exams`, e),
  delExam: (id: number, eid: number) => del(`/students/${id}/exams/${eid}`),
  studentNotifications: (id: number) => get<{ notifications: T.NotificationItem[] }>(`/students/${id}/notifications`),
  patterns: (id: number) => get<{ patterns: T.PatternItem[]; sample: number; enough: boolean }>(`/students/${id}/patterns`),
  wellness: (id: number) => get<{ plan: T.WellnessPlan; footer: T.Bi; generatedAt: string }>(`/students/${id}/wellness`),

  mealOptions: () => get<{ demoMeals: T.DemoMeal[]; foods: T.CatalogFood[]; aiConfigured: boolean }>('/meals/options'),
  analyzeMeal: (fd: FormData) => post<{ meal: T.Meal; parentNotified: boolean; mode: string }>('/meals/analyze', fd),

  notifications: () => get<{ notifications: T.NotificationItem[]; unread: number }>('/notifications'),
  markAllRead: () => post('/notifications/read-all'),
  markRead: (id: number) => post(`/notifications/${id}/read`),
  parentHome: () => get<{ children: T.ParentChild[]; notifications: T.NotificationItem[] }>('/parent/home'),
  resetDemo: () => post('/demo/reset'),
};
