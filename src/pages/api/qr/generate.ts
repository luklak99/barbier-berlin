import type { APIContext } from 'astro';

// Simple QR Code generator using SVG (no external library)
// Based on the QR code algorithm for simple URL encoding
function generateQRSvg(url: string, size = 200): string {
  // For a production QR code, we'd need a full QR encoder.
  // Instead, generate a "scan me" SVG with the URL encoded for external QR services.
  // The simplest approach: return an SVG that embeds a QR code via a free API.
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=050506&color=C8A55A&format=svg`;
  return qrApiUrl;
}

export async function GET(context: APIContext) {
  const url = new URL(context.request.url);
  const type = url.searchParams.get('type') || 'register';

  const targets: Record<string, { url: string; label: string }> = {
    register: { url: 'https://barbier.berlin/register', label: 'Jetzt registrieren & Punkte sammeln' },
    review: { url: 'https://barbier.berlin/login', label: 'Jetzt bewerten' },
    booking: { url: 'https://barbier.berlin/booking', label: 'Termin buchen' },
  };

  const target = targets[type] || targets.register!;
  const qrUrl = generateQRSvg(target.url, 300);

  // Return a printable HTML page with the QR code
  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><title>QR-Code – Barbier Berlin</title>
<style>
  body { margin:0; padding:40px; background:#050506; color:#EDEDEF; font-family:sans-serif; text-align:center; }
  .card { max-width:400px; margin:0 auto; background:#0a0a0c; border-radius:16px; padding:40px; border:1px solid rgba(255,255,255,0.06); }
  h1 { color:#C8A55A; font-size:28px; margin:0 0 8px; }
  .subtitle { color:#8A8F98; font-size:14px; margin-bottom:30px; }
  img { border-radius:12px; }
  .label { margin-top:20px; color:#C8A55A; font-size:16px; font-weight:600; }
  .url { color:#8A8F98; font-size:12px; margin-top:8px; }
  @media print { body { background:#fff; color:#000; } .card { border:2px solid #000; } h1,.label { color:#000; } }
</style>
</head>
<body>
  <div class="card">
    <h1>Barbier Berlin</h1>
    <p class="subtitle">Premium Barbershop in Kreuzberg</p>
    <img src="${qrUrl}" alt="QR Code" width="300" height="300" />
    <p class="label">${target.label}</p>
    <p class="url">${target.url}</p>
  </div>
  <p style="margin-top:20px;color:#8A8F98;font-size:12px;">Zum Drucken: Strg+P / Cmd+P</p>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
