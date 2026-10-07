import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LogIn, Stethoscope, HeartHandshake, Play } from 'lucide-react';
import { PublicShell } from '../layouts/PublicShell';
import { useI18n } from '../i18n';
import { useAuth } from '../features/auth/AuthContext';
import { Field, Spinner } from '../components/ui';
import { errorKey } from '../utils/errors';
import type { Role } from '../services/types';

export default function RoleLogin({ role }: { role: Role }) {
  const { t } = useI18n(); const { login, demoLogin, demoMode } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<'login' | 'demo' | null>(null); const [error, setError] = useState<string | null>(null);
  const isNurse = role === 'NURSE'; const Icon = isNurse ? Stethoscope : HeartHandshake;
  const home = isNurse ? '/nurse' : '/parent';
  const from = (loc.state as { from?: string } | null)?.from;

  const finish = (mustChange: boolean) => nav(mustChange ? '/change-password' : from?.startsWith(home) ? from : home, { replace: true });
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    if (!email.trim() || !password) { setError(t('errors.required')); return; }
    setBusy('login');
    try { const u = await login(email.trim(), password, role); finish(u.mustChangePassword); }
    catch (err) { setError(t(errorKey(err, 'login'))); } finally { setBusy(null); }
  };
  const demo = async () => {
    setError(null); setBusy('demo');
    try { const u = await demoLogin(role); finish(u.mustChangePassword); }
    catch (err) { setError(t(errorKey(err))); } finally { setBusy(null); }
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-md">
        <form onSubmit={submit} noValidate className="card space-y-5" aria-labelledby="rl-title">
          <div className="flex items-center gap-4">
            <div className={`grid h-16 w-16 place-items-center rounded-2xl text-white shadow-lg ${isNurse ? 'bg-gradient-to-br from-brand-600 to-brand-800' : 'bg-gradient-to-br from-mint-500 to-mint-700'}`}><Icon className="h-8 w-8" aria-hidden /></div>
            <div><h1 id="rl-title" className="text-2xl font-extrabold text-brand-950">{t(isNurse ? 'login.nurseTitle' : 'login.parentTitle')}</h1><p className="text-sm text-ink-500">{t('login.credentials')}</p></div>
          </div>
          {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</div>}
          <Field label={t('field.email')} htmlFor="email" required>
            <input id="email" type="email" inputMode="email" autoComplete="username" className="input" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
          </Field>
          <Field label={t('field.password')} htmlFor="password" required>
            <div className="relative">
              <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" className="input pe-14" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute end-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-brand-700 hover:bg-brand-100" aria-label={t(show ? 'login.hidePassword' : 'login.showPassword')} aria-pressed={show}>
                {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          </Field>
          <button type="submit" disabled={!!busy} className="btn-primary w-full">{busy === 'login' ? <><Spinner />{t('login.signingIn')}</> : <><LogIn className="h-5 w-5 rtl-flip" aria-hidden />{t('login.login')}</>}</button>
          {!isNurse && <div className="text-center"><Link to="/forgot-password" className="text-sm font-bold text-brand-700 underline-offset-4 hover:underline">{t('login.forgot')}</Link></div>}
          {demoMode && (
            <div className="border-t border-brand-100 pt-4">
              <button type="button" onClick={demo} disabled={!!busy} className="btn-soft w-full">{busy === 'demo' ? <Spinner /> : <Play className="h-5 w-5 text-mint-600" aria-hidden />}{t(isNurse ? 'demo.nurse' : 'demo.parent')}</button>
              <p className="mt-2 text-center text-xs text-ink-500">{t('demo.fictional')}</p>
            </div>
          )}
        </form>
        <div className="mt-4"><Link to="/login" className="btn-ghost"><ArrowLeft className="h-5 w-5 rtl-flip" aria-hidden />{t('common.back')}</Link></div>
      </div>
    </PublicShell>
  );
}
