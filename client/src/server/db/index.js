// Database layer. Works with a local file (default) or a free hosted Turso database (libsql://…),
// using the same SQL either way. API mirrors a tiny subset of better-sqlite3, but every call is async:
//   await db.prepare(sql).get(...args) | .all(...args) | .run(...args)
//   await db.batch([[sql, args], ...])                 → many statements, ONE network round trip
//   await db.tx(async (t) => { ... t.prepare(...) })   → transaction (t has prepare + batch too)
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { config } from '../config.js';

if (config.databaseUrl.startsWith('file:') && !config.databaseUrl.includes(':memory:')) {
  fs.mkdirSync(path.dirname(config.databaseUrl.slice(5)), { recursive: true });
}
const client = createClient({ url: config.databaseUrl, authToken: config.databaseAuthToken });

const arg = (v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v);
const stmt = (sql, args = []) => ({ sql, args: args.map(arg) });
const rowsOf = (rs) => rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])));

function bind(ex, runBatch) {
  return {
    prepare: (sql) => ({
      get: async (...a) => rowsOf(await ex.execute(stmt(sql, a)))[0],
      all: async (...a) => rowsOf(await ex.execute(stmt(sql, a))),
      run: async (...a) => { const rs = await ex.execute(stmt(sql, a)); return { changes: rs.rowsAffected, lastInsertRowid: Number(rs.lastInsertRowid ?? 0) }; },
    }),
    batch: async (list) => { if (list.length) await runBatch(list.map(([sql, args]) => stmt(sql, args))); },
  };
}

export const db = {
  ...bind(client, (l) => client.batch(l, 'write')),
  /** Run many statements; chunked so very large seeds stay within request limits (in order). */
  async bulk(list, size = 300) { for (let i = 0; i < list.length; i += size) await db.batch(list.slice(i, i + size)); },
  async tx(fn) {
    const t = await client.transaction('write');
    try { const out = await fn(bind(t, (l) => t.batch(l))); await t.commit(); return out; }
    catch (e) { try { await t.rollback(); } catch { /* already closed */ } throw e; }
    finally { t.close(); }
  },
};

if (config.databaseUrl.startsWith('file:')) await client.execute('PRAGMA foreign_keys = ON');
await client.executeMultiple(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

export const nowIso = () => new Date().toISOString();
