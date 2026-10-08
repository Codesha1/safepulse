import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, Eye, Mail, Plus, Trash2, UserPlus, Wand2, AlertTriangle } from 'lucide-react';
import { api, type RegisterPayload, type RegisterResult } from '../../services/api';
import { useI18n } from '../../i18n';
import { Field, InfoBanner, Modal, Spinner, useToast } from '../../components/ui';
import { ACTIVITY_TYPES, typeIcon } from '../../features/schedule/SchedulePanel';
import { EXAM_TYPES } from '../../features/schedule/ExamsPanel';
import { DAY_KEYS, SCHOOL_DAY_INDEXES, copyText, fmtClock, todayYmd } from '../../utils/format';
import { errorKey } from '../../utils/errors';
import { ApiError } from '../../services/api';

const MED = ['allergies', 'conditions', 'hypoHistory', 'hyperHistory', 'medicationInfo', 'foodRestrictions', 'activityConsiderations', 'emergencyInstructions', 'physicianContact', 'carePlanNotes'] as const;
const STEPS = ['general', 'medical', 'schedule', 'exams', 'parent', 'review'] as const;
type EventRow = { day: number; start: string; end: string; subject: string; classroom: string; type: string };
type ExamRow = { subject: string; date: string; time: string; type: string };
const emptyForm = () => ({
  student: { name: '', gradeNo: '', diabetesType: '', diagnosisDate: '' },
  medical: Object.fromEntries(MED.map((k) => [k, ''])) as Record<(typeof MED)[number], string>,
  schedule: [] as EventRow[], exams: [] as ExamRow[],
  parent: { name: '', relationship: 'mother', phone: '', email: '', preferredContact: 'app', emergencyContact: '' },
});
type Form = ReturnType<typeof emptyForm>;
const TEMPLATE: [string, string, string, string, string][] = [
  ['07:30', '08:15', 'Mathematics', 'Room 204', 'class'], ['08:15', '09:00', 'Science', 'Lab 2', 'class'], ['09:00', '09:30', 'Break', 'Courtyard', 'break'],
  ['09:30', '10:30', 'Art', 'Room 110', 'class'], ['10:30', '11:30', 'English', 'Room 207', 'class'], ['11:30', '12:00', 'Lunch', 'Cafeteria', 'lunch'], ['12:00', '13:00', 'Social Studies', 'Room 301', 'class'],
];

