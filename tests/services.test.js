const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRecognition, validateWasteAnalysis } = require('../src/services/ai/responseValidator');
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

test('detailed image analysis requires item-specific details and three tailored suggestions', () => {
  const result = validateWasteAnalysis({
    recognition: {
      objectName: 'Crumpled paper cup',
      category: 'paper',
      material: 'paper, coating uncertain',
      confidence: 0.91,
      needsConfirmation: false
    },
    itemAssessment: {
      summary: 'A used paper cup is visible, with its rim crushed and the inside condition unclear.',
      observations: ['The cup is visibly crumpled.', 'A possible inner lining cannot be confirmed from the photo.'],
      condition: 'unclear',
      materialNotes: 'Paper cups may have a thin lining; the image cannot confirm its material.',
      reuseOutlook: 'Reuse is most suitable for dry, clean, non-food-contact crafts or organization.',
      preparationSteps: ['Empty and let the cup dry.', 'Check for grease, residue, and a lining before recycling.']
    },
    recyclingAssessment: {
      status: 'check_local',
      summary: 'Paper cups may have moisture-resistant linings that affect local recycling acceptance.',
      checks: ['Check for food residue or grease.', 'Confirm whether the cup appears coated.'],
      preparationSteps: ['Empty leftover contents.', 'Keep the cup dry.', 'Check local acceptance for lined cups.'],
      localNotes: 'Recycling acceptance for coated paper cups varies by local collection program.'
    },
    reuseIdeas: Array.from({ length: 3 }, (_, index) => ({
      type: 'reuse',
      title: `Idea ${index + 1}`,
      description: 'Reuse this clean, dry cup for a small household organizing task.',
      suitability: 'Only use it if it is clean, dry, and structurally stable.',
      materials: ['Clean cup'],
      difficulty: 'easy',
      estimatedTime: '5 minutes',
      steps: ['Clean and dry the cup.', 'Use it to hold small lightweight items.'],
      safetyNotes: ['Do not use a damaged cup for food or liquids.']
    }))
  });
  assert.equal(result.recognition.objectName, 'Crumpled paper cup');
  assert.equal(result.itemAssessment.observations.length, 2);
  assert.equal(result.recyclingAssessment.preparationSteps.length, 3);
  assert.equal(result.recyclingAssessment.status, 'check_local');
  assert.equal(result.reuseIdeas.length, 3);
  assert.equal(result.reuseIdeas[0].safetyNotes.length, 1);
});

test('detailed analysis rejects missing suggestions and DIY ideas for hazardous items', () => {
  const validPaperCup = {
    recognition: {
      objectName: 'Paper cup',
      category: 'paper',
      material: 'paper',
      confidence: 0.8,
      needsConfirmation: false
    },
    itemAssessment: {
      summary: 'A paper cup is visible and appears intact, but its inner lining is not identifiable.',
      observations: ['The cup appears intact.', 'No lining information is visible.'],
      condition: 'unclear',
      materialNotes: 'A photo cannot verify whether this cup has a plastic or other coating.',
      reuseOutlook: 'Choose a dry, non-food use if the cup is clean and stable.',
      preparationSteps: ['Empty and dry the cup.', 'Check for residue before deciding how to handle it.']
    },
    recyclingAssessment: {
      status: 'check_local',
      summary: 'Paper cups may have moisture-resistant linings that affect local recycling acceptance.',
      checks: ['Check for food residue or grease.', 'Confirm whether the cup appears coated.'],
      preparationSteps: ['Empty leftover contents.', 'Keep the cup dry.', 'Check local acceptance for lined cups.'],
      localNotes: 'Recycling acceptance for coated paper cups varies by local collection program.'
    },
    reuseIdeas: Array.from({ length: 3 }, (_, index) => ({
      type: 'reuse',
      title: `Idea ${index + 1}`,
      description: 'Reuse this clean cup for a simple, dry household organizing task.',
      suitability: 'Suitable only when the cup is clean, dry, and stable.',
      materials: ['Clean cup'],
      difficulty: 'easy',
      estimatedTime: '5 minutes',
      steps: ['Clean and dry the cup.', 'Use it to hold small lightweight items.'],
      safetyNotes: ['Do not use it for food or liquids.']
    }))
  };
  assert.throws(() => validateWasteAnalysis({ ...validPaperCup, reuseIdeas: validPaperCup.reuseIdeas.slice(0, 2) }), /three or four/i);
  const unknown = structuredClone(validPaperCup);
  unknown.recognition.category = 'unknown';
  assert.throws(() => validateWasteAnalysis(unknown), /unsupported recycling guidance/i);
  const hazardous = structuredClone(validPaperCup);
  hazardous.recognition.category = 'hazardous';
  hazardous.recyclingAssessment.status = 'not_applicable';
  assert.throws(() => validateWasteAnalysis(hazardous), /unsafe DIY suggestion/i);
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
