// Email service. With EMAIL_API_KEY it sends real email through Resend (https://resend.com).
// Without a key it NEVER pretends to send: it returns { sent:false } plus a preview to display.
import { config } from '../config.js';

export const emailConfigured = () => Boolean(config.email.apiKey);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function buildWelcomeEmail({ parentName, studentName, email, tempPassword }) {
  const url = `${config.appUrl}/parent/login`;
  const subject = 'Welcome to SafePulse | مرحبًا بك في SafePulse';
  const block = (dir, lang, t) => `
    <div dir="${dir}" lang="${lang}" style="text-align:${dir === 'rtl' ? 'right' : 'left'};padding:20px 0">
      <h2 style="margin:0 0 8px;color:#4c1d95">${t.h}</h2>
      <p style="margin:0 0 12px;color:#334155">${t.p}</p>
      <table style="background:#f5f3ff;border-radius:12px;padding:14px 18px;width:100%;color:#1e1b4b">
        <tr><td><b>${t.email}</b></td><td dir="ltr">${esc(email)}</td></tr>
        <tr><td><b>${t.pass}</b></td><td dir="ltr" style="font-family:monospace;font-size:18px;letter-spacing:1px">${esc(tempPassword)}</td></tr>
      </table>
      <p style="margin:12px 0;color:#334155">${t.how} <a href="${esc(url)}" style="color:#7c3aed">${esc(url)}</a></p>
      <p style="margin:0;color:#b45309"><b>${t.sec}</b></p>
    </div>`;
  const en = block('ltr', 'en', {
    h: 'Welcome to SafePulse', p: `Hello ${esc(parentName)}, a SafePulse account was created so you can follow the school health updates for ${esc(studentName)}.`,
    email: 'Account email', pass: 'Temporary password', how: 'To log in, open the Parent / Guardian portal:',
    sec: 'For your security, please change this temporary password after your first login.',
  });
  const ar = block('rtl', 'ar', {
    h: 'مرحبًا بك في SafePulse', p: `مرحبًا ${esc(parentName)}، تم إنشاء حساب في SafePulse لتتمكني من متابعة التحديثات الصحية المدرسية الخاصة بـ ${esc(studentName)}.`,
    email: 'البريد الإلكتروني للحساب', pass: 'كلمة المرور المؤقتة', how: 'لتسجيل الدخول، افتحي بوابة ولي الأمر:',
    sec: 'لحمايتك، يُرجى تغيير كلمة المرور المؤقتة بعد أول تسجيل دخول.',
  });
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Segoe UI,Tahoma,Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#fff">
    <div style="background:linear-gradient(135deg,#6d28d9,#10b981);padding:24px;text-align:center;color:#fff">
      <div style="font-size:26px;font-weight:700">SafePulse</div><div style="opacity:.9">Smarter Care. Safer School Days. · رعاية أذكى، وأيام دراسية أكثر أمانًا.</div>
    </div>
    <div style="padding:8px 24px">${en}<hr style="border:none;border-top:1px solid #e2e8f0">${ar}</div>
  </div></body></html>`;
  const text = `Welcome to SafePulse\nAccount: ${email}\nTemporary password: ${tempPassword}\nLogin: ${url}\nPlease change this password after your first login.\n\nمرحبًا بك في SafePulse\nالبريد: ${email}\nكلمة المرور المؤقتة: ${tempPassword}\nالدخول: ${url}\nيُرجى تغيير كلمة المرور بعد أول دخول.`;
  return { to: email, subject, html, text };
}

export function buildResetEmail({ name, link }) {
  const subject = 'Reset your SafePulse password | إعادة تعيين كلمة المرور';
  const html = `<div style="font-family:Segoe UI,Tahoma,Arial,sans-serif;max-width:560px;margin:auto"><h2 style="color:#4c1d95">SafePulse</h2>
  <p>Hello ${esc(name)}, use this link to set a new password (valid for 1 hour):</p><p><a href="${esc(link)}">${esc(link)}</a></p>
  <hr><div dir="rtl" style="text-align:right"><p>مرحبًا ${esc(name)}، استخدمي هذا الرابط لتعيين كلمة مرور جديدة (صالح لمدة ساعة):</p><p><a href="${esc(link)}">${esc(link)}</a></p></div>
  <p style="color:#64748b;font-size:12px">If you did not request this, ignore this email. · إن لم تطلبي ذلك، تجاهلي هذه الرسالة.</p></div>`;
  return { subject, html, text: `${link}` };
}

export async function sendEmail({ to, subject, html, text }) {
  if (!emailConfigured()) return { sent: false, reason: 'EMAIL_NOT_CONFIGURED' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.email.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: config.email.from, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.error('[email] provider error', res.status); return { sent: false, reason: 'EMAIL_PROVIDER_ERROR' }; }
    return { sent: true };
  } catch (e) {
    console.error('[email] failed:', e.message);
    return { sent: false, reason: 'EMAIL_FAILED' };
  }
}
