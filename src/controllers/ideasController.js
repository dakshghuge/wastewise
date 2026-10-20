const { getIdeas } = require('../services/recommendationService');

function listIdeas(req, res) {
  const ideas = getIdeas({
    category: req.query.category,
    difficulty: req.query.difficulty,
    q: req.query.q
  });
  return res.json({ ideas });
}

module.exports = { listIdeas };
