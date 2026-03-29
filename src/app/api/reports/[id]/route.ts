import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

type StartupIdRow = { id: string };

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const startupResult = await query<StartupIdRow>('SELECT id FROM startups WHERE user_id = $1 LIMIT 1', [user.id]);
    if (!startupResult.rowCount) {
      return NextResponse.json({ error: 'Startup profile not found' }, { status: 400 });
    }
    const startup_id = startupResult.rows[0].id;
    
    const { id } = await params;

    // Check if the report belongs to this startup
    const reportRes = await query<{ file_url: string }>('SELECT file_url FROM reports WHERE id = $1 AND startup_id = $2', [id, startup_id]);
    if (reportRes.rowCount === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = reportRes.rows[0];

    // Delete DB record
    await query('DELETE FROM reports WHERE id = $1', [id]);

    // Optional: Delete local file
    try {
      const filePath = join(process.cwd(), 'public', report.file_url);
      await unlink(filePath);
    } catch (e) {
      console.warn('Could not delete local file', report.file_url);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Delete error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
