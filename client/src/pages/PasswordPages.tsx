import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, MailCheck } from 'lucide-react';
import { PublicShell } from '../layouts/PublicShell';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import { homeFor } from '../features/auth/ProtectedRoute';
import { Field, Spinner, InfoBanner } from '../components/ui';
import { errorKey } from '../utils/errors';

export function ForgotPassword() {
  const { t } = useI18n(); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false); const [err, setErr] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr(t('errors.email')); return; }
    setBusy(true);
    try { await api.forgot(email.trim()); setSent(true); } catch (x) { setErr(t(errorKey(x))); } finally { setBusy(false); }
  };
  return (
    <PublicShell><div className="mx-auto max-w-md">
      <div className="card space-y-5">
        {sent ? (
          <div className="space-y-4 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mint-100 text-mint-700"><MailCheck className="h-8 w-8" aria-hidden /></div>
            <h1 className="text-2xl font-extrabold text-brand-950">{t('forgot.sentTitle')}</h1><p className="text-ink-600">{t('forgot.sentBody')}</p></div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <h1 className="text-2xl font-extrabold text-brand-950">{t('forgot.title')}</h1><p className="text-ink-600">{t('forgot.body')}</p>
            {err && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{err}</div>}
            <Field label={t('field.email')} htmlFor="fe" required><input id="fe" type="email" className="input" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />}{t('forgot.send')}</button>
          </form>
        )}
      </div>
      <div className="mt-4"><Link to="/parent/login" className="btn-ghost"><ArrowLeft className="h-5 w-5 rtl-flip" aria-hidden />{t('common.back')}</Link></div>
    </div></PublicShell>
  );
}

export function ResetPassword() {
  const { t } = useI18n(); const [sp] = useSearchParams(); const token = sp.get('token') || '';
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [err, setErr] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(null);
    if (pw.length < 8) return setErr(t('errors.weakPassword'));
    if (pw !== pw2) return setErr(t('errors.passwordMismatch'));
    setBusy(true);
    try { await api.reset(token, pw); setDone(true); } catch (x) { setErr(t(errorKey(x))); } finally { setBusy(false); }
  };
  return (
    <PublicShell><div className="mx-auto max-w-md"><div className="card space-y-5">
      {done ? (
        <div className="space-y-4 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mint-100 text-mint-700"><CheckCircle2 className="h-8 w-8" aria-hidden /></div>
          <h1 className="text-2xl font-extrabold text-brand-950">{t('reset.done')}</h1><Link className="btn-primary w-full" to="/parent/login">{t('login.login')}</Link></div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <h1 className="text-2xl font-extrabold text-brand-950">{t('reset.title')}</h1>
          {!token && <InfoBanner tone="amber">{t('errors.invalidToken')}</InfoBanner>}
          {err && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{err}</div>}
          <Field label={t('field.newPassword')} htmlFor="np" hint={t('password.rule')} required><input id="np" type="password" autoComplete="new-password" className="input" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <Field label={t('field.confirmPassword')} htmlFor="np2" required><input id="np2" type="password" autoComplete="new-password" className="input" dir="ltr" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
          <button className="btn-primary w-full" disabled={busy || !token}>{busy && <Spinner />}{t('reset.save')}</button>
        </form>
      )}
    </div></div></PublicShell>
  );
}

/** Shown when a parent logs in with a temporary password (must_change_password). */
export function ChangePassword() {
  const { t } = useI18n(); const { user, refresh, logout } = useAuth(); const nav = useNavigate();
  const [cur, setCur] = useState(''); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  if (!user) { nav('/login', { replace: true }); return null; }
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(null);
    if (pw.length < 8) return setErr(t('errors.weakPassword'));
    if (pw !== pw2) return setErr(t('errors.passwordMismatch'));
    setBusy(true);
    try { await api.changePassword(cur, pw); await refresh(); nav(homeFor(user.role), { replace: true }); }
    catch (x) { setErr(t(errorKey(x))); } finally { setBusy(false); }
  };
  return (
    <PublicShell><div className="mx-auto max-w-md"><form onSubmit={submit} noValidate className="card space-y-5">
      <div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white"><KeyRound className="h-7 w-7" aria-hidden /></div>
        <div><h1 className="text-2xl font-extrabold text-brand-950">{t('changePw.title')}</h1><p className="text-sm text-ink-500">{t('changePw.body')}</p></div></div>
      {err && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{err}</div>}
      <Field label={t('field.currentPassword')} htmlFor="cp" required><input id="cp" type="password" autoComplete="current-password" className="input" dir="ltr" value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
      <Field label={t('field.newPassword')} htmlFor="np" hint={t('password.rule')} required><input id="np" type="password" autoComplete="new-password" className="input" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      <Field label={t('field.confirmPassword')} htmlFor="np2" required><input id="np2" type="password" autoComplete="new-password" className="input" dir="ltr" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
      <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />}{t('reset.save')}</button>
      <button type="button" className="btn-ghost w-full" onClick={async () => { await logout(); nav('/login', { replace: true }); }}>{t('nav.logout')}</button>
    </form></div></PublicShell>
  );
}
