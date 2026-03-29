import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { join } from 'path';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

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

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('Groq API error:', res.status, errBody);
    if (res.status === 401) throw new Error('GROQ_401: Invalid API key');
    if (res.status === 429) throw new Error('GROQ_429: Rate limit exceeded');
    throw new Error(`Groq API returned ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  console.log('Groq response finish_reason:', data.choices?.[0]?.finish_reason);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in Groq response');
  return content;
}

function extractJson(raw: string): string {
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  if (cleaned.startsWith('{')) return cleaned;
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) return match[0];
  return cleaned;
}

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
    let validContentFound = false;

    for (const report of reports) {
      try {
        const filePath = join(process.cwd(), 'public', report.file_url);
        if (report.file_url.endsWith('.txt') || report.file_url.endsWith('.csv')) {
          const content = await readFile(filePath, 'utf-8');
          if (content.trim().length > 10) validContentFound = true;
          textContext += `\n--- ${report.type} Report ---\n${content.substring(0, 8000)}\n`;
        } else if (report.file_url.endsWith('.pdf')) {
          // Groq doesn't support inline PDF data — reference by name
          validContentFound = true;
          textContext += `\n--- PDF Report: ${report.type} ---\n[PDF uploaded. Analyze based on startup context and report type.]\n`;
        }
      } catch (e) {
        console.warn('Could not read file locally:', report.file_url);
      }
    }

    if (!validContentFound && reports.length > 0) {
      return NextResponse.json({
        error: 'The uploaded document is not valid or empty. Please upload a .txt, .csv, or .pdf file.'
      }, { status: 400 });
    }

    const systemPrompt = `You are a unified Product Intelligence AI for startups.
Analyze the provided Startup Profile and Document Context to generate a complete intelligence report.

You MUST respond with ONLY a valid JSON object (no markdown, no extra text) with exactly these fields:
{
  "product_intelligence_summary": "string",
  "business_revenue_insights": "string",
  "customer_demand_insights": "string",
  "market_intelligence": "string",
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "user_behavior": ["string"],
  "revenue_insights": ["string"],
  "market_insights": ["string"],
  "competitor_comparison": ["string"],
  "score": number (0-100, product health score),
  "chart_data": {
    "user_behavior_patterns": [{"category": "string", "value": number}],
    "revenue_blockers": [{"blocker": "string", "severity": number}],
    "market_opportunities": [{"segment": "string", "potential": number}]
  },
  "competitor_analysis": {
    "our_startup": {
      "name": "string",
      "scores": {
        "product_quality": number,
        "market_reach": number,
        "pricing_competitiveness": number,
        "user_experience": number,
        "feature_completeness": number,
        "growth_velocity": number
      }
    },
    "competitors": [
      {
        "name": "string (real company name from internet knowledge)",
        "founded": "string",
        "funding": "string",
        "scores": {
          "product_quality": number,
          "market_reach": number,
          "pricing_competitiveness": number,
          "user_experience": number,
          "feature_completeness": number,
          "growth_velocity": number
        },
        "differentiator": "string",
        "weakness_vs_us": "string"
      }
    ],
    "competitive_advantage": "string",
    "market_gap": "string"
  }
}

Rules:
- Each array field must have 3+ items
- chart_data arrays must have exactly 3 items each, values 0-100
- competitor_analysis.competitors must have exactly 3 real, well-known competitors from the same industry/category
- Use real data you know about these companies (funding, founding year, market position)
- Our startup scores should be realistic (typically 40-70 as an early stage startup)
- Established competitors should score higher in market_reach and feature_completeness
- Be data-driven and return ONLY the JSON object`;

    const userPrompt = `Startup Profile:
Name: ${startup.name}
Category: ${startup.category || 'N/A'}
Stage: ${startup.product_stage || 'N/A'}
Target Audience: ${startup.target_audience || 'N/A'}
Revenue Model: ${startup.revenue_model || 'N/A'}
Team Size: ${startup.team_size || 'N/A'}
Description: ${startup.product_description || 'N/A'}

${textContext ? `Document Context:\n${textContext}` : 'No documents uploaded — generate analysis based on startup profile only.'}`;

    console.log('--- CALLING GROQ AI ---');
    const rawContent = await callGroq(systemPrompt, userPrompt);
    console.log('Groq raw content (first 200 chars):', rawContent.substring(0, 200));

    let reportJson: any;
    try {
      reportJson = JSON.parse(extractJson(rawContent));
    } catch (parseErr) {
      console.error('JSON parse failed. Raw:', rawContent);
      throw new Error(`JSON_PARSE_FAILED: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
    }

    console.log('--- GROQ AI SUCCESS ---');
    const insertResult = await query(
      `INSERT INTO product_reports (startup_id, report_json) VALUES ($1, $2) RETURNING *`,
      [startup.id, reportJson]
    );

    return NextResponse.json({ productReport: insertResult.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    console.error('--- CRITICAL AI GENERATION ERROR ---');
    console.error(String(error));

    const message = error instanceof Error ? error.message : String(error);
    const lowerMessage = message.toLowerCase();

    let msg: string;
    if (lowerMessage.includes('groq_401') || lowerMessage.includes('invalid api key')) {
      msg = 'Groq API Key is invalid. Please check your .env.local configuration.';
    } else if (lowerMessage.includes('groq_429') || lowerMessage.includes('rate limit')) {
      msg = 'Groq rate limit reached. Please try again in a few seconds.';
    } else if (lowerMessage.includes('json_parse_failed')) {
      msg = 'The AI returned an unexpected format. Please try again.';
    } else {
      msg = `AI Error: ${message.substring(0, 200)}`;
    }

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
    console.error('GET /api/ai/generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
