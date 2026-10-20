const { ideas } = require('../data/guidance');

function getIdeas({ category, difficulty, q } = {}) {
  const query = typeof q === 'string' ? q.trim().toLowerCase() : '';
  return ideas.filter((idea) => {
    if (category && idea.category !== category) return false;
    if (difficulty && idea.difficulty !== difficulty) return false;
    if (query && !`${idea.title} ${idea.description} ${idea.materials.join(' ')}`.toLowerCase().includes(query)) return false;
    return true;
  });
}

module.exports = { getIdeas };
