import { useEffect, useRef } from 'react';

/** Soft floating "AI" particles with faint links. Pauses when hidden / reduced motion. */
export function Particles({ tone = 'dark', density = 46 }: { tone?: 'dark' | 'light'; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext('2d'); if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0; const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const colors = tone === 'dark' ? ['196,181,253', '110,231,183', '255,255,255'] : ['124,58,237', '16,185,129'];
    type P = { x: number; y: number; vx: number; vy: number; r: number; c: string };
    let ps: P[] = [];
    const resize = () => {
      w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(density * Math.min(1, (w * h) / 900000 + 0.35));
      ps = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28, r: 1 + Math.random() * 2.2, c: colors[Math.floor(Math.random() * colors.length)] }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(${p.c},${tone === 'dark' ? 0.75 : 0.35})`; ctx.fill();
      }
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y, d = Math.hypot(dx, dy);
        if (d < 110) { ctx.strokeStyle = `rgba(${ps[i].c},${(1 - d / 110) * (tone === 'dark' ? 0.28 : 0.14)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke(); }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(); }); ro.observe(c);
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden && !reduce) raf = requestAnimationFrame(draw); };
    document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, [tone, density]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}

export function PulseLine({ className = '', color = '#6ee7b7', loop = false }: { className?: string; color?: string; loop?: boolean }) {
  return (
    <svg viewBox="0 0 600 80" preserveAspectRatio="none" className={className} aria-hidden fill="none">
      <path className={loop ? 'ecg-loop' : 'ecg-path'} d="M0 40h150l22-30 26 62 28-52 18 20h40l20-14 22 28 20-14h254" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  );
}
