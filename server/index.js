import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { config } from './config.js';
import { db } from './db/index.js';
import { loadUser } from './middleware/auth.js';
import { seedIfEmpty } from './db/seed.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import mealRoutes from './routes/meals.js';
import miscRoutes from './routes/misc.js';
import { aiConfigured } from './services/ai/index.js';
import { emailConfigured } from './services/email.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // behind nginx / hosting proxy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],      // email preview iframe (srcdoc)
      objectSrc: ["'none'"],
      upgradeInsecureRequests: config.cookieSecure ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use(loadUser);

// CSRF defence for cookie auth: state-changing requests must come from our own origin.
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && new URL(origin).host !== req.get('host')) return res.status(403).json({ error: 'FORBIDDEN' });
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, demoMode: config.demoMode, ai: aiConfigured() ? 'connected' : 'demo', email: emailConfigured() ? 'connected' : 'preview' }));
// Locates the team / school-logo images the owner dropped into client/public/assets (or dist/assets after a build).
app.get('/api/brand', (_req, res) => {
  const dirs = [path.join(config.root, 'dist', 'assets'), path.join(config.root, 'client', 'public', 'assets')];
  const find = (kind) => {
    for (const ext of kind === 'team' ? ['jpg', 'jpeg', 'png', 'webp', 'svg'] : ['png', 'jpg', 'jpeg', 'webp', 'svg']) {
      for (const d of dirs) { const f = path.join(d, `${kind}.${ext}`); if (fs.existsSync(f)) return `/assets/${kind}.${ext}?v=${Math.round(fs.statSync(f).mtimeMs)}`; }
    }
    return null;
  };
  res.set('Cache-Control', 'no-cache').json({ team: find('team'), logo: find('logo') });
});
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api', miscRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

// Built frontend
const dist = path.join(config.root, 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '7d', index: false, setHeaders: (res, p) => { if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
  app.get('*', (req, res) => {
    if (path.extname(req.path)) return res.status(404).end(); // missing asset (e.g. /assets/team.jpg) → real 404, not the app shell
    res.set('Cache-Control', 'no-cache').sendFile(path.join(dist, 'index.html'));
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'SERVER_ERROR' });
});

if (config.demoMode) seedIfEmpty();

app.listen(config.port, () => {
  console.log(`\n  SafePulse running → ${config.appUrl}  (${config.isProd ? 'production' : 'development'}, demo mode ${config.demoMode ? 'ON' : 'off'})`);
  console.log(`  AI: ${aiConfigured() ? 'vision API connected' : 'demo estimates'} · Email: ${emailConfigured() ? 'connected' : 'preview only'}\n`);
  if (!fs.existsSync(dist)) console.log('  (No ./dist folder yet — run "npm run build", or use "npm run dev" for the live dev server.)\n');
});
export { db };
