const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const geminiApiKey = envContent.split('\n').find(l => l.startsWith('GEMINI_API_KEY'))?.split('=')[1]?.replace(/"/g, '').trim();

const ai = new GoogleGenAI({
  apiKey: geminiApiKey || '',
});

async function testDecision() {
  console.log('Using API Key:', geminiApiKey ? 'Present (First/Last chars: ' + geminiApiKey[0] + '...' + geminiApiKey.slice(-1) + ')' : 'MISSING');
  
  const featureRequest = {
    title: "Web3 Wallet Integration",
    description: "Suggesting we add MetaMask support to the dashboard so users can pay with ETH.",
    requested_by: "Devki",
    department: "Marketing"
  };

  const productReportJson = {
    summary: "Test Report",
    strengths: ["Fast UI", "Good onboarding"],
    weaknesses: ["No crypto support"],
    market_insights: "Crypto is booming",
    revenue_insights: "Payments are high friction",
    user_behavior: "Users click 'pay' then drop off"
  };

  const systemPrompt = `You are a high-level Product Strategy AI (The Founder's Strategic Partner).
Analyze this Feature Request based on the provided Product Intelligence Report.

Your Goal:
1. Provide a definitive Priority Score (0-100) based on how critical this feature is right NOW for the startup.
2. Provide a definitive Decision: Accept (Do it now), Decline (Never), Delay (Later), Validate (Need more info).
3. Identify 3 specialized Alignment Pillars (metrics) that relate this specific feature to the product's vision/market/revenue as derived from the report. Choose the names of these metrics dynamically.

Return ONLY valid JSON that matches the requested schema.`;

  const userPrompt = `Feature Request: ${JSON.stringify(featureRequest)}\n\nReport Context: ${JSON.stringify(productReportJson)}`;

  try {
    console.log('Calling Gemini...');
    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            decision: { type: Type.STRING },
            priority: { type: Type.STRING },
            alignment_metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  metric: { type: Type.STRING },
                  score: { type: Type.STRING },
                  insight: { type: Type.STRING }
                },
                required: ['metric', 'score', 'insight']
              }
            },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            reason: { type: Type.STRING },
            impact: {
              type: Type.OBJECT,
              properties: {
                revenue_impact: { type: Type.STRING },
                user_impact: { type: Type.STRING }
              },
              required: ['revenue_impact', 'user_impact']
            }
          },
          required: ['decision', 'priority', 'impact', 'alignment_metrics', 'risks', 'reason'],
        },
      },
    });

    console.log('Raw Response:', result.text);
    const json = JSON.parse(result.text.replace(/```json|```/gi, '').trim());
    console.log('Parsed JSON Success:', !!json);
  } catch (err) {
    console.error('ERROR during test:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

testDecision();
