import { NextResponse } from 'next/server';
import { getPolicy } from '@/lib/server/policy';
export async function GET() {
 const policy = await getPolicy();
 return policy ? NextResponse.json(policy) : NextResponse.json({ error: 'Shartlarni yuklab bo‘lmadi' }, { status: 503 });
}
