function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  const expectedOrigin = process.env.CLIENT_ORIGIN || `${req.protocol}://${req.get('host')}`;
  if (origin && origin !== expectedOrigin) {
    return res.status(403).json({ error: 'Cross-origin request rejected.' });
  }
  if (!origin && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Origin header is required for this request.' });
  }
  return next();
}

module.exports = { requireSameOrigin };