export default function RegisterStudent() {
  const { t, lang, tx, place } = useI18n(); const toast = useToast();
  const [step, setStep] = useState(0); const [f, setF] = useState<Form>(emptyForm); const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const [result, setResult] = useState<RegisterResult | null>(null); const [preview, setPreview] = useState(false); const [serverErr, setServerErr] = useState<string | null>(null);
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => { head.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step, result]);

  const set = <K extends keyof Form>(k: K, v: Partial<Form[K]>) => setF((s) => ({ ...s, [k]: { ...(s[k] as object), ...(v as object) } }));
  const E = (k: string) => errs[k] || null;

  const validate = (i: number): Record<string, string> => {
    const e: Record<string, string> = {}; const req = t('errors.required');
    if (i === 0) { if (!f.student.name.trim()) e.name = req; if (!f.student.gradeNo) e.grade = req; if (f.student.diagnosisDate && f.student.diagnosisDate > todayYmd()) e.diagnosisDate = t('errors.futureDate'); }
    if (i === 4) { if (!f.parent.name.trim()) e.pname = req; if (!f.parent.email.trim()) e.pemail = req; else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.parent.email.trim())) e.pemail = t('errors.email'); }
    return e;
  };
  const go = (n: number) => { if (n > step) { const e = validate(step); setErrs(e); if (Object.keys(e).length) return; } setErrs({}); setStep(n); };

  const submit = async () => {
    const e0 = validate(0), e4 = validate(4); setErrs({ ...e0, ...e4 });
    if (Object.keys(e0).length) return setStep(0); if (Object.keys(e4).length) return setStep(4);
    setBusy(true); setServerErr(null);
    const payload: RegisterPayload = {
      student: { name: f.student.name.trim(), grade: `Grade ${f.student.gradeNo}`, diabetesType: f.student.diabetesType, diagnosisDate: f.student.diagnosisDate },
      medical: f.medical, schedule: f.schedule.map((s) => ({ day: s.day, start: s.start, end: s.end || undefined, subject: s.subject, classroom: s.classroom || undefined, type: s.type })),
      exams: f.exams.map((x) => ({ subject: x.subject, date: x.date, time: x.time, type: t(`examType.${x.type}`) })),
      parent: { ...f.parent, name: f.parent.name.trim(), email: f.parent.email.trim().toLowerCase(), relationship: f.parent.relationship.toLowerCase() },
    };
    try { setResult(await api.register(payload)); window.dispatchEvent(new Event('sp:notifications')); }
    catch (x) { setServerErr(t(errorKey(x))); if (x instanceof ApiError && x.code === 'EMAIL_IN_USE') { setStep(4); setErrs({ pemail: t('errors.emailInUse') }); } }
    finally { setBusy(false); }
  };

  if (result) return <Done result={result} name={f.student.name} onAnother={() => { setResult(null); setF(emptyForm()); setStep(0); }} preview={preview} setPreview={setPreview} />;

  const label = (k: string) => t(`step.${k}`);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div><h1 className="h-page">{t('register.title')}</h1><p className="mt-1 text-ink-600">{t('register.sub')}</p></div>
      <nav aria-label={t('register.progress')}><ol className="flex gap-2 overflow-x-auto pb-1">{STEPS.map((s, i) => (
        <li key={s} className="shrink-0"><button type="button" onClick={() => go(i)} aria-current={i === step ? 'step' : undefined}
          className={`flex min-h-[48px] items-center gap-2 rounded-2xl px-3.5 text-sm font-bold ring-1 transition ${i === step ? 'bg-brand-700 text-white ring-brand-700' : i < step ? 'bg-mint-100 text-mint-800 ring-mint-300' : 'bg-white/80 text-ink-500 ring-brand-200'}`}>
          <span className={`grid h-7 w-7 place-items-center rounded-full text-xs ${i === step ? 'bg-white text-brand-800' : i < step ? 'bg-mint-600 text-white' : 'bg-brand-100 text-brand-700'}`}>{i < step ? <Check className="h-4 w-4" aria-hidden /> : i + 1}</span>{label(s)}</button></li>))}</ol></nav>
      <div className="h-1.5 overflow-hidden rounded-full bg-brand-100" aria-hidden><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-mint-500 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>

      <section className="card space-y-5" aria-labelledby="step-h">
        <h2 id="step-h" ref={head} tabIndex={-1} className="text-xl font-extrabold text-brand-900 outline-none">{t('register.stepOf', { n: step + 1, total: STEPS.length })} — {label(STEPS[step])}</h2>

        {step === 0 && (<div className="grid gap-4 md:grid-cols-2">
          <Field label={t('field.studentName')} htmlFor="r-name" error={E('name')} required><input id="r-name" className="input" value={f.student.name} onChange={(e) => set('student', { name: e.target.value })} maxLength={100} autoComplete="off" aria-invalid={!!E('name')} /></Field>
          <Field label={t('field.grade')} htmlFor="r-grade" error={E('grade')} required><select id="r-grade" className="input" value={f.student.gradeNo} onChange={(e) => set('student', { gradeNo: e.target.value })} aria-invalid={!!E('grade')}><option value="">{t('common.select')}</option>{Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{t('grade.fmt').replace('{n}', String(n))}</option>)}</select></Field>
          <Field label={t('field.diabetesType')} htmlFor="r-dx"><select id="r-dx" className="input" value={f.student.diabetesType} onChange={(e) => set('student', { diabetesType: e.target.value })}><option value="">{t('common.select')}</option>{['type1', 'type2', 'other', 'unspecified'].map((x) => <option key={x} value={x}>{t(`diabetes.${x}`)}</option>)}</select></Field>
          <Field label={t('field.diagnosisDate')} htmlFor="r-dd" error={E('diagnosisDate')}><input id="r-dd" type="date" max={todayYmd()} className="input" dir="ltr" value={f.student.diagnosisDate} onChange={(e) => set('student', { diagnosisDate: e.target.value })} /></Field>
        </div>)}

        {step === 1 && (<><InfoBanner tone="amber">{t('register.medicalNote')}</InfoBanner>
          <div className="grid gap-4 md:grid-cols-2">{MED.map((k) => <Field key={k} label={t(`medical.${k}`)} htmlFor={`m-${k}`}><textarea id={`m-${k}`} className="input" rows={k === 'carePlanNotes' || k === 'emergencyInstructions' ? 4 : 3} maxLength={1500} value={f.medical[k]} onChange={(e) => set('medical', { [k]: e.target.value } as any)} /></Field>)}</div></>)}

        {step === 2 && <ScheduleStep rows={f.schedule} onChange={(rows) => setF((s) => ({ ...s, schedule: rows }))} />}
        {step === 3 && <ExamStep rows={f.exams} onChange={(rows) => setF((s) => ({ ...s, exams: rows }))} />}

        {step === 4 && (<div className="grid gap-4 md:grid-cols-2">
          <Field label={t('field.parentName')} htmlFor="p-name" error={E('pname')} required><input id="p-name" className="input" value={f.parent.name} onChange={(e) => set('parent', { name: e.target.value })} maxLength={100} aria-invalid={!!E('pname')} /></Field>
          <Field label={t('field.relationship')} htmlFor="p-rel"><select id="p-rel" className="input" value={f.parent.relationship} onChange={(e) => set('parent', { relationship: e.target.value })}>{['mother', 'father', 'guardian', 'other'].map((x) => <option key={x} value={x}>{t(`relationship.${x}`)}</option>)}</select></Field>
          <Field label={t('field.phone')} htmlFor="p-phone"><input id="p-phone" type="tel" inputMode="tel" className="input" dir="ltr" value={f.parent.phone} onChange={(e) => set('parent', { phone: e.target.value })} maxLength={40} autoComplete="off" /></Field>
          <Field label={t('field.email')} htmlFor="p-email" hint={t('register.emailHint')} error={E('pemail')} required><input id="p-email" type="email" className="input" dir="ltr" value={f.parent.email} onChange={(e) => set('parent', { email: e.target.value })} maxLength={200} autoComplete="off" aria-invalid={!!E('pemail')} /></Field>
          <Field label={t('field.preferredContact')} htmlFor="p-pc"><select id="p-pc" className="input" value={f.parent.preferredContact} onChange={(e) => set('parent', { preferredContact: e.target.value })}>{['app', 'phone', 'sms', 'email'].map((x) => <option key={x} value={x}>{t(`contact.${x}`)}</option>)}</select></Field>
          <Field label={t('field.emergencyContact')} htmlFor="p-ec" hint={t('register.emergencyHint')}><input id="p-ec" className="input" value={f.parent.emergencyContact} onChange={(e) => set('parent', { emergencyContact: e.target.value })} maxLength={200} /></Field>
        </div>)}

        {step === 5 && (<div className="space-y-4">
          <p className="text-ink-600">{t('register.reviewHint')}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Summary title={label('general')} onEdit={() => setStep(0)} rows={[[t('field.studentName'), f.student.name], [t('field.grade'), f.student.gradeNo ? t('grade.fmt').replace('{n}', f.student.gradeNo) : ''], [t('field.diabetesType'), f.student.diabetesType ? t(`diabetes.${f.student.diabetesType}`) : ''], [t('field.diagnosisDate'), f.student.diagnosisDate]]} />
            <Summary title={label('parent')} onEdit={() => setStep(4)} rows={[[t('field.parentName'), f.parent.name], [t('field.relationship'), t(`relationship.${f.parent.relationship}`)], [t('field.email'), f.parent.email], [t('field.phone'), f.parent.phone], [t('field.preferredContact'), t(`contact.${f.parent.preferredContact}`)]]} />
            <Summary title={label('medical')} onEdit={() => setStep(1)} rows={[[t('register.fieldsFilled'), `${Object.values(f.medical).filter((v) => v.trim()).length} / ${MED.length}`]]} />
            <Summary title={`${label('schedule')} · ${label('exams')}`} onEdit={() => setStep(2)} rows={[[t('register.scheduleItems'), String(f.schedule.length)], [t('register.examItems'), String(f.exams.length)]]} />
          </div>
          <InfoBanner>{t('register.accountNote')}</InfoBanner>
          {serverErr && <div role="alert" className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"><AlertTriangle className="h-5 w-5" aria-hidden />{serverErr}</div>}
        </div>)}

      </section>
    </div>
  );
}

