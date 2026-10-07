import { useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '../../i18n';
import { DAY_KEYS } from '../../utils/format';
import type { Exam, Glucose } from '../../services/types';

const C = { brand: '#7c3aed', mint: '#10b981', amber: '#f59e0b', grid: '#e9e5ff', text: '#3b3a5c' };
const dayStart = (ymd: string) => new Date(ymd + 'T00:00:00').getTime();
const ymdOf = (ts: number) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function Tip({ active, payload, unit, label }: any) {
  const { fmtDate, fmtTime, t } = useI18n();
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm shadow-xl">
      {p.ts ? <p className="font-bold text-brand-900">{fmtDate(new Date(p.ts).toISOString(), { day: 'numeric', month: 'short' })} · {fmtTime(new Date(p.ts).toISOString())}</p> : <p className="font-bold text-brand-900">{label}</p>}
      {payload.map((x: any) => <p key={x.dataKey} className="text-ink-700">{x.name}: <b>{Math.round(x.value)}</b> {unit ?? t('unit.mgdl')}</p>)}
    </div>
  );
}

/** Glucose over time with exam days and PE days shaded. */
export function GlucoseLineChart({ readings, exams, peDays, days }: { readings: Glucose[]; exams: Exam[]; peDays: number[]; days: number }) {
  const { t, fmtDate } = useI18n();
  const data = useMemo(() => readings.map((r) => ({ ts: new Date(r.recordedAt).getTime(), v: r.value })), [readings]);
  const { from, to } = useMemo(() => { const to = Date.now(); return { from: to - days * 864e5, to }; }, [days, readings]);
  const examAreas = exams.map((e) => dayStart(e.date)).filter((s) => s >= from - 864e5 && s <= to);
  const peAreas = useMemo(() => {
    const out: number[] = []; for (let s = dayStart(ymdOf(from)); s <= to; s += 864e5) { if (peDays.includes(new Date(s + 3600e3).getDay())) out.push(s); } return out;
  }, [from, to, peDays]);
  return (
    <div dir="ltr" className="h-72 w-full" role="img" aria-label={t('chart.glucoseAria')}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          {peAreas.map((s) => <ReferenceArea key={'p' + s} x1={s} x2={s + 864e5} fill={C.mint} fillOpacity={0.1} />)}
          {examAreas.map((s) => <ReferenceArea key={'e' + s} x1={s} x2={s + 864e5} fill={C.amber} fillOpacity={0.22} />)}
          <XAxis dataKey="ts" type="number" scale="time" domain={[from, to]} tickFormatter={(v) => fmtDate(new Date(v).toISOString(), { day: 'numeric', month: 'short' })} tick={{ fill: C.text, fontSize: 12 }} tickCount={6} minTickGap={24} />
          <YAxis domain={[50, 'dataMax + 20']} tick={{ fill: C.text, fontSize: 12 }} width={44} />
          <Tooltip content={<Tip />} />
          <Line type="monotone" dataKey="v" name={t('chart.glucose')} stroke={C.brand} strokeWidth={2.5} dot={{ r: 2.5, fill: C.brand }} activeDot={{ r: 5 }} isAnimationActive />
        </LineChart>
      </ResponsiveContainer>
      <ul className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs font-semibold text-ink-700" dir={document.documentElement.dir}>
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-5 rounded bg-brand-600" aria-hidden />{t('chart.glucose')}</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-amber-400/60" aria-hidden />{t('chart.examDay')}</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-mint-400/50" aria-hidden />{t('chart.peDay')}</li>
      </ul>
    </div>
  );
}

