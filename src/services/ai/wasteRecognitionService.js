const { validateRecognition } = require('./responseValidator');
const { categoryById } = require('../../config/categories');

async function recognizeWaste(imageBuffer, mimeType) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('AI recognition is not configured. Select a category to use clearly labeled manual development mode.');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Identify the visible waste item. Return only JSON with keys objectName (string), category (one of ${[...categoryById.keys()].join(', ')}), material (string or "unknown"), confidence (number 0-1), needsConfirmation (boolean). If unclear, use category "unknown", material "unknown", low confidence, and needsConfirmation true. Do not provide disposal advice.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify the main waste item in this image. Do not infer material beyond visible evidence.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBuffer.toString('base64')}`, detail: 'low' } }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const error = new Error(`AI provider request failed with status ${response.status}.`);
      error.status = response.status === 429 ? 503 : 502;
      throw error;
    }
    const payload = await response.json();
    const content = payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
    if (typeof content !== 'string') throw new Error('AI provider response did not contain recognition data.');
    return validateRecognition(JSON.parse(content));
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('AI recognition timed out. Please try again.');
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { recognizeWaste };
