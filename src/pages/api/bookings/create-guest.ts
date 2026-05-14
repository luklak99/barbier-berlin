import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { generateId, generateSessionToken } from '../../../lib/crypto';
import { getServiceById } from '../../../data/services';
import {
  validateEmail,
  validateServiceId,
  validateDate,
  validateTime,
  jsonResponse,
  errorResponse,
} from '../../../lib/validation';

const LANG_VALUES = ['de', 'en', 'tr', 'ar'] as const;
type Lang = typeof LANG_VALUES[number];

function validateName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return null;
  if (/<[^>]*>/.test(trimmed)) return null;
  return trimmed;
}

function validatePhone(phone: unknown): string | null {
  if (phone === undefined || phone === null || phone === '') return null;
  if (typeof phone !== 'string') return null;
  const cleaned = phone.replace(/[\s\-().]/g, '');
  if (!/^\+?[0-9]{7,15}$/.test(cleaned)) return null;
  return phone.trim().slice(0, 30);
}

const guestConfirmSubject: Record<Lang, string> = {
  de: 'Buchungsbestätigung – Barbier Berlin',
  en: 'Booking Confirmation – Barbier Berlin',
  tr: 'Randevu Onayı – Barbier Berlin',
  ar: 'تأكيد الحجز – Barbier Berlin',
};

