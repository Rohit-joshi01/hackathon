import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const createFeatureRequestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requested_by: z.string().min(2).optional().or(z.literal('')),
  department: z.string().min(2).optional().or(z.literal('')),
  status: z.string().min(1).optional(),
});

const decisionJsonSchema = z.object({
  decision: z.string(),
  priority: z.union([z.string(), z.number()]),
  impact: z.object({
    revenue_impact: z.string(),
    user_impact: z.string(),
  }),
  alignment_metrics: z.array(z.object({
    metric: z.string(),
    score: z.string(),
    insight: z.string()
  })),
  risks: z.array(z.string()),
  reason: z.string(),
});

type FeatureRequestRow = {
  id: string;
  startup_id: string;
  title: string;
  description: string | null;
  requested_by: string | null;
  department: string | null;
  status: string;
};

type DecisionJson = z.infer<typeof decisionJsonSchema>;

async function getAuthedStartupId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  const user = await verifyToken(token);
  if (!user?.id) return null;
  const startupResult = await query<{ id: string }>('SELECT id FROM startups WHERE user_id = $1 LIMIT 1', [user.id]);
  if (!startupResult.rowCount) return null;
  return startupResult.rows[0].id as string;
}

async function ensureFeatureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS feature_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      requested_by VARCHAR(255),
      department VARCHAR(255),
      status VARCHAR(50) NOT NULL
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS feature_decisions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      feature_id UUID UNIQUE REFERENCES feature_requests(id) ON DELETE CASCADE,
      decision_json JSONB NOT NULL
    );
  `);
}

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
      max_tokens: 2048,
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

async function generateDecision(featureRequest: FeatureRequestRow, productReportJson: any): Promise<DecisionJson> {
  const systemPrompt = `You are a Product Strategy AI for startups.
Analyze the Feature Request against the Product Intelligence Report and return a strategic decision.

You MUST respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "decision": "Accept" | "Decline" | "Delay" | "Validate",
  "priority": "0"-"100",
  "impact": { "revenue_impact": "string", "user_impact": "string" },
  "alignment_metrics": [
    { "metric": "string", "score": "string", "insight": "string" },
    { "metric": "string", "score": "string", "insight": "string" },
    { "metric": "string", "score": "string", "insight": "string" }
  ],
  "risks": ["string", "string"],
  "reason": "string (2-3 sentences explaining the strategic rationale)"
}

Return ONLY the JSON object.`;

  const reportSummary = {
    summary: productReportJson?.summary || productReportJson?.product_intelligence_summary || 'N/A',
    strengths: productReportJson?.strengths || [],
    weaknesses: productReportJson?.weaknesses || [],
    market: productReportJson?.market_insights || [],
    revenue: productReportJson?.revenue_insights || [],
    score: productReportJson?.score || 0,
  };

  const userPrompt = `Feature Request:
Title: ${featureRequest.title}
Description: ${featureRequest.description || 'No description provided'}
Department: ${featureRequest.department || 'General'}
Requested By: ${featureRequest.requested_by || 'Unknown'}

Product Intelligence Context:
${JSON.stringify(reportSummary, null, 2)}`;

  try {
    console.log('--- GROQ FEATURE ANALYSIS ---');
    const rawContent = await callGroq(systemPrompt, userPrompt);

    let json: any;
    try {
      json = JSON.parse(extractJson(rawContent));
    } catch (parseErr) {
      console.error('JSON parse failed:', rawContent);
      throw new Error(`JSON_PARSE_FAILED`);
    }

    const parsed = decisionJsonSchema.safeParse(json);
    if (!parsed.success) {
      console.warn('Schema validation warning — using raw data anyway:', parsed.error.issues[0]);
      // Return raw data if schema loosely matches
      return {
        decision: json.decision || 'Validate',
        priority: String(json.priority || '50'),
        impact: json.impact || { revenue_impact: 'unknown', user_impact: 'unknown' },
        alignment_metrics: json.alignment_metrics || [{ metric: 'Analysis', score: '50', insight: 'Based on available data' }],
        risks: json.risks || ['Insufficient data'],
        reason: json.reason || 'Analysis complete.',
      };
    }

    console.log('--- GROQ FEATURE ANALYSIS SUCCESS ---');
    return parsed.data as DecisionJson;
  } catch (err) {
    console.error('Groq feature analysis error:', String(err));
    throw err;
  }
}

export async function POST(request: Request) {
  try {
    const startupId = await getAuthedStartupId();
    if (!startupId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureFeatureTables();

    const body = await request.json().catch(() => ({}));
    let featureRequest: FeatureRequestRow;

    if (body.reanalyzeId) {
      const res = await query<FeatureRequestRow>('SELECT * FROM feature_requests WHERE id = $1 AND startup_id = $2', [body.reanalyzeId, startupId]);
      if (!res.rowCount) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      featureRequest = res.rows[0];
    } else {
      const parsed = createFeatureRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const { title, description, requested_by, department, status } = parsed.data;
      const insertRes = await query<FeatureRequestRow>(
        `INSERT INTO feature_requests (startup_id, title, description, requested_by, department, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [startupId, title, description, requested_by || null, department || null, status || 'Submitted']
      );
      featureRequest = insertRes.rows[0];
    }

    const prRes = await query<{ report_json: unknown }>(
      'SELECT report_json FROM product_reports WHERE startup_id = $1 ORDER BY created_at DESC LIMIT 1',
      [startupId]
    );

    let decisionJson: DecisionJson;
    if (!prRes.rowCount) {
      decisionJson = {
        decision: 'Validate',
        priority: '0',
        impact: { revenue_impact: 'unknown', user_impact: 'unknown' },
        alignment_metrics: [{ metric: 'Strategy Alignment', score: 'N/A', insight: 'Generate a Product Intelligence report first.' }],
        risks: ['No product report available'],
        reason: 'Please generate a Product Intelligence report first, then re-submit this feature for analysis.',
      };
    } else {
      try {
        decisionJson = await generateDecision(featureRequest, prRes.rows[0].report_json);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const lowerMsg = msg.toLowerCase();
        const userMsg = lowerMsg.includes('groq_401') ? 'Groq API Key is invalid.'
          : lowerMsg.includes('groq_429') ? 'Rate limit reached. Try again in a moment.'
          : 'AI analysis failed. Please try again.';

        decisionJson = {
          decision: 'Validate',
          priority: '0',
          impact: { revenue_impact: 'unknown', user_impact: 'unknown' },
          alignment_metrics: [{ metric: 'Status', score: 'Failed', insight: userMsg }],
          risks: ['AI evaluation failed'],
          reason: userMsg,
        };
      }
    }

    const decisionRes = await query(
      `INSERT INTO feature_decisions (feature_id, decision_json)
       VALUES ($1, $2)
       ON CONFLICT (feature_id) DO UPDATE SET decision_json = EXCLUDED.decision_json
       RETURNING *`,
      [featureRequest.id, decisionJson]
    );

    return NextResponse.json(
      { featureRequest, featureDecision: decisionRes.rows[0] },
      { status: body.reanalyzeId ? 200 : 201 }
    );
  } catch (error) {
    console.error('Feature request error:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const startupId = await getAuthedStartupId();
    if (!startupId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await query(
      `SELECT fr.*, fd.decision_json
       FROM feature_requests fr
       LEFT JOIN feature_decisions fd ON fd.feature_id = fr.id
       WHERE fr.startup_id = $1
       ORDER BY fr.id DESC`,
      [startupId]
    );
    return NextResponse.json({ featureRequests: res.rows }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
