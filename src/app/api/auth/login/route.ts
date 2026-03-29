import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { comparePasswords, signToken, setAuthCookie } from '@/lib/auth';

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
};

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, password } = result.data;

    const userResult = await query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
    if (!userResult.rowCount || userResult.rowCount === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = userResult.rows[0];
    const passwordMatch = await comparePasswords(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate token and set cookie
    const token = await signToken({ id: user.id, email: user.email, name: user.name });
    await setAuthCookie(token);

    // Filter out password_hash
    const { password_hash, ...safeUser } = user;

    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
