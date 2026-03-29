import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ onboarded: false }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ onboarded: false }, { status: 401 });

    const result = await query('SELECT id FROM startups WHERE user_id = $1 LIMIT 1', [user.id]);
    const onboarded = result.rowCount ? result.rowCount > 0 : false;

    return NextResponse.json({ onboarded }, { status: 200 });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ onboarded: false }, { status: 500 });
  }
}
