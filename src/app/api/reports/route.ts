import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

type StartupIdRow = { id: string };
type ReportRow = {
  id: string;
  startup_id: string;
  type: string;
  file_url: string;
  metadata: unknown;
  created_at: string;
};

export async function POST(request: Request) {
  try {
    // Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Get user's startup
    const startupResult = await query<StartupIdRow>('SELECT id FROM startups WHERE user_id = $1 LIMIT 1', [user.id]);
    if (!startupResult.rowCount || startupResult.rowCount === 0) {
      return NextResponse.json({ error: 'Startup profile not found' }, { status: 400 });
    }
    const startup_id = startupResult.rows[0].id;

    // Parse formData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const metadata = formData.get('metadata') as string;

    if (!file || !type) {
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
    }

    // Prepare uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      // Ignore if dir already exists
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const filePath = join(uploadsDir, safeFilename);
    const fileUrl = `/uploads/${safeFilename}`;

    await writeFile(filePath, buffer);

    // Insert to DB
    const insertResult = await query<ReportRow>(
      `INSERT INTO reports (startup_id, type, file_url, metadata) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [startup_id, type, fileUrl, metadata ? JSON.parse(metadata) : {}]
    );

    return NextResponse.json({ report: insertResult.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const startupResult = await query<StartupIdRow>('SELECT id FROM startups WHERE user_id = $1 LIMIT 1', [user.id]);
    if (!startupResult.rowCount || startupResult.rowCount === 0) {
      return NextResponse.json({ reports: [] }, { status: 200 });
    }
    const startup_id = startupResult.rows[0].id;

    const reportsResult = await query<ReportRow>('SELECT * FROM reports WHERE startup_id = $1 ORDER BY created_at DESC', [startup_id]);

    return NextResponse.json({ reports: reportsResult.rows }, { status: 200 });
  } catch (error) {
    console.error('Fetch records error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
