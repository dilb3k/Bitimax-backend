import { NextResponse } from 'next/server';
import { backendFetch, clearSession, isSameOrigin } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/** Ends the session everywhere (the backend stamps the account), then clears this browser. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'So‘rov rad etildi' }, { status: 403 });
  }

  try {
    await backendFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // A backend hiccup must not strand the user in a half-logged-in state: the cookies go
    // regardless, and the session token expires on its own.
  }

  return clearSession(NextResponse.json({ ok: true }));
}
