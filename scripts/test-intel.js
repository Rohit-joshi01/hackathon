const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const geminiApiKey = envContent.split('\n').find(l => l.startsWith('GEMINI_API_KEY'))?.split('=')[1]?.replace(/"/g, '').trim();

const ai = new GoogleGenAI({
  apiKey: geminiApiKey || '',
});

async function testIntelligence() {
  const parts = [{ text: "Startup: TestApp. Analyze and return report JSON with chart_data." }];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            chart_data: {
              type: Type.OBJECT,
              properties: {
                user_behavior_patterns: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      value: { type: Type.INTEGER }
                    },
                    required: ["category", "value"]
                  }
                },
                revenue_blockers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { blocker: {type: Type.STRING}, severity: {type: Type.INTEGER} }, required: ["blocker", "severity"] } },
                market_opportunities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { segment: {type: Type.STRING}, potential: {type: Type.INTEGER} }, required: ["segment", "potential"] } }
              },
              required: ["user_behavior_patterns", "revenue_blockers", "market_opportunities"]
            }
          },
          required: ["summary", "chart_data"]
        }
      }
    });

    console.log('Response:', response.text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testIntelligence();
