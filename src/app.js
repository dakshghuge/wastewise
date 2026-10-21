const path = require('path');
const express = require('express');
const helmet = require('helmet');

const app = express();
const publicDirectory = path.join(__dirname, '..', 'public');

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.google.com', 'https://www.gstatic.com'],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'blob:', 'data:'],
      connectSrc: ["'self'", 'https://*.googleapis.com', 'https://www.google.com', 'https://www.gstatic.com'],
      frameSrc: ['https://www.google.com', 'https://recaptcha.google.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(express.static(publicDirectory));
app.get('/api/*', (_req, res) => res.status(404).json({ error: 'API endpoints are not available.' }));
app.get('*', (_req, res) => res.sendFile(path.join(publicDirectory, 'index.html')));

module.exports = app;
