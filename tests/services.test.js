const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRecognition } = require('../src/services/ai/responseValidator');
const { getIdeas } = require('../src/services/recommendationService');
const { getGuide } = require('../src/services/recyclingService');
const { getDisposalGuidance } = require('../src/services/disposalService');
const { recognizeWaste } = require('../src/services/ai/wasteRecognitionService');

test('recognition accepts valid structured output and requires confirmation for low confidence', () => {
  const result = validateRecognition({
    objectName: 'Bottle',
    category: 'plastic',
    material: 'unknown',
    confidence: 0.4,
    needsConfirmation: false
  });
  assert.equal(result.objectName, 'Bottle');
  assert.equal(result.needsConfirmation, true);
  assert.equal(result.material, 'unknown');
});

test('recognition rejects unsupported categories and malformed confidence', () => {
  assert.throws(() => validateRecognition({
    objectName: 'Item', category: 'invented', material: 'unknown', confidence: 0.9, needsConfirmation: false
  }), /unsupported waste category/i);
  assert.throws(() => validateRecognition({
    objectName: 'Item', category: 'plastic', material: 'plastic', confidence: 2, needsConfirmation: false
  }), /confidence/i);
  assert.throws(() => validateRecognition(null), /invalid recognition object/i);
});

test('Gemini image recognition sends image data and validates structured response', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;
  const previousFetch = global.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.GEMINI_MODEL = 'test-vision-model';
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                objectName: 'Plastic bottle',
                category: 'plastic',
                material: 'plastic',
                confidence: 0.93,
                needsConfirmation: false
              })
            }]
          }
        }]
      })
    };
  };

  try {
    const result = await recognizeWaste(Buffer.from('image bytes'), 'image/jpeg');
    assert.equal(result.category, 'plastic');
    assert.equal(result.needsConfirmation, false);
    assert.match(request.url, /models\/test-vision-model:generateContent$/);
    assert.equal(request.options.headers['x-goog-api-key'], 'test-key');
    const body = JSON.parse(request.options.body);
    assert.equal(body.contents[0].parts[1].inlineData.mimeType, 'image/jpeg');
    assert.equal(body.contents[0].parts[1].inlineData.data, Buffer.from('image bytes').toString('base64'));
    assert.equal(body.generationConfig.responseMimeType, 'application/json');
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = previousModel;
  }
});

test('Gemini image recognition reports missing key without contacting the provider', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = global.fetch;
  delete process.env.GEMINI_API_KEY;
  global.fetch = async () => {
    throw new Error('Provider must not be called without a key.');
  };
  try {
    await assert.rejects(recognizeWaste(Buffer.from('image'), 'image/png'), {
      code: 'AI_NOT_CONFIGURED'
    });
  } finally {
    global.fetch = previousFetch;
    if (previousKey !== undefined) process.env.GEMINI_API_KEY = previousKey;
  }
});

test('Gemini model 404 includes provider details and does not expose the API key', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;
  const previousFetch = global.fetch;
  process.env.GEMINI_API_KEY = 'test-secret-key';
  process.env.GEMINI_MODEL = 'models/missing-model';
  global.fetch = async (url) => {
    assert.match(url, /models\/missing-model:generateContent$/);
    return {
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          message: 'models/missing-model is not found for API key test-secret-key'
        }
      })
    };
  };
  try {
    await assert.rejects(
      recognizeWaste(Buffer.from('image'), 'image/jpeg'),
      (error) => {
        assert.equal(error.status, 502);
        assert.match(error.message, /GEMINI_MODEL in Render/);
        assert.match(error.message, /models\/missing-model is not found/);
        assert.doesNotMatch(error.message, /test-secret-key/);
        return true;
      }
    );
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = previousModel;
  }
});

test('reuse search filters by category and query', () => {
  assert.deepEqual(getIdeas({ category: 'cardboard' }).map((idea) => idea.id), ['box-organizer']);
  assert.deepEqual(getIdeas({ q: 'cotton' }).map((idea) => idea.id), ['cloth-cleaning']);
  assert.equal(getIdeas({ category: 'unknown' }).length, 0);
});

test('recycling advice is category-aware and clearly asks users to verify locally', () => {
  const guide = getGuide('cardboard');
  assert.ok(guide.preparationSteps.some((step) => step.toLowerCase().includes('dry')));
  assert.match(guide.source, /verify with your local waste authority/i);
  assert.equal(getGuide('not-a-category'), null);
});

test('hazardous disposal guidance never suggests DIY processing', () => {
  const advice = getDisposalGuidance('hazardous');
  assert.match(advice.handling, /authorized hazardous-waste service/i);
  assert.match(advice.handling, /Do not/i);
  assert.equal(advice.locationSpecific, false);
});
