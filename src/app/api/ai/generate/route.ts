import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { GoogleGenAI, Type } from '@google/genai';
import { readFile } from 'fs/promises';
import { join } from 'path';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || 'fallback' 
});

type StartupRow = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  team_size: string | null;
  product_description: string | null;
  product_stage: string | null;
  target_audience: string | null;
  revenue_model: string | null;
  goals: string[] | null;
};

type ReportRow = {
  id: string;
  startup_id: string;
  type: string;
  file_url: string;
  created_at: string;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const startupResult = await query<StartupRow>('SELECT * FROM startups WHERE user_id = $1 LIMIT 1', [user.id]);
    if (!startupResult.rowCount) {
      return NextResponse.json({ error: 'Startup profile not found' }, { status: 400 });
    }
    const startup = startupResult.rows[0];

    const body = await request.json().catch(() => ({}));
    const reportIds = body.reportIds as string[] | undefined;

    let reportsResult;
    if (reportIds && reportIds.length > 0) {
      reportsResult = await query<ReportRow>('SELECT * FROM reports WHERE startup_id = $1 AND id = ANY($2::uuid[])', [startup.id, reportIds]);
    } else {
      reportsResult = await query<ReportRow>('SELECT * FROM reports WHERE startup_id = $1', [startup.id]);
    }
    const reports = reportsResult.rows;

    let textContext = '';
    const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
    let validContentFound = false;

    for (const report of reports) {
      try {
        const filePath = join(process.cwd(), 'public', report.file_url);
        if (report.file_url.endsWith('.txt') || report.file_url.endsWith('.csv')) {
          const content = await readFile(filePath, 'utf-8');
          if (content.trim().length > 10) validContentFound = true;
          textContext += `\n--- Text Report: ${report.type} ---\n${content.substring(0, 10000)}\n`;
        } else if (report.file_url.endsWith('.pdf')) {
          const fileData = await readFile(filePath);
          if (fileData.length > 10) validContentFound = true;
          parts.push({
            inlineData: {
              data: fileData.toString('base64'),
              mimeType: 'application/pdf'
            }
          });
        }
      } catch (e) {
        console.warn('Could not read file locally', report.file_url);
      }
    }

    if (!validContentFound && reports.length > 0) {
      return NextResponse.json({ 
        error: 'The uploaded document is not valid or empty. Please upload a clear valid .txt, .csv, or .pdf file.' 
      }, { status: 400 });
    }

    const systemPromptText = `You are a unified Product Intelligence AI, composed of 6 distinct agents:
1. Data Interpreter Agent: Extract key metrics from reports
2. Product Intelligence Agent: Identify strengths and weaknesses
3. User Behavior Agent: Analyze engagement and patterns
4. Revenue Agent: Detect revenue blockers
5. Market Intelligence Agent: Analyze category trends
6. Competitor Agent: Compare with competitors

Analyze the following Startup Profile and all the attached Reports (in text or attached as PDF documents) to generate a complete intelligence report JSON. Be thorough and analytical. Extrapolate all insights mathematically and logically from the text/pdfs provided.

Startup Profile:
Name: ${startup.name}
Category: ${startup.category}
Team Size: ${startup.team_size}
Product Description: ${startup.product_description}
Stage: ${startup.product_stage}
Target Audience: ${startup.target_audience}
Revenue Model: ${startup.revenue_model}
Goals: ${(startup.goals || []).join(', ')}

${textContext ? `Text Reports Context:\n${textContext}` : ''}
`;

    parts.unshift({ text: systemPromptText });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            user_behavior: { type: Type.ARRAY, items: { type: Type.STRING } },
            revenue_insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            market_insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            competitor_comparison: { type: Type.ARRAY, items: { type: Type.STRING } },
            score: { type: Type.INTEGER }
          },
          required: ["summary", "strengths", "weaknesses", "user_behavior", "revenue_insights", "market_insights", "competitor_comparison", "score"]
        }
      }
    });

    if (!response.text) throw new Error('No AI response received. The provided data might be invalid or insufficient.');
    const reportJson = JSON.parse(response.text);

    const insertResult = await query(
      `INSERT INTO product_reports (startup_id, report_json) VALUES ($1, $2) RETURNING *`,
      [startup.id, reportJson]
    );

    return NextResponse.json({ productReport: insertResult.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    console.error('AI Generation Error:', error);
    const message = error instanceof Error ? error.message : '';
    const msg = message.toLowerCase().includes('generatecontent') 
      ? 'The uploaded document data is invalid or could not be processed by the AI natively.' 
      : (message || 'Failed to generate AI report.');
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const startupResult = await query<StartupRow>('SELECT * FROM startups WHERE user_id = $1 LIMIT 1', [user.id]);
    if (!startupResult.rowCount) return NextResponse.json({ productReports: [], startup: null }, { status: 200 });
    
    const startup = startupResult.rows[0];
    const reportsResult = await query('SELECT * FROM product_reports WHERE startup_id = $1 ORDER BY created_at DESC', [startup.id]);

    return NextResponse.json({ productReports: reportsResult.rows, startup }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
