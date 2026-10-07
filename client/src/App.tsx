import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { PageSkeleton } from './components/ui';
import Welcome from './pages/Welcome';
import RoleSelect from './pages/RoleSelect';
import RoleLogin from './pages/RoleLogin';
import { ForgotPassword, ResetPassword, ChangePassword } from './pages/PasswordPages';
import About from './pages/About';
import NotFound from './pages/NotFound';

const NurseDashboard = lazy(() => import('./pages/nurse/Dashboard'));
const RegisterStudent = lazy(() => import('./pages/nurse/RegisterStudent'));
const MealScanner = lazy(() => import('./pages/nurse/MealScanner'));
const Students = lazy(() => import('./pages/nurse/Students'));
const StudentProfile = lazy(() => import('./pages/nurse/StudentProfile'));
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'));
const NurseInsights = lazy(() => import('./pages/nurse/Insights'));
const ParentHome = lazy(() => import('./pages/parent/Home'));
const ParentMeals = lazy(() => import('./pages/parent/Meals'));
const ParentTrends = lazy(() => import('./pages/parent/Trends'));
const ParentSchedule = lazy(() => import('./pages/parent/Schedule'));
const ParentWellness = lazy(() => import('./pages/parent/Wellness'));
const ParentPatterns = lazy(() => import('./pages/parent/Patterns'));

const L = ({ children }: { children: React.ReactNode }) => <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<RoleSelect />} />
      <Route path="/nurse/login" element={<RoleLogin role="NURSE" />} />
      <Route path="/parent/login" element={<RoleLogin role="PARENT" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/about" element={<About />} />

      <Route path="/nurse" element={<ProtectedRoute role="NURSE"><AppLayout role="NURSE" /></ProtectedRoute>}>
        <Route index element={<L><NurseDashboard /></L>} />
        <Route path="register" element={<L><RegisterStudent /></L>} />
        <Route path="meals" element={<L><MealScanner /></L>} />
        <Route path="students" element={<L><Students /></L>} />
        <Route path="students/:id" element={<L><StudentProfile /></L>} />
        <Route path="notifications" element={<L><NotificationsPage role="NURSE" /></L>} />
        <Route path="insights" element={<L><NurseInsights /></L>} />
        <Route path="*" element={<Navigate to="/nurse" replace />} />
      </Route>

      <Route path="/parent" element={<ProtectedRoute role="PARENT"><AppLayout role="PARENT" /></ProtectedRoute>}>
        <Route index element={<L><ParentHome /></L>} />
        <Route path="meals" element={<L><ParentMeals /></L>} />
        <Route path="trends" element={<L><ParentTrends /></L>} />
        <Route path="schedule" element={<L><ParentSchedule /></L>} />
        <Route path="wellness" element={<L><ParentWellness /></L>} />
        <Route path="patterns" element={<L><ParentPatterns /></L>} />
        <Route path="notifications" element={<L><NotificationsPage role="PARENT" /></L>} />
        <Route path="*" element={<Navigate to="/parent" replace />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
