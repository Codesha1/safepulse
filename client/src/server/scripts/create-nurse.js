// Create a real nurse account (use this when DEMO_MODE=false).
//   npm run create-nurse -- "nurse@school.edu" "Nurse Full Name" "Strong-Password-Here"
// If you leave out the password, a random one is generated and printed once.
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';

const [email, fullName, passwordArg] = process.argv.slice(2);
if (!email || !fullName || !/^\S+@\S+\.\S+$/.test(email)) {
  console.error('Usage: npm run create-nurse -- "email@school.edu" "Full Name" ["Password (min 10 chars)"]');
  process.exit(1);
}
const password = passwordArg || crypto.randomBytes(9).toString('base64url');
if (password.length < 10) { console.error('Password must be at least 10 characters.'); process.exit(1); }
if (await db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) { console.error('That email already exists.'); process.exit(1); }

const hash = bcrypt.hashSync(password, 12);
await db.tx(async (t) => {
  const r = await t.prepare("INSERT INTO users (email,password_hash,role,full_name,must_change_password,is_demo) VALUES (?,?,'NURSE',?,0,0)").run(email.trim(), hash, fullName.trim());
  await t.prepare('INSERT INTO nurses (user_id) VALUES (?)').run(r.lastInsertRowid);
});
console.log(`\n  Nurse account created.\n  Email:    ${email}\n  Password: ${passwordArg ? '(the one you typed)' : password}\n`);
process.exit(0);
