import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  try {
    const locals = context.locals as Record<string, unknown>;
    const runtime = locals.runtime as Record<string, unknown> | undefined;
    const env = runtime?.env as Record<string, unknown> | undefined;

    const info: Record<string, unknown> = {
      status: 'ok',
      hasLocals: !!locals,
      hasRuntime: !!runtime,
      hasEnv: !!env,
      envKeys: env ? Object.keys(env) : [],
      localsKeys: Object.keys(locals),
    };

    if (env?.DB) {
      try {
        const db = env.DB as { prepare: (sql: string) => { first: () => Promise<unknown> } };
        const result = await db.prepare('SELECT 1 as ok').first();
        info.db = result ? 'connected' : 'no result';
      } catch (e) {
        info.db = `error: ${e instanceof Error ? e.message : String(e)}`;
      }
    } else {
      info.db = 'missing';
    }

    return new Response(JSON.stringify(info, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
