// Storage abstraction for meal images. Images are kept in the database (table meal_images), so they are
// never lost on hosts with a temporary disk. To use S3 / Cloudinary later, re-implement these functions only.
import crypto from 'node:crypto';
import { db } from '../db/index.js';

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function isAllowedImage(mime, b) {
  if (!EXT[mime] || !b || b.length < 12) return false;
  if (mime === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8;
  if (mime === 'image/png') return b[0] === 0x89 && b[1] === 0x50;
  return b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP';
}
export async function uploadMealImage(buffer, mime) {
  const key = `${crypto.randomUUID()}.${EXT[mime]}`;
  await db.prepare('INSERT INTO meal_images (key,mime,data) VALUES (?,?,?)').run(key, mime, buffer);
  return key;
}
export async function deleteMealImage(key) {
  if (key) await db.prepare('DELETE FROM meal_images WHERE key=?').run(key);
}
/** @returns {Promise<{mime:string,data:Buffer}|null>} */
export async function getMealImage(key) {
  if (!key) return null;
  const row = await db.prepare('SELECT mime,data FROM meal_images WHERE key=?').get(key);
  return row ? { mime: row.mime, data: Buffer.from(row.data) } : null;
}
