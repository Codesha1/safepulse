// Storage abstraction for meal images (default: local disk in STORAGE_DIR).
// To use S3 / Supabase / Cloudinary later, re-implement these functions only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '../config.js';

fs.mkdirSync(config.storageDir, { recursive: true });
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function isAllowedImage(mime, b) {
  if (!EXT[mime] || !b || b.length < 12) return false;
  if (mime === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8;
  if (mime === 'image/png') return b[0] === 0x89 && b[1] === 0x50;
  return b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP';
}
export async function uploadMealImage(buffer, mime) {
  const key = `${crypto.randomUUID()}.${EXT[mime]}`;
  await fs.promises.writeFile(path.join(config.storageDir, key), buffer);
  return key;
}
export async function deleteMealImage(key) {
  if (!key || /[\\/]/.test(key)) return;
  await fs.promises.rm(path.join(config.storageDir, key), { force: true });
}
export function getMealImage(key) {
  if (!key || /[\\/]/.test(key) || key.includes('..')) return null;
  const file = path.join(config.storageDir, key);
  return fs.existsSync(file) ? file : null;
}
