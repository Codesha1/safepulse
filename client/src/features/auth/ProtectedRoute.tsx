import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useI18n } from '../../i18n';
import type { Role } from '../../services/types';
import { PageSkeleton } from '../../components/ui';

export const homeFor = (r: Role) => (r === 'NURSE' ? '/nurse' : '/parent');

/** Client-side guard. The REAL enforcement is on the server (every API route checks the role). */
export function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading, logout } = useAuth(); const loc = useLocation(); const { t } = useI18n();
  if (loading) return <div className="mx-auto max-w-5xl p-6"><PageSkeleton /></div>;
  if (!user) return <Navigate to={`/${role.toLowerCase()}/login`} replace state={{ from: loc.pathname }} />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user.role !== role) {
    return (
      <main className="grid min-h-screen place-items-center app-bg p-6">
        <div className="card max-w-md text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-rose-100 text-rose-700"><ShieldAlert className="h-8 w-8" aria-hidden /></div>
          <h1 className="text-2xl font-extrabold text-brand-900">{t('access.title')}</h1>
          <p className="mt-2 text-ink-600">{t(role === 'NURSE' ? 'access.nurseOnly' : 'access.parentOnly')}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link className="btn-primary" to={homeFor(user.role)}>{t('access.goHome')}</Link>
            <button className="btn-soft" onClick={() => logout()}>{t('nav.logout')}</button>
          </div>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
