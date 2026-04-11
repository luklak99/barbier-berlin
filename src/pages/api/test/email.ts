import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user || user.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  if (!env.RELAY_SECRET) {
    return jsonResponse({ error: 'RELAY_SECRET nicht konfiguriert' });
  }

  // Test the PHP relay
  try {
    const res = await fetch('https://barbier.berlin/api-relay/send.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Relay-Secret': env.RELAY_SECRET,
      },
      body: JSON.stringify({
        to: user.email,
        subject: 'Test – Barbier Berlin E-Mail-System',
        html: '<h1 style="color:#C8A55A">E-Mail-Test erfolgreich!</h1><p>Das E-Mail-System funktioniert.</p>',
        text: 'E-Mail-Test erfolgreich! Das E-Mail-System funktioniert.',
      }),
    });

    const body = await res.text();
    return jsonResponse({
      success: res.ok,
      status: res.status,
      response: body.substring(0, 200),
      relayUrl: 'https://barbier.berlin/api-relay/send.php',
    });
  } catch (err) {
    return jsonResponse({
      error: err instanceof Error ? err.message : String(err),
    }, 500);
  }
}
