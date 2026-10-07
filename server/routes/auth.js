import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { db } from '../db/index.js';
import { config } from '../config.js';
import { issueSession, clearSession, requireAuth } from '../middleware/auth.js';
import { buildResetEmail, sendEmail, emailConfigured } from '../services/email.js';
import { clean } from './lib.js';

const r = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'TOO_MANY_REQUESTS' } });
const DUMMY = bcrypt.hashSync('not-a-real-password', 10);
const userOut = (u) => ({ id: u.id, email: u.email, role: u.role, name: u.full_name, mustChangePassword: !!u.must_change_password, isDemo: !!u.is_demo });
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

r.get('/config', (_req, res) => res.json({ demoMode: config.demoMode }));

r.post('/login', limiter, (req, res) => {
  const email = clean(req.body?.email, 200)?.toLowerCase();
  const password = String(req.body?.password ?? '');
  const role = req.body?.role;
  if (!email || !password || !['NURSE', 'PARENT'].includes(role)) return res.status(400).json({ error: 'VALIDATION' });
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  const ok = bcrypt.compareSync(password, u ? u.password_hash : DUMMY);
  // Same error for wrong password, unknown email, or using the wrong portal → no account enumeration.
  if (!u || !ok || u.role !== role) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  issueSession(res, u);
  res.json({ user: userOut(u) });
});

// One-click demo login (server-side, so no password is ever shipped to the browser). DEMO_MODE only.
r.post('/demo', limiter, (req, res) => {
  if (!config.demoMode) return res.status(404).json({ error: 'NOT_FOUND' });
  const role = req.body?.role;
  if (!['NURSE', 'PARENT'].includes(role)) return res.status(400).json({ error: 'VALIDATION' });
  const u = db.prepare('SELECT * FROM users WHERE role=? AND is_demo=1 ORDER BY id LIMIT 1').get(role);
  if (!u) return res.status(404).json({ error: 'DEMO_NOT_SEEDED' });
  issueSession(res, u);
  res.json({ user: userOut(u) });
});

r.post('/logout', (_req, res) => { clearSession(res); res.json({ ok: true }); });

r.get('/me', (req, res) => {
  res.json({ user: req.user ? userOut(req.user) : null }); // 200 either way → no console noise for logged-out visitors
});

r.post('/change-password', requireAuth, limiter, (req, res) => {
  if (req.user.is_demo) return res.status(403).json({ error: 'DEMO_LOCKED' });
  const cur = String(req.body?.current ?? ''), next = String(req.body?.next ?? '');
  if (next.length < 8 || next.length > 100) return res.status(400).json({ error: 'WEAK_PASSWORD' });
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(cur, u.password_hash)) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  db.prepare('UPDATE users SET password_hash=?, must_change_password=0 WHERE id=?').run(bcrypt.hashSync(next, 10), u.id);
  res.json({ ok: true });
});

r.post('/forgot', limiter, async (req, res) => {
  const email = clean(req.body?.email, 200)?.toLowerCase();
  const generic = { ok: true };
  if (!email) return res.status(400).json({ error: 'VALIDATION' });
  const u = db.prepare("SELECT * FROM users WHERE email=? AND role='PARENT'").get(email);
  if (!u || u.is_demo) {
    // Demo accounts are locked; unknown accounts get the same generic reply.
    return res.json(generic);
  }
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('UPDATE users SET reset_token_hash=?, reset_expires=? WHERE id=?').run(sha(token), Date.now() + 3600e3, u.id);
  const link = `${config.appUrl}/reset-password?token=${token}`;
  if (emailConfigured()) {
    await sendEmail({ to: u.email, ...buildResetEmail({ name: u.full_name, link }) });
  } else {
    console.log(`[SafePulse] Password reset link for ${u.email} (email service not configured): ${link}`);
  }
  res.json(generic); // never reveal whether the account exists
});

r.post('/reset', limiter, (req, res) => {
  const token = String(req.body?.token ?? ''), password = String(req.body?.password ?? '');
  if (password.length < 8 || password.length > 100) return res.status(400).json({ error: 'WEAK_PASSWORD' });
  const u = db.prepare('SELECT * FROM users WHERE reset_token_hash=? AND reset_expires>?').get(sha(token), Date.now());
  if (!u) return res.status(400).json({ error: 'INVALID_TOKEN' });
  db.prepare('UPDATE users SET password_hash=?, must_change_password=0, reset_token_hash=NULL, reset_expires=NULL WHERE id=?').run(bcrypt.hashSync(password, 10), u.id);
  res.json({ ok: true });
});

export default r;
