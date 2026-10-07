import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import en from './en.json';
import ar from './ar.json';
import type { Bi } from '../services/types';

export type Lang = 'en' | 'ar';
const dicts: Record<Lang, any> = { en, ar };
const STORAGE_KEY = 'sp_lang';

function lookup(d: any, key: string): string | undefined {
  let cur = d;
  for (const part of key.split('.')) { if (cur == null) return undefined; cur = cur[part]; }
  return typeof cur === 'string' ? cur : undefined;
}

interface Ctx {
  lang: Lang; dir: 'ltr' | 'rtl'; isRtl: boolean; setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tIn: (l: Lang, key: string) => string;
  bi: (v: Bi | null | undefined) => string;
  /** Translate well-known stored values (subjects, rooms, exam types…) and fall back to the stored text. */
  tx: (prefix: string, value: string | null | undefined) => string;
  place: (value: string | null | undefined) => string;
  grade: (value: string | null | undefined) => string;
  fmtDate: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
  fmtTime: (iso: string) => string;
  fmtNum: (n: number, digits?: number) => string;
}
const I18nContext = createContext<Ctx>(null as unknown as Ctx);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en'; } catch { return 'en'; }
  });
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  useEffect(() => {
    document.documentElement.lang = lang; document.documentElement.dir = dir;
    document.title = lang === 'ar' ? 'SafePulse — رعاية أذكى، وأيام دراسية أكثر أمانًا' : 'SafePulse — Smarter Care. Safer School Days.';
  }, [lang, dir]);
  const setLang = useCallback((l: Lang) => { setLangState(l); try { localStorage.setItem(STORAGE_KEY, l); } catch { /* private mode */ } }, []);

  const value = useMemo<Ctx>(() => {
    const locale = lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB'; // Latin digits keep medical values unambiguous
    return {
      lang, dir, isRtl: lang === 'ar', setLang,
      t: (key, vars) => {
        let s = lookup(dicts[lang], key) ?? lookup(dicts.en, key) ?? key;
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
        return s;
      },
      tx: (prefix, v) => {
        if (!v) return '';
        const slug = v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        return lookup(dicts[lang], `${prefix}.${slug}`) ?? v;
      },
      place: (v) => {
        if (!v) return '';
        const m = v.match(/^(Room|Lab) (\d+)$/i);
        if (m) return (lookup(dicts[lang], `place.${m[1].toLowerCase()}`) ?? `${m[1]} {n}`).replace('{n}', m[2]);
        return lookup(dicts[lang], `place.${v.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`) ?? v;
      },
      grade: (v) => {
        if (!v) return '';
        const m = v.match(/^Grade (\d+)(?:-([A-Za-z]))?$/);
        if (!m) return v;
        return (lookup(dicts[lang], 'grade.fmt') ?? 'Grade {n}').replace('{n}', m[1]) + (m[2] ? `-${m[2]}` : '');
      },
      tIn: (l, key) => lookup(dicts[l], key) ?? lookup(dicts.en, key) ?? key,
      bi: (v) => (v ? v[lang] || v.en : ''),
      fmtDate: (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString(locale, opts),
      fmtTime: (iso) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: lang === 'en' ? false : true }),
      fmtNum: (n, digits = 0) => n.toLocaleString(locale, { maximumFractionDigits: digits }),
    };
  }, [lang, dir, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export const useI18n = () => useContext(I18nContext);
