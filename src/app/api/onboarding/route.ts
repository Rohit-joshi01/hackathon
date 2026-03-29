import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const {
      startup_name,
      category,
      team_size,
      product_description,
      product_stage,
      target_audience,
      revenue_model,
      primary_goals
    } = body;

    const result = await query(
      `INSERT INTO startups (
        user_id, name, category, team_size, product_description, 
        product_stage, target_audience, revenue_model, goals
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        user.id,
        startup_name,
        category,
        team_size,
        product_description,
        product_stage,
        target_audience,
        revenue_model,
        primary_goals || []
      ]
    );

    return NextResponse.json({ startup: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