function Summary({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit: () => void }) {
  const { t } = useI18n();
  return (<section className="rounded-3xl bg-white/80 p-4 ring-1 ring-brand-100"><div className="mb-2 flex items-center justify-between"><h3 className="font-extrabold text-brand-900">{title}</h3><button type="button" className="text-sm font-bold text-brand-700 hover:underline" onClick={onEdit}>{t('common.edit')}</button></div>
    <dl className="space-y-1 text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-ink-500">{k}</dt><dd className="break-all text-end font-bold text-brand-950">{v || '—'}</dd></div>)}</dl></section>);
}

function ScheduleStep({ rows, onChange }: { rows: EventRow[]; onChange: (r: EventRow[]) => void }) {
  const { t, lang, tx, place } = useI18n(); const [pe, setPe] = useState<number[]>([]); const [e, setE] = useState<EventRow>({ day: 0, start: '08:00', end: '', subject: '', classroom: '', type: 'class' }); const [err, setErr] = useState<string | null>(null);
  const fill = () => onChange(SCHOOL_DAY_INDEXES.flatMap((d) => TEMPLATE.map(([s, en, sub, room, type]) => (sub === 'Art' && pe.includes(d) ? { day: d, start: s, end: en, subject: 'PE', classroom: 'Gymnasium', type: 'pe' } : { day: d, start: s, end: en, subject: sub, classroom: room, type }))));
  const add = () => { if (!e.subject.trim()) return setErr(t('errors.required')); if (e.end && e.end <= e.start) return setErr(t('schedule.timeOrder')); setErr(null); onChange([...rows, { ...e, subject: e.subject.trim() }]); setE({ ...e, subject: '', classroom: '' }); };
  return (<div className="space-y-5">
    <div className="rounded-3xl bg-gradient-to-br from-brand-50 to-mint-50 p-4 ring-1 ring-brand-100"><h3 className="flex items-center gap-2 font-extrabold text-brand-900"><Wand2 className="h-5 w-5" aria-hidden />{t('schedule.quickFill')}</h3><p className="mt-1 text-sm text-ink-600">{t('schedule.quickFillHint')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={t('schedule.peDays')}><span className="text-sm font-bold text-ink-700">{t('schedule.peDays')}:</span>{SCHOOL_DAY_INDEXES.map((d) => <button key={d} type="button" aria-pressed={pe.includes(d)} onClick={() => setPe((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))} className={`min-h-[40px] rounded-xl px-3 text-sm font-bold ring-1 ${pe.includes(d) ? 'bg-mint-600 text-white ring-mint-600' : 'bg-white text-brand-800 ring-brand-200'}`}>{t(`day.${DAY_KEYS[d]}`)}</button>)}</div>
      <button type="button" className="btn-primary btn-sm mt-3" onClick={fill}><Wand2 className="h-4 w-4" aria-hidden />{t('schedule.fill')}</button></div>
    <div className="grid gap-3 rounded-3xl bg-white/70 p-4 ring-1 ring-brand-100 sm:grid-cols-2 lg:grid-cols-3">
      <Field label={t('field.day')} htmlFor="s-day"><select id="s-day" className="input" value={e.day} onChange={(x) => setE({ ...e, day: Number(x.target.value) })}>{SCHOOL_DAY_INDEXES.map((d) => <option key={d} value={d}>{t(`day.${DAY_KEYS[d]}`)}</option>)}</select></Field>
      <Field label={t('field.startTime')} htmlFor="s-st"><input id="s-st" type="time" className="input" dir="ltr" value={e.start} onChange={(x) => setE({ ...e, start: x.target.value })} /></Field>
      <Field label={t('field.endTime')} htmlFor="s-en"><input id="s-en" type="time" className="input" dir="ltr" value={e.end} onChange={(x) => setE({ ...e, end: x.target.value })} /></Field>
      <Field label={t('field.subject')} htmlFor="s-sub" error={err} required><input id="s-sub" className="input" value={e.subject} onChange={(x) => setE({ ...e, subject: x.target.value })} maxLength={80} /></Field>
      <Field label={t('field.classroom')} htmlFor="s-room"><input id="s-room" className="input" value={e.classroom} onChange={(x) => setE({ ...e, classroom: x.target.value })} maxLength={60} /></Field>
      <Field label={t('field.activityType')} htmlFor="s-type"><select id="s-type" className="input" value={e.type} onChange={(x) => setE({ ...e, type: x.target.value })}>{ACTIVITY_TYPES.map((a) => <option key={a} value={a}>{t(`activity.${a}`)}</option>)}</select></Field>
      <div className="sm:col-span-2 lg:col-span-3"><button type="button" className="btn-soft" onClick={add}><Plus className="h-5 w-5" aria-hidden />{t('schedule.add')}</button></div></div>
    {rows.length > 0 && (<div className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-extrabold text-brand-900">{t('register.scheduleItems')}: {rows.length}</h3><button type="button" className="btn-ghost btn-sm text-rose-700" onClick={() => onChange([])}>{t('common.clearAll')}</button></div>
      {SCHOOL_DAY_INDEXES.map((d) => { const list = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.day === d).sort((a, b) => a.r.start.localeCompare(b.r.start)); if (!list.length) return null; return (
        <div key={d}><h4 className="mb-1 text-sm font-bold text-ink-500">{t(`day.${DAY_KEYS[d]}`)}</h4><ul className="space-y-1.5">{list.map(({ r, i }) => { const { Icon, cls } = typeIcon(r.type); return (
          <li key={i} className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-brand-100"><span className={`grid h-9 w-9 place-items-center rounded-xl ${cls}`}><Icon className="h-4 w-4" aria-hidden /></span><span className="w-20 text-sm font-bold" dir="ltr">{fmtClock(r.start, lang)}</span><span className="min-w-0 flex-1 truncate font-semibold">{tx('subject', r.subject)}{r.classroom && <span className="font-normal text-ink-500"> · {place(r.classroom)}</span>}</span>
            <button type="button" className="btn-ghost btn-sm !px-2 text-rose-700" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`${t('common.delete')} ${r.subject}`}><Trash2 className="h-4 w-4" aria-hidden /></button></li>); })}</ul></div>); })}</div>)}
  </div>);
}

