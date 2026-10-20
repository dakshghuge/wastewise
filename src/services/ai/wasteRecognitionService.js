const { validateRecognition } = require('./responseValidator');
const { categoryById } = require('../../config/categories');

async function recognizeWaste(imageBuffer, mimeType) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('Gemini image recognition is not configured. Select a category for manual guidance or configure GEMINI_API_KEY.');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            {
              text: `Identify the main visible waste item in this image. Do not infer material beyond visible evidence. Choose exactly one category from: ${[...categoryById.keys()].join(', ')}. If unclear, choose "unknown", use low confidence, and set needsConfirmation to true. Do not provide disposal advice.`
            },
            { inlineData: { mimeType, data: imageBuffer.toString('base64') } }
          ]
        }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              objectName: { type: 'STRING' },
              category: { type: 'STRING', enum: [...categoryById.keys()] },
              material: { type: 'STRING' },
              confidence: { type: 'NUMBER' },
              needsConfirmation: { type: 'BOOLEAN' }
            },
            required: ['objectName', 'category', 'material', 'confidence', 'needsConfirmation']
          }
        }
      })
    });

    if (!response.ok) {
      const error = new Error(`Gemini API request failed with status ${response.status}.`);
      error.status = response.status === 429 ? 503 : 502;
      throw error;
    }
    const payload = await response.json();
    const content = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();
    if (!content) throw new Error('Gemini response did not contain recognition data.');
    return validateRecognition(JSON.parse(content));
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Gemini image recognition timed out. Please try again.');
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { recognizeWaste };
