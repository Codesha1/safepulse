import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Camera, CheckCircle2, ImagePlus, Loader2, RefreshCw, Sparkles, UploadCloud, UserPlus, X, Search, ListChecks, Bell } from 'lucide-react';
import { api, ApiError } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorBanner, Field, InfoBanner, PageSkeleton, PrototypeBadge, Spinner, useToast } from '../../components/ui';
import { MealResult } from '../../features/meals/MealResult';
import { CameraCapture } from '../../features/meals/CameraCapture';
import { errorKey } from '../../utils/errors';
import type { Meal } from '../../services/types';

const STEPS = ['pipeline.scan', 'pipeline.identify', 'pipeline.estimate', 'pipeline.review', 'pipeline.insight'] as const;
const STEP_MS = 850;
const MAX = 6 * 1024 * 1024; const OK = ['image/jpeg', 'image/png', 'image/webp'];

type Input = { kind: 'image'; file: File } | { kind: 'demo'; id: string } | { kind: 'foods'; keys: string[] };

export default function MealScanner() {
  const { t, bi, grade } = useI18n(); const toast = useToast(); const [sp] = useSearchParams();
  const students = useAsync(() => api.students(), []); const opts = useAsync(() => api.mealOptions(), []);
  const [studentId, setStudentId] = useState<string>(sp.get('student') || ''); const [mealType, setMealType] = useState('lunch');
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState<string | null>(null);
  const [drag, setDrag] = useState(false); const [camOpen, setCamOpen] = useState(false); const [manual, setManual] = useState(false); const [picked, setPicked] = useState<string[]>([]); const [q, setQ] = useState('');
  const [stage, setStage] = useState<'input' | 'analyzing' | 'result'>('input'); const [step, setStep] = useState(0);
  const [result, setResult] = useState<{ meal: Meal; parentNotified: boolean; img: string | null } | null>(null);
  const [error, setError] = useState<{ msg: string; canManual: boolean } | null>(null); const [fieldErr, setFieldErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null); const capRef = useRef<HTMLInputElement>(null); const live = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!students.data) return; if (!studentId && students.data.students.length === 1) setStudentId(String(students.data.students[0].id)); }, [students.data, studentId]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const accept = useCallback((f: File | undefined | null) => {
    if (!f) return;
    if (!OK.includes(f.type) || f.size > MAX) { setError({ msg: t('errors.upload'), canManual: false }); return; }
    setError(null); setFile(f); setPreview((p) => { if (p) URL.revokeObjectURL(p); return URL.createObjectURL(f); });
  }, [t]);

  const run = async (input: Input) => {
    if (!studentId) { setFieldErr(t('scanner.chooseStudent')); document.getElementById('sc-student')?.focus(); return; }
    setFieldErr(null); setError(null); setStage('analyzing'); setStep(0);
    const fd = new FormData(); fd.append('studentId', studentId); fd.append('mealType', mealType);
    let img: string | null = null;
    if (input.kind === 'image') { fd.append('image', input.file); img = preview; } else if (input.kind === 'demo') fd.append('demoMealId', input.id); else fd.append('foodKeys', input.keys.join(','));
    // The animation and the request run together; the result is shown when both are done.
    const anim = (async () => { for (let i = 0; i < STEPS.length; i++) { setStep(i); await new Promise((r) => setTimeout(r, STEP_MS)); } setStep(STEPS.length); })();
    try {
      const [res] = await Promise.all([api.analyzeMeal(fd), anim]);
      setResult({ meal: res.meal, parentNotified: res.parentNotified, img }); setStage('result');
      window.dispatchEvent(new Event('sp:notifications'));
      requestAnimationFrame(() => live.current?.focus());
    } catch (e) {
      setStage('input');
      const k = errorKey(e, 'analyze'); setError({ msg: t(k), canManual: e instanceof ApiError && (e.code === 'AI_UNAVAILABLE' || e.code === 'NO_FOOD') });
    }
  };
  const reset = () => { setStage('input'); setResult(null); setFile(null); setPreview(null); setManual(false); setPicked([]); setError(null); };

  const foods = useMemo(() => (opts.data?.foods ?? []).filter((f) => !q || bi(f.name).toLowerCase().includes(q.toLowerCase())), [opts.data, q, bi]);
  const student = students.data?.students.find((s) => String(s.id) === studentId);

  if (students.loading || opts.loading) return <PageSkeleton rows={2} />;
  if (students.error || opts.error || !students.data || !opts.data) return <ErrorBanner message={t('errors.generic')} onRetry={() => { students.reload(); opts.reload(); }} />;
  if (!students.data.students.length) return <EmptyState icon={<UserPlus className="h-8 w-8" aria-hidden />} title={t('empty.students')} hint={t('scanner.needStudent')} action={<Link to="/nurse/register" className="btn-primary">{t('nav.register')}</Link>} />;

  return (
    <div className="space-y-6">
      <div><div className="flex flex-wrap items-center gap-3"><h1 className="h-page">{t('scanner.title')}</h1><PrototypeBadge label={t('meal.prototypeEstimate')} /></div><p className="mt-1 text-ink-600">{t('scanner.sub')}</p></div>

      {stage === 'analyzing' && (
        <section className="card" aria-labelledby="an-t" aria-busy="true">
          <h2 id="an-t" className="mb-4 flex items-center gap-2 text-xl font-extrabold text-brand-900"><Sparkles className="h-6 w-6 animate-pulse text-brand-600" aria-hidden />{t('scanner.analyzing')}</h2>
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 to-mint-100">
              {preview && file ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-brand-600"><Sparkles className="h-16 w-16 animate-pulse" aria-hidden /></div>}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-mint-400 to-transparent shadow-[0_0_18px_4px_rgba(16,185,129,.7)]" style={{ animation: 'scanY 1.7s ease-in-out infinite alternate', top: 0 }} aria-hidden />
              <style>{`@keyframes scanY{from{top:0}to{top:calc(100% - 4px)}}`}</style>
            </div>
            <ol className="space-y-3" role="status" aria-live="polite">
              {STEPS.map((k, i) => { const done = step > i; const cur = step === i; return (
                <li key={k} className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${cur ? 'bg-brand-50 ring-1 ring-brand-200' : ''} ${!done && !cur ? 'opacity-45' : ''}`}>
                  {done ? <CheckCircle2 className="h-6 w-6 text-mint-600" aria-hidden /> : cur ? <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden /> : <span className="h-6 w-6 rounded-full border-2 border-brand-200" aria-hidden />}
                  <span className={`font-bold ${cur ? 'text-brand-900' : 'text-ink-700'}`}>{t(k)}</span>
                </li>); })}
            </ol>
          </div>
        </section>
      )}

      {stage === 'result' && result && (
        <section ref={live as any} tabIndex={-1} className="space-y-5 outline-none" aria-label={t('scanner.result')}>
          <div className="card"><MealResult meal={result.meal} imageUrl={result.img} /></div>
          {result.parentNotified
            ? <InfoBanner tone="mint"><span className="flex items-center gap-2"><Bell className="h-4 w-4" aria-hidden /><b>{t('scanner.parentNotified')}</b></span>{t('scanner.parentNotifiedHint')}</InfoBanner>
            : <InfoBanner tone="amber">{t('scanner.noParent')}</InfoBanner>}
          <div className="flex flex-wrap gap-3"><button className="btn-primary" onClick={reset}><RefreshCw className="h-5 w-5" aria-hidden />{t('scanner.another')}</button><Link to={`/nurse/students/${result.meal.studentId}?tab=meals`} className="btn-soft">{t('scanner.viewProfile')}</Link></div>
        </section>
      )}

      {stage === 'input' && (<>
        {error && <ErrorBanner message={error.msg} onRetry={undefined} />}
        {error?.canManual && !manual && <button className="btn-soft" onClick={() => setManual(true)}><ListChecks className="h-5 w-5" aria-hidden />{t('scanner.reviewManually')}</button>}
        <section className="card grid gap-4 md:grid-cols-2" aria-label={t('scanner.details')}>
          <Field label={t('scanner.student')} htmlFor="sc-student" error={fieldErr} required>
            <select id="sc-student" className="input" value={studentId} onChange={(e) => { setStudentId(e.target.value); setFieldErr(null); }} aria-invalid={!!fieldErr}><option value="">{t('scanner.selectStudent')}</option>{students.data.students.map((s) => <option key={s.id} value={s.id}>{s.name} · {grade(s.grade)}</option>)}</select></Field>
          <Field label={t('scanner.mealType')} htmlFor="sc-type"><select id="sc-type" className="input" value={mealType} onChange={(e) => setMealType(e.target.value)}>{['breakfast', 'lunch', 'snack'].map((m) => <option key={m} value={m}>{t(`mealType.${m}`)}</option>)}</select></Field>
          {student && <p className="text-sm text-ink-500 md:col-span-2">{student.latestGlucose ? t('scanner.studentHint', { v: student.latestGlucose.value }) : ''}</p>}
        </section>

        {!manual ? (<>
          <section className="card" aria-labelledby="up-t"><h2 id="up-t" className="mb-3 text-xl font-extrabold text-brand-900">{t('scanner.photo')}</h2>
            {preview && file ? (
              <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-center"><div className="relative"><img src={preview} alt={t('meal.photoAlt')} className="aspect-square w-full rounded-3xl object-cover" /><button type="button" className="absolute end-2 top-2 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-rose-700 shadow" onClick={() => { setFile(null); setPreview(null); }} aria-label={t('scanner.removePhoto')}><X className="h-5 w-5" aria-hidden /></button></div>
                <div className="space-y-3"><p className="text-sm text-ink-600">{file.name} · {(file.size / 1024).toFixed(0)} KB</p><button className="btn-primary w-full sm:w-auto" onClick={() => run({ kind: 'image', file })}><Sparkles className="h-5 w-5" aria-hidden />{t('scanner.analyze')}</button></div></div>
            ) : (
              <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files?.[0]); }}
                className={`rounded-3xl border-2 border-dashed p-8 text-center transition ${drag ? 'border-mint-500 bg-mint-50' : 'border-brand-300 bg-white/60'}`}>
                <UploadCloud className="mx-auto h-12 w-12 text-brand-500" aria-hidden /><p className="mt-3 text-lg font-bold text-brand-900">{t('scanner.drop')}</p><p className="text-sm text-ink-500">{t('scanner.formats')}</p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <button type="button" className="btn-primary" onClick={() => fileRef.current?.click()}><ImagePlus className="h-5 w-5" aria-hidden />{t('scanner.upload')}</button>
                  <button type="button" className="btn-soft" onClick={() => (typeof navigator.mediaDevices?.getUserMedia === 'function' ? setCamOpen(true) : capRef.current?.click())}><Camera className="h-5 w-5" aria-hidden />{t('scanner.camera')}</button>
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t('scanner.upload')} tabIndex={-1} onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ''; }} />
                <input ref={capRef} type="file" accept="image/*" capture="environment" className="sr-only" aria-label={t('scanner.camera')} tabIndex={-1} onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ''; }} />
              </div>)}
            {!opts.data.aiConfigured && <p className="mt-3 text-xs text-ink-500">{t('scanner.demoModeNote')}</p>}
          </section>

          <section className="card" aria-labelledby="dm-t"><h2 id="dm-t" className="mb-1 text-xl font-extrabold text-brand-900">{t('scanner.demoMeals')}</h2><p className="mb-4 text-sm text-ink-600">{t('scanner.demoMealsHint')}</p>
            <div className="grid gap-3 md:grid-cols-3">{opts.data.demoMeals.map((m, i) => (
              <button key={m.id} type="button" onClick={() => run({ kind: 'demo', id: m.id })} className="group flex min-h-[96px] items-center gap-4 rounded-3xl bg-gradient-to-br from-white to-brand-50 p-4 text-start ring-1 ring-brand-200 transition hover:-translate-y-0.5 hover:shadow-glow">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-mint-500 text-lg font-extrabold text-white">{i + 1}</span><span className="font-bold text-brand-950">{bi(m.title)}</span></button>))}</div>
            <button type="button" className="btn-ghost mt-3" onClick={() => setManual(true)}><ListChecks className="h-5 w-5" aria-hidden />{t('scanner.chooseManually')}</button>
          </section>
        </>) : (
          <section className="card space-y-4" aria-labelledby="mf-t"><div className="flex items-center justify-between"><h2 id="mf-t" className="text-xl font-extrabold text-brand-900">{t('scanner.chooseManually')}</h2><button className="btn-ghost btn-sm" onClick={() => setManual(false)}>{t('common.cancel')}</button></div>
            <p className="text-sm text-ink-600">{t('scanner.manualHint')}</p>
            <div className="relative"><Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" aria-hidden /><input type="search" className="input ps-12" placeholder={t('scanner.searchFood')} aria-label={t('scanner.searchFood')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <ul className="grid max-h-[420px] gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{foods.map((f) => { const on = picked.includes(f.key); return (
              <li key={f.key}><button type="button" aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== f.key) : [...p, f.key]))} className={`flex min-h-[56px] w-full items-center justify-between gap-2 rounded-2xl px-4 py-2 text-start ring-1 transition ${on ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white ring-brand-200 hover:bg-brand-50'}`}>
                <span><span className="block font-bold">{bi(f.name)}</span><span className={`text-xs ${on ? 'text-white/80' : 'text-ink-500'}`}>{bi(f.portion)}</span></span>{on && <CheckCircle2 className="h-5 w-5" aria-hidden />}</button></li>); })}</ul>
            <button className="btn-primary" disabled={!picked.length} onClick={() => run({ kind: 'foods', keys: picked })}><Sparkles className="h-5 w-5" aria-hidden />{t('scanner.analyzeSelected', { n: picked.length })}</button>
          </section>)}
      </>)}
      <CameraCapture open={camOpen} onClose={() => setCamOpen(false)} onCapture={accept} onError={() => { toast(t('scanner.cameraDenied'), 'err'); capRef.current?.click(); }} />
    </div>
  );
}
