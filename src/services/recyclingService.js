const { guides, fallbackGuide } = require('../data/guidance');
const { categoryById } = require('../config/categories');

function getGuide(category, override = null) {
  if (!categoryById.has(category)) return null;
  return { category, ...fallbackGuide, ...(guides[category] || {}), ...(override || {}) };
}

async function getGuideAsync(category) {
  return getGuide(category);
}

module.exports = { getGuide, getGuideAsync };
