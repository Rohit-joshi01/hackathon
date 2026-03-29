import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'fallback',
});

const createFeatureRequestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requested_by: z.string().min(2).optional().or(z.literal('')),
  department: z.string().min(2).optional().or(z.literal('')),
  status: z.string().min(1).optional(),
});

const decisionJsonSchema = z.object({
  decision: z.string(),
  priority: z.string(),
  impact: z.object({
    revenue_impact: z.string(),
    user_impact: z.string(),
  }),
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

type DecisionJson = z.infer<typeof decisionJsonSchema>;

async function generateDecision(featureRequest: FeatureRequestRow, productReportJson: unknown): Promise<DecisionJson> {
  const systemPrompt = `You are an AI Decision Engine composed of 5 specialized agents:
1) Alignment Agent: Check alignment with product insights
2) Impact Agent: Predict revenue impact and user impact
3) Risk Agent: Identify risks
4) Decision Agent: Decide Accept / Decline / Delay / Validate and explain why
5) Priority Agent: Provide a priority score from 0 to 100

Given a Feature Request and a Product Report JSON, produce an objective recommendation.
Return ONLY valid JSON that matches the requested schema.`;

  const userPrompt = `Feature Request:
${JSON.stringify(
    {
      title: featureRequest.title,
      description: featureRequest.description,
      requested_by: featureRequest.requested_by,
      department: featureRequest.department,
      status: featureRequest.status,
    },
    null,
    2
  )}

Product Report JSON:
${JSON.stringify(productReportJson, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ text: systemPrompt }, { text: userPrompt }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          decision: { type: Type.STRING },
          priority: { type: Type.STRING },
          impact: {
            type: Type.OBJECT,
            properties: {
              revenue_impact: { type: Type.STRING },
              user_impact: { type: Type.STRING },
            },
            required: ['revenue_impact', 'user_impact'],
          },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          reason: { type: Type.STRING },
        },
        required: ['decision', 'priority', 'impact', 'risks', 'reason'],
      },
    },
  });

  if (!response.text) {
    return {
      decision: 'Validate',
      priority: '0',
      impact: { revenue_impact: 'unknown', user_impact: 'unknown' },
      risks: ['No AI response received'],
      reason: 'AI did not return a response. Validate inputs and try again.',
    };
  }

  const parsed = decisionJsonSchema.safeParse(JSON.parse(response.text));
  if (!parsed.success) {
    return {
      decision: 'Validate',
      priority: '0',
      impact: { revenue_impact: 'unknown', user_impact: 'unknown' },
      risks: ['AI output did not match schema'],
      reason: 'The decision engine produced invalid output. Validate inputs and try again.',
    };
  }

  return parsed.data;
}

export async function POST(request: Request) {
  try {
    const startupId = await getAuthedStartupId();
    if (!startupId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const parsed = createFeatureRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, description, requested_by, department, status } = parsed.data;

    const insertRes = await query<FeatureRequestRow>(
      `INSERT INTO feature_requests (startup_id, title, description, requested_by, department, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        startupId,
        title,
        description,
        requested_by ? requested_by : null,
        department ? department : null,
        status || 'Submitted',
      ]
    );
    const featureRequest = insertRes.rows[0];

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
        risks: ['No product report available'],
        reason: 'Generate a Product Intelligence report first, then re-run feature analysis.',
      };
    } else {
      decisionJson = await generateDecision(featureRequest, prRes.rows[0].report_json);
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
      { status: 201 }
    );
  } catch (error) {
    console.error('Feature request error:', error);
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
    console.error('Fetch feature requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
