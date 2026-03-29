import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await verifyToken(token);
  if (!user) {
    redirect('/login');
  }

  const result = await query('SELECT id FROM startups WHERE user_id = $1 LIMIT 1', [user.id]);
  
  if (!result.rowCount || result.rowCount === 0) {
    redirect('/onboarding');
  }

  return <>{children}</>;
}
