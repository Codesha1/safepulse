import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/index.js';

export const COOKIE = 'sp_session';
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function issueSession(res, user) {
  const token = jwt.sign({ uid: user.id, role: user.role }, config.authSecret, { expiresIn: '12h' });
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, maxAge: 12 * 3600 * 1000, path: '/',
  });
}
export const clearSession = (res) => res.clearCookie(COOKIE, { path: '/' });

/** Loads the user from the signed cookie. The role is ALWAYS re-read from the database. */
export async function loadUser(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const p = jwt.verify(token, config.authSecret);
      const u = await db.prepare('SELECT id,email,role,full_name,must_change_password,is_demo FROM users WHERE id=?').get(p.uid);
      if (u) req.user = u;
    } catch { /* invalid / expired → treated as logged out */ }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
  next();
}
export const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
  if (req.user.role !== role) return res.status(403).json({ error: 'FORBIDDEN' });
  next();
};

/** Student access: nurses → any student; parents → ONLY their own children. */
export const loadStudent = wrap(async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'NOT_FOUND' });
  const s = await db.prepare('SELECT * FROM students WHERE id=?').get(id);
  if (!s) return res.status(404).json({ error: 'NOT_FOUND' });
  if (req.user.role === 'PARENT') {
    const p = await db.prepare('SELECT id FROM parents WHERE user_id=?').get(req.user.id);
    if (!p || s.parent_id !== p.id) return res.status(404).json({ error: 'NOT_FOUND' }); // 404, not 403: don't reveal existence
  }
  req.student = s;
  next();
});