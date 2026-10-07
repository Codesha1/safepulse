import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.TZ = process.env.TZ || 'Asia/Riyadh';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 3000);

let authSecret = process.env.AUTH_SECRET || '';
if (!authSecret) {
  if (isProd) {
    console.error('\n[SafePulse] AUTH_SECRET is missing. Copy .env.example to .env and set it.');
    console.error('Generate one with:  npm run gen-secret\n');
    process.exit(1);
  }
  authSecret = 'dev-only-secret-change-me';
  console.warn('[SafePulse] AUTH_SECRET not set — using an insecure development secret.');
}

export const config = {
  root, isProd, port, authSecret,
  appUrl: (process.env.APP_URL || `http://localhost:${port}`).replace(/\/$/, ''),
  demoMode: (process.env.DEMO_MODE ?? 'true') === 'true',
  demoPassword: process.env.DEMO_PASSWORD || 'SafePulse-Demo-2026',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  databasePath: path.resolve(root, process.env.DATABASE_PATH || './data/safepulse.db'),
  storageDir: path.resolve(root, process.env.STORAGE_DIR || './data/uploads'),
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'claude-sonnet-5-5',
  },
  email: {
    apiKey: process.env.EMAIL_API_KEY || '',
    from: process.env.EMAIL_FROM || 'SafePulse <onboarding@resend.dev>',
  },
};
