import { Buffer } from 'node:buffer';
import { getUser } from '@netlify/identity';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { accountWorkspaces } from '../../db/schema.js';

export default async (req: Request) => {
  const headers = { 'Cache-Control': 'no-store' };
  const user = await getUser();
  if (!user) return Response.json({ error: 'Sign in to access your private cloud backup.' }, { status: 401, headers });
  if (!['GET', 'PUT', 'DELETE'].includes(req.method)) return new Response('Method not allowed', { status: 405, headers: { ...headers, Allow: 'GET, PUT, DELETE' } });
  if (req.method !== 'GET' && req.headers.get('origin') !== new URL(req.url).origin) return new Response('Forbidden', { status: 403, headers });
  try {
    if (req.method === 'GET') {
      const [row] = await db.select().from(accountWorkspaces).where(eq(accountWorkspaces.userId, user.id));
      return Response.json({ payload: row?.payload ?? null, updatedAt: row?.updatedAt ?? null }, { headers });
    }
    if (req.method === 'DELETE') {
      await db.delete(accountWorkspaces).where(eq(accountWorkspaces.userId, user.id));
      return Response.json({ deleted: true }, { headers });
    }
    const raw = await req.text();
    if (Buffer.byteLength(raw) > 2000000) return new Response('Backup too large (maximum 2 MB)', { status: 413, headers });
    let payload;
    try { payload = JSON.parse(raw).payload; } catch { return new Response('Invalid JSON', { status: 400, headers }); }
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.tasks) || payload.tasks.length > 500 ||
        !payload.records || typeof payload.records !== 'object' || Array.isArray(payload.records) ||
        !payload.settings || typeof payload.settings !== 'object' || Array.isArray(payload.settings) ||
        payload.tasks.some((t: any) => !t || typeof t.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(t.id) ||
          typeof t.name !== 'string' || !t.name.trim() || t.name.length > 200 || !Number.isFinite(t.target) || t.target < 0 || t.target > 1440)) {
      return new Response('Invalid DAYSTAR backup', { status: 400, headers });
    }
    const updatedAt = new Date();
    await db.insert(accountWorkspaces).values({ userId: user.id, payload, updatedAt }).onConflictDoUpdate({ target: accountWorkspaces.userId, set: { payload, updatedAt } });
    return Response.json({ saved: true, updatedAt }, { headers });
  } catch { return Response.json({ error: 'Cloud backup is temporarily unavailable. Your device copy is unaffected.' }, { status: 503, headers }); }
};