/** Weekly overview: average reading per school day. */
export function WeeklyOverview({ readings }: { readings: Glucose[] }) {
  const { t } = useI18n();
  const data = useMemo(() => [0, 1, 2, 3, 4].map((dow) => {
    const xs = readings.filter((r) => new Date(r.recordedAt).getDay() === dow).map((r) => r.value);
    return { name: t(`day.${DAY_KEYS[dow]}`), avg: xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0, n: xs.length };
  }), [readings, t]);
  return (
    <div dir="ltr" className="h-60 w-full" role="img" aria-label={t('chart.weeklyAria')}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: C.text, fontSize: 12 }} /><YAxis domain={[0, 'dataMax + 20']} tick={{ fill: C.text, fontSize: 12 }} width={44} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(124,58,237,.06)' }} />
          <Bar dataKey="avg" name={t('chart.average')} radius={[10, 10, 0, 0]}>{data.map((_, i) => <Cell key={i} fill={i % 2 ? C.brand : '#8b5cf6'} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Average reading on exam days / PE days / other days. */
export function DayTypeChart({ readings, exams, peDays }: { readings: Glucose[]; exams: Exam[]; peDays: number[] }) {
  const { t } = useI18n();
  const data = useMemo(() => {
    const ex = new Set(exams.map((e) => e.date)); const g: Record<'exam' | 'pe' | 'other', number[]> = { exam: [], pe: [], other: [] };
    readings.forEach((r) => { const d = new Date(r.recordedAt); const k = ymdOf(d.getTime()); (ex.has(k) ? g.exam : peDays.includes(d.getDay()) ? g.pe : g.other).push(r.value); });
    const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    return [{ name: t('chart.examDays'), avg: avg(g.exam), n: g.exam.length, fill: C.amber }, { name: t('chart.peDays'), avg: avg(g.pe), n: g.pe.length, fill: C.mint }, { name: t('chart.otherDays'), avg: avg(g.other), n: g.other.length, fill: C.brand }];
  }, [readings, exams, peDays, t]);
  return (
    <div dir="ltr" className="h-60 w-full" role="img" aria-label={t('chart.dayTypeAria')}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} horizontal={false} />
          <XAxis type="number" domain={[0, 'dataMax + 20']} tick={{ fill: C.text, fontSize: 12 }} /><YAxis type="category" dataKey="name" width={96} tick={{ fill: C.text, fontSize: 12 }} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(124,58,237,.06)' }} />
          <Bar dataKey="avg" name={t('chart.average')} radius={[0, 10, 10, 0]}>{data.map((d, i) => <Cell key={i} fill={d.fill} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Estimated carbs per recorded meal (prototype estimate). */
export function CarbChart({ meals }: { meals: { createdAt: string; nutrition: { carbs: number }; status: 'GREEN' | 'YELLOW' | 'RED' }[] }) {
  const { t, fmtDate } = useI18n();
  const data = useMemo(() => [...meals].reverse().map((m) => ({ name: fmtDate(m.createdAt, { day: 'numeric', month: 'short' }), carbs: m.nutrition.carbs, status: m.status })), [meals, fmtDate]);
  const col = { GREEN: C.mint, YELLOW: C.amber, RED: '#e11d48' } as const;
  return (
    <div dir="ltr" className="h-64 w-full" role="img" aria-label={t('chart.carbAria')}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: C.text, fontSize: 11 }} interval="preserveStartEnd" minTickGap={14} /><YAxis tick={{ fill: C.text, fontSize: 12 }} width={44} unit="g" />
          <Tooltip content={<Tip unit="g" />} cursor={{ fill: 'rgba(124,58,237,.06)' }} />
          <Bar dataKey="carbs" name={t('chart.carbs')} radius={[8, 8, 0, 0]}>{data.map((d, i) => <Cell key={i} fill={col[d.status]} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
      <ul className="mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs font-semibold text-ink-700" dir={document.documentElement.dir}>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-mint-500" aria-hidden />{t('status.green')}</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-amber-500" aria-hidden />{t('status.yellow')}</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-rose-600" aria-hidden />{t('status.red')}</li>
      </ul>
    </div>
  );
}

export function Sparkline({ readings }: { readings: Glucose[] }) {
  const data = readings.slice(-24).map((r) => ({ v: r.value }));
  return (
    <div dir="ltr" className="h-14 w-full" aria-hidden>
      <ResponsiveContainer><AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs><linearGradient id="spk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.brand} stopOpacity={0.35} /><stop offset="1" stopColor={C.brand} stopOpacity={0} /></linearGradient></defs>
        <Area type="monotone" dataKey="v" stroke={C.brand} strokeWidth={2} fill="url(#spk)" isAnimationActive={false} /><YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
      </AreaChart></ResponsiveContainer>
    </div>
  );
}
export { Legend };
