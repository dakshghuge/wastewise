const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { requireSameOrigin } = require('./middleware/sameOrigin');
const { upload, validateImageSignature, maxBytes } = require('./middleware/uploadMiddleware');
const { errorHandler } = require('./middleware/errorHandler');
const waste = require('./controllers/wasteController');
const ideas = require('./controllers/ideasController');
const { getGuideAsync } = require('./services/recyclingService');
const { getDisposalGuidance } = require('./services/disposalService');
const { categories } = require('./config/categories');
const { guides } = require('./data/guidance');

const app = express();
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: 'draft-7', legacyHeaders: false });
const analysisLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: 'draft-7', legacyHeaders: false });
const write = [requireSameOrigin];

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  referrerPolicy: { policy: 'no-referrer' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'blob:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.get('/api/config', (req, res) => res.json({
  maxUploadBytes: maxBytes,
  aiConfigured: Boolean(process.env.OPENAI_API_KEY)
}));
app.use(cors({
  origin(origin, callback) {
    const allowed = process.env.CLIENT_ORIGIN;
    if (!origin) return callback(null, true);
    if (allowed && origin === allowed) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '32kb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  ai: process.env.OPENAI_API_KEY ? 'configured' : 'manual-mode-available',
  timestamp: new Date().toISOString()
}));

app.get('/api/waste/categories', waste.listCategories);
app.post('/api/waste/analyze', ...write, analysisLimiter, upload.single('image'), validateImageSignature, waste.analyze);

app.get('/api/ideas', ideas.listIdeas);

app.get('/api/recycling/:category', async (req, res, next) => {
  try {
    const guide = await getGuideAsync(req.params.category);
    if (!guide) return res.status(404).json({ error: 'Recycling guidance not found.' });
    return res.json({ guide });
  } catch (error) {
    return next(error);
  }
});
app.get('/api/disposal/:category', (req, res) => res.json({ guidance: getDisposalGuidance(req.params.category) }));

app.get('/api/learn', (req, res) => res.json({
  resources: [
    { id: 'segregation', title: 'Waste segregation basics', category: 'Getting started', summary: 'Keep materials separated and follow the requirements of your local waste program.' },
    { id: 'plastic', title: 'Understanding plastic recycling', category: 'Recycling', summary: 'Plastic collection varies by location and polymer. Check the rules for your local service.' },
    { id: 'paper', title: 'Paper and cardboard', category: 'Recycling', summary: 'Clean, dry paper is more likely to be accepted; food-soiled paper may not be.' },
    { id: 'organic', title: 'Organic waste and composting', category: 'Composting', summary: 'Use a compost program that accepts the particular food scraps you have.' },
    { id: 'e-waste', title: 'Electronics and batteries', category: 'Safety', summary: 'Use authorized take-back or e-waste services. Do not dismantle batteries or devices.' },
    { id: 'reuse', title: 'Reuse before recycling', category: 'Reuse', summary: 'Consider repair, donation, or another safe use before an item becomes waste.' }
  ]
}));
app.get('/api/recycling', (req, res) => res.json({ categories: Object.keys(guides) }));

app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found.' });
  return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'), (error) => error && next(error));
});
app.use(errorHandler);

module.exports = app;
