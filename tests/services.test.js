const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRecognition } = require('../src/services/ai/responseValidator');
const { getIdeas } = require('../src/services/recommendationService');
const { getGuide } = require('../src/services/recyclingService');
const { getDisposalGuidance } = require('../src/services/disposalService');

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
