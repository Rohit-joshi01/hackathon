const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const geminiApiKey = envContent.split('\n').find(l => l.startsWith('GEMINI_API_KEY'))?.split('=')[1]?.replace(/"/g, '').trim();

const ai = new GoogleGenAI({
  apiKey: geminiApiKey || '',
});

async function testGeneration() {
  console.log('Testing with API Key:', geminiApiKey.substring(0, 10) + '...');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: 'Check connection' }] }],
    });
    console.log('Success!', response.text);
  } catch (err) {
    console.error('FAILED with error:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

testGeneration();
