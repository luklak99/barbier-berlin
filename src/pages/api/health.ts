import { env } from 'cloudflare:workers';

export async function GET() {
  try {
    const info: Record<string, unknown> = {
      status: 'ok',
      hasDb: !!env.DB,
      hasBrevo: !!env.BREVO_API_KEY,
    };

    if (env.DB) {
      try {
        const result = await env.DB.prepare('SELECT 1 as ok').first();
        info.db = result ? 'connected' : 'no result';
      } catch (e) {
        info.db = `error: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    return new Response(JSON.stringify(info, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : String(e),
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