function guestConfirmHtml(params: {
  name: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  cancelUrl: string;
  lang: Lang;
}): string {
  const { name, serviceName, date, startTime, endTime, price, cancelUrl, lang } = params;
  const [y, m, d] = date.split('-');
  const fmtDate = `${d}.${m}.${y}`;

  const labels = {
    de: { greeting: `Hallo ${name},`, confirmed: 'Ihr Termin ist bestätigt!', service: 'Service', date: 'Datum', time: 'Uhrzeit', price: 'Preis', note: 'Bezahlung erfolgt im Salon.', cancelBtn: 'Termin stornieren', cancelNote: 'Um den Termin zu stornieren oder zu ändern, klicken Sie auf den Button oder schreiben Sie uns an info@barbier.berlin', footer: 'Wir freuen uns auf Sie!', suffix: 'Uhr' },
    en: { greeting: `Hello ${name},`, confirmed: 'Your appointment is confirmed!', service: 'Service', date: 'Date', time: 'Time', price: 'Price', note: 'Payment in salon.', cancelBtn: 'Cancel Appointment', cancelNote: 'To cancel or change your appointment, click the button or email us at info@barbier.berlin', footer: 'We look forward to seeing you!', suffix: '' },
    tr: { greeting: `Merhaba ${name},`, confirmed: 'Randevunuz onaylandı!', service: 'Hizmet', date: 'Tarih', time: 'Saat', price: 'Fiyat', note: 'Ödeme salonda yapılır.', cancelBtn: 'Randevuyu İptal Et', cancelNote: 'Randevunuzu iptal etmek veya değiştirmek için butona tıklayın ya da info@barbier.berlin adresine yazın', footer: 'Sizi bekliyoruz!', suffix: '' },
    ar: { greeting: `مرحباً ${name}،`, confirmed: 'تم تأكيد موعدك!', service: 'الخدمة', date: 'التاريخ', time: 'الوقت', price: 'السعر', note: 'الدفع في الصالون.', cancelBtn: 'إلغاء الموعد', cancelNote: 'لإلغاء الموعد أو تغييره، انقر على الزر أو راسلنا على info@barbier.berlin', footer: 'نتطلع لرؤيتك!', suffix: '' },
  };
  const l = labels[lang];

  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#121212;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#121212;padding:24px"><tr><td align="center">
<table width="560" style="max-width:560px;background:#1e1e38;border-radius:12px;overflow:hidden">
<tr><td style="background:#1a1a2e;padding:28px 32px;text-align:center">
<div style="color:#C8A55A;font-size:22px;font-weight:600">Barbier Berlin</div></td></tr>
<tr><td style="padding:32px">
<p style="color:#e0e0e0;font-size:15px;margin:0 0 8px">${l.greeting}</p>
<h1 style="color:#C8A55A;font-size:22px;margin:0 0 24px">${l.confirmed}</h1>
<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;margin:0 0 20px">
<tr><td style="color:#a0a0a0;font-size:13px;padding:6px 0">${l.service}</td><td style="color:#e0e0e0;font-size:14px;font-weight:600;text-align:right">${serviceName}</td></tr>
<tr><td style="color:#a0a0a0;font-size:13px;padding:6px 0">${l.date}</td><td style="color:#e0e0e0;font-size:14px;text-align:right">${fmtDate}</td></tr>
<tr><td style="color:#a0a0a0;font-size:13px;padding:6px 0">${l.time}</td><td style="color:#e0e0e0;font-size:14px;text-align:right">${startTime}–${endTime} ${l.suffix}</td></tr>
<tr><td style="color:#a0a0a0;font-size:13px;padding:6px 0;border-top:1px solid rgba(255,255,255,0.06)">${l.price}</td><td style="color:#C8A55A;font-size:16px;font-weight:700;text-align:right;border-top:1px solid rgba(255,255,255,0.06)">${price}€</td></tr>
</table>
<p style="color:#a0a0a0;font-size:13px;margin:0 0 20px">${l.note}</p>
<p style="color:#a0a0a0;font-size:12px;margin:0 0 20px;line-height:1.6">${l.cancelNote}</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto 24px"><tr><td style="background:#C8A55A;border-radius:6px;padding:12px 28px">
<a href="${cancelUrl}" style="color:#1a1a2e;text-decoration:none;font-weight:700;font-size:14px">${l.cancelBtn}</a>
</td></tr></table>
<p style="color:#e0e0e0;font-size:14px;margin:0;text-align:center">${l.footer}</p>
</td></tr></table></td></tr></table></body></html>`;
}

function guestConfirmText(params: { name: string; serviceName: string; date: string; startTime: string; price: number; cancelUrl: string; lang: Lang }): string {
  const { name, serviceName, date, startTime, price, cancelUrl } = params;
  const [y, m, d] = date.split('-');
  return `Barbier Berlin – Buchungsbestätigung\n\nHallo ${name},\n\nIhr Termin: ${serviceName} am ${d}.${m}.${y} um ${startTime} Uhr\nPreis: ${price}€\n\nStornierung: ${cancelUrl}\n\nBarbier Berlin · info@barbier.berlin`;
}

export async function POST(context: APIContext) {
  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse('Ungültiger Request-Body.', 400);
  }

  const name = validateName(body.name);
  const email = validateEmail(body.email);
  const phone = validatePhone(body.phone);
  const serviceId = validateServiceId(body.serviceId);
  const date = validateDate(body.date);
  const startTime = validateTime(body.startTime);
  const lang: Lang = LANG_VALUES.includes(body.lang as Lang) ? (body.lang as Lang) : 'de';

  if (!name) return errorResponse('Name ungültig (2–100 Zeichen).');
  if (!email) return errorResponse('E-Mail-Adresse ungültig.');
  if (!serviceId) return errorResponse('Ungültiger Service.');
  if (!date) return errorResponse('Ungültiges Datum.');
  if (!startTime) return errorResponse('Ungültige Uhrzeit.');

  const service = getServiceById(serviceId);
  if (!service) return errorResponse('Service nicht gefunden.');

  const [startH, startM] = startTime.split(':').map(Number);
  const totalMinutes = startH! * 60 + startM! + service.duration;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

  const bookingDate = new Date(`${date}T${startTime}:00`);
  if (bookingDate <= new Date()) return errorResponse('Termine nur in der Zukunft.');
  if (bookingDate.getDay() === 0) return errorResponse('Sonntags geschlossen.');

  const [h] = startTime.split(':').map(Number);
  const maxHour = bookingDate.getDay() === 6 ? 17 : 18;
  if (h! < 10 || h! >= maxHour) return errorResponse(`Termine nur zwischen 10:00 und ${maxHour}:00 Uhr.`);

  const bookingId = generateId();
  const cancelToken = generateSessionToken();

  // Atomare Konfliktprüfung gegen beide Tabellen + INSERT
  const conflictInBookings = await env.DB.prepare(
    `SELECT 1 FROM bookings WHERE date = ? AND status = 'confirmed' AND start_time < ? AND end_time > ? LIMIT 1`
  ).bind(date, endTime, startTime).first();

  if (conflictInBookings) return errorResponse('Dieser Zeitslot ist leider nicht mehr verfügbar.');

  const conflictInGuest = await env.DB.prepare(
    `SELECT 1 FROM guest_bookings WHERE date = ? AND status = 'confirmed' AND start_time < ? AND end_time > ? LIMIT 1`
  ).bind(date, endTime, startTime).first();

  if (conflictInGuest) return errorResponse('Dieser Zeitslot ist leider nicht mehr verfügbar.');

  await env.DB.prepare(
    `INSERT INTO guest_bookings (id, service_id, date, start_time, end_time, status, guest_name, guest_email, guest_phone, cancel_token) VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)`
  ).bind(bookingId, serviceId, date, startTime, endTime, name, email, phone ?? null, cancelToken).run();

  const cancelUrl = `https://barbier.berlin/booking/cancel?token=${cancelToken}`;
  const serviceName = service.name[lang];

  if (env.BREVO_API_KEY) {
    const html = guestConfirmHtml({ name, serviceName, date, startTime, endTime, price: service.price, cancelUrl, lang });
    const text = guestConfirmText({ name, serviceName, date, startTime, price: service.price, cancelUrl, lang });
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'accept': 'application/json', 'content-type': 'application/json', 'api-key': env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Barbier Berlin', email: 'info@barbier.berlin' },
        to: [{ email }],
        subject: guestConfirmSubject[lang],
        htmlContent: html,
        textContent: text,
      }),
    }).catch((err) => console.error('Gast-E-Mail fehlgeschlagen:', err));
  }

  return jsonResponse({ success: true, bookingId, cancelToken }, 201);
}
