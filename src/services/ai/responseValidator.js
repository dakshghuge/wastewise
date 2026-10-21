const { categoryById } = require('../../config/categories');

const ideaTypes = new Set(['reuse', 'repair', 'donate', 'safe_recovery']);
const restrictedCategories = new Set(['electronic', 'hazardous', 'construction', 'unknown']);
const conditions = new Set(['clean', 'worn', 'damaged', 'contaminated', 'unclear']);
const difficulties = new Set(['easy', 'moderate', 'advanced', 'not applicable']);
const recyclingStatuses = new Set(['likely_recyclable', 'check_local', 'usually_not_recyclable', 'not_applicable']);

function requireObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message);
  return value;
}

function requireText(value, field, min, max) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new Error(`AI provider returned invalid ${field}.`);
  }
  return value.trim();
}

function requireTextList(value, field, minItems, maxItems, maxLength) {
  if (!Array.isArray(value) || value.length < minItems || value.length > maxItems) {
    throw new Error(`AI provider returned invalid ${field}.`);
  }
  return value.map((item) => requireText(item, field, 1, maxLength));
}

function validateRecognition(value) {
  requireObject(value, 'AI provider returned an invalid recognition object.');

  const { objectName, category, material, confidence, needsConfirmation } = value;
  const safeObjectName = requireText(objectName, 'object name', 1, 120);
  if (typeof category !== 'string' || !categoryById.has(category)) {
    throw new Error('AI provider returned an unsupported waste category.');
  }
  if (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error('AI provider returned an invalid confidence value.');
  }
  if (typeof needsConfirmation !== 'boolean') {
    throw new Error('AI provider omitted the confirmation status.');
  }

  const safeMaterial = typeof material === 'string' && material.length <= 80 ? material.trim() : 'unknown';
  return {
    objectName: safeObjectName,
    category,
    material: safeMaterial || 'unknown',
    confidence,
    needsConfirmation: needsConfirmation || confidence < 0.65 || category === 'unknown'
  };
}

function validateWasteAnalysis(value) {
  requireObject(value, 'AI provider returned an invalid analysis object.');
  const recognition = validateRecognition(value.recognition);
  const assessment = requireObject(value.itemAssessment, 'AI provider returned invalid item details.');
  if (!conditions.has(assessment.condition)) throw new Error('AI provider returned an invalid item condition.');

  const itemAssessment = {
    summary: requireText(assessment.summary, 'item summary', 20, 400),
    observations: requireTextList(assessment.observations, 'visual observations', 2, 5, 200),
    condition: assessment.condition,
    materialNotes: requireText(assessment.materialNotes, 'material notes', 10, 300),
    reuseOutlook: requireText(assessment.reuseOutlook, 'reuse outlook', 10, 300),
    preparationSteps: requireTextList(assessment.preparationSteps, 'item preparation steps', 2, 5, 200)
  };
  const recycling = requireObject(value.recyclingAssessment, 'AI provider returned invalid recycling preparation details.');
  if (!recyclingStatuses.has(recycling.status)) throw new Error('AI provider returned an invalid recycling status.');
  if (['hazardous', 'unknown'].includes(recognition.category) && recycling.status !== 'not_applicable') {
    throw new Error('AI provider returned unsupported recycling guidance for a restricted category.');
  }
  const recyclingAssessment = {
    status: recycling.status,
    summary: requireText(recycling.summary, 'recycling assessment summary', 20, 400),
    checks: requireTextList(recycling.checks, 'recycling checks', 2, 5, 200),
    preparationSteps: requireTextList(recycling.preparationSteps, 'recycling preparation steps', 3, 6, 200),
    localNotes: requireText(recycling.localNotes, 'local recycling notes', 15, 300)
  };
  if (!Array.isArray(value.reuseIdeas) || value.reuseIdeas.length < 3 || value.reuseIdeas.length > 4) {
    throw new Error('AI provider must return three or four tailored suggestions.');
  }

  const reuseIdeas = value.reuseIdeas.map((rawIdea) => {
    const idea = requireObject(rawIdea, 'AI provider returned an invalid suggestion.');
    if (!ideaTypes.has(idea.type)) throw new Error('AI provider returned an unsupported suggestion type.');
    if (!difficulties.has(idea.difficulty)) throw new Error('AI provider returned an invalid suggestion difficulty.');
    return {
      type: idea.type,
      title: requireText(idea.title, 'suggestion title', 3, 80),
      description: requireText(idea.description, 'suggestion description', 20, 400),
      suitability: requireText(idea.suitability, 'suggestion suitability', 10, 240),
      materials: requireTextList(idea.materials, 'suggestion materials', 1, 6, 100),
      difficulty: idea.difficulty,
      estimatedTime: requireText(idea.estimatedTime, 'suggestion time estimate', 2, 50),
      steps: requireTextList(idea.steps, 'suggestion steps', 2, 6, 220),
      safetyNotes: requireTextList(idea.safetyNotes, 'suggestion safety notes', 1, 4, 220)
    };
  });

  if (restrictedCategories.has(recognition.category) && reuseIdeas.some((idea) => idea.type !== 'safe_recovery')) {
    throw new Error('AI provider returned an unsafe DIY suggestion for a restricted category.');
  }
  return { recognition, itemAssessment, recyclingAssessment, reuseIdeas };
}

module.exports = { validateRecognition, validateWasteAnalysis };