function ExamStep({ rows, onChange }: { rows: ExamRow[]; onChange: (r: ExamRow[]) => void }) {
  const { t, fmtDate, lang } = useI18n(); const [e, setE] = useState<ExamRow>({ subject: '', date: todayYmd(), time: '12:00', type: 'monthly' }); const [err, setErr] = useState<string | null>(null);
  const add = () => { if (!e.subject.trim() || !e.date) return setErr(t('errors.required')); setErr(null); onChange([...rows, { ...e, subject: e.subject.trim() }]); setE({ ...e, subject: '' }); };
  return (<div className="space-y-5"><div className="grid gap-3 rounded-3xl bg-white/70 p-4 ring-1 ring-brand-100 sm:grid-cols-2">
    <Field label={t('field.subject')} htmlFor="x-sub" error={err} required><input id="x-sub" className="input" value={e.subject} onChange={(x) => setE({ ...e, subject: x.target.value })} maxLength={80} /></Field>
    <Field label={t('field.examType')} htmlFor="x-type"><select id="x-type" className="input" value={e.type} onChange={(x) => setE({ ...e, type: x.target.value })}>{EXAM_TYPES.map((x) => <option key={x} value={x}>{t(`examType.${x}`)}</option>)}</select></Field>
    <Field label={t('field.date')} htmlFor="x-date" required><input id="x-date" type="date" className="input" dir="ltr" value={e.date} onChange={(x) => setE({ ...e, date: x.target.value })} /></Field>
    <Field label={t('field.time')} htmlFor="x-time"><input id="x-time" type="time" className="input" dir="ltr" value={e.time} onChange={(x) => setE({ ...e, time: x.target.value })} /></Field>
    <div className="sm:col-span-2"><button type="button" className="btn-soft" onClick={add}><Plus className="h-5 w-5" aria-hidden />{t('exams.add')}</button></div></div>
    {rows.length > 0 && <ul className="space-y-2">{rows.map((r, i) => (<li key={i} className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-brand-100"><div className="min-w-0 flex-1"><p className="font-bold">{r.subject}</p><p className="text-sm text-ink-500">{fmtDate(r.date)} · <span dir="ltr">{fmtClock(r.time, lang)}</span> · {t(`examType.${r.type}`)}</p></div><button type="button" className="btn-ghost btn-sm !px-2 text-rose-700" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`${t('common.delete')} ${r.subject}`}><Trash2 className="h-4 w-4" aria-hidden /></button></li>))}</ul>}
  </div>);
}

function Done({ result, name, onAnother, preview, setPreview }: { result: RegisterResult; name: string; onAnother: () => void; preview: boolean; setPreview: (b: boolean) => void }) {
  const { t } = useI18n(); const toast = useToast(); const [copied, setCopied] = useState(false); const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => head.current?.focus(), []);
  const copy = async () => { if (result.tempPassword && (await copyText(result.tempPassword))) { setCopied(true); toast(t('register.copied')); setTimeout(() => setCopied(false), 2500); } };
  const em = result.email;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="card space-y-5 text-center" aria-labelledby="done-h">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-mint-400 to-mint-600 text-white shadow-mint"><CheckCircle2 className="h-10 w-10" aria-hidden /></div>
        <h1 id="done-h" ref={head} tabIndex={-1} className="text-3xl font-extrabold text-brand-950 outline-none">{t('register.doneTitle')}</h1>
        <p className="text-ink-600">{t('register.doneBody', { name })}</p>
      </section>
      {result.newAccount && result.tempPassword ? (
        <section className="card space-y-4" aria-labelledby="cred-h"><h2 id="cred-h" className="text-xl font-extrabold text-brand-900">{t('register.credentials')}</h2>
          <dl className="grid gap-3 rounded-3xl bg-brand-50 p-4 sm:grid-cols-2"><div><dt className="text-sm font-semibold text-ink-500">{t('field.email')}</dt><dd className="break-all font-bold" dir="ltr">{result.parentEmail}</dd></div>
            <div><dt className="text-sm font-semibold text-ink-500">{t('register.tempPassword')}</dt><dd className="flex items-center gap-2"><code className="rounded-xl bg-white px-3 py-1.5 text-xl font-extrabold tracking-wider text-brand-800 ring-1 ring-brand-200" dir="ltr">{result.tempPassword}</code>
              <button type="button" className="btn-soft btn-sm" onClick={copy}>{copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{t('register.copy')}</button></dd></div></dl>
          <InfoBanner tone="amber">{t('register.showOnce')}</InfoBanner>
          {em?.sent ? <InfoBanner tone="mint"><span className="flex items-center gap-2 font-bold"><Mail className="h-4 w-4" aria-hidden />{t('register.emailSent', { email: result.parentEmail })}</span></InfoBanner>
            : <div className="space-y-3"><InfoBanner tone="amber"><b>{t('register.emailNotSent')}</b> {t(em?.configured ? 'register.emailFailed' : 'register.emailNotConfigured')}</InfoBanner></div>}
        </section>
      ) : <InfoBanner tone="mint">{t('register.siblingLinked', { email: result.parentEmail })}</InfoBanner>}
      <div className="flex flex-wrap gap-3"><Link to={`/nurse/students/${result.studentId}`} className="btn-primary">{t('register.openProfile')}</Link><Link to={`/nurse/meals?student=${result.studentId}`} className="btn-mint">{t('action.analyze')}</Link><button type="button" className="btn-soft" onClick={onAnother}>{t('register.another')}</button></div>
      <Modal open={preview} onClose={() => setPreview(false)} title={t('register.emailPreviewTitle')} wide>
        <p className="mb-3 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">{t('register.previewNote')}</p>
        <p className="mb-2 text-sm text-ink-500"><b>{t('register.subject')}:</b> {em?.preview?.subject}</p>
        <iframe title={t('register.emailPreviewTitle')} sandbox="" srcDoc={em?.preview?.html} className="h-[460px] w-full rounded-2xl border border-brand-100 bg-white" />
      </Modal>
    </div>
  );
}