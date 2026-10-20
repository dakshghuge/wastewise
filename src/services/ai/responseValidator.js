const { categoryById } = require('../../config/categories');

function validateRecognition(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('AI provider returned an invalid recognition object.');
  }

  const { objectName, category, material, confidence, needsConfirmation } = value;
  if (typeof objectName !== 'string' || objectName.trim().length < 1 || objectName.length > 120) {
    throw new Error('AI provider returned an invalid object name.');
  }
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
    objectName: objectName.trim(),
    category,
    material: safeMaterial || 'unknown',
    confidence,
    needsConfirmation: needsConfirmation || confidence < 0.65 || category === 'unknown'
  };
}

module.exports = { validateRecognition };
