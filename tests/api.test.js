const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../src/app');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('the app shell and browser bundle are served locally', async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  const html = await response.text();
  assert.match(html, /Give your waste/);
  assert.match(html, /assets\/js\/app\.bundle\.js/);

  const bundle = await fetch(`${baseUrl}/assets/js/app.bundle.js`);
  assert.equal(bundle.status, 200);
  assert.match(bundle.headers.get('content-type'), /javascript/);
  assert.ok((await bundle.text()).length > 1000);
});

test('API endpoints are not served by the static application server', async () => {
  const response = await fetch(`${baseUrl}/api/waste/analyze`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'API endpoints are not available.' });
});

test('Firebase Hosting is static-only and the public client has no Gemini secret', () => {
  const root = path.join(__dirname, '..');
  const hosting = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
  const firebaseConfig = fs.readFileSync(path.join(root, 'public/assets/js/firebase-config.js'), 'utf8');
  const bundle = fs.readFileSync(path.join(root, 'public/assets/js/app.bundle.js'), 'utf8');

  assert.equal('functions' in hosting, false);
  assert.equal(hosting.hosting.public, 'public');
  assert.equal(hosting.hosting.rewrites.some((rewrite) => rewrite.source.startsWith('/api/')), false);
  assert.match(firebaseConfig, /projectId: 'wastewise-836c3'/);
  assert.match(firebaseConfig, /appCheckSiteKey: '[A-Za-z0-9_-]{30,}'/);
  assert.match(bundle, /gemini-3\.8-flash/);
  assert.match(bundle, /ReCaptchaEnterpriseProvider/);
  assert.doesNotMatch(bundle, /ReCaptchaV3Provider/);
  assert.match(bundle, /APP_CHECK_SETUP_REQUIRED/);
  assert.doesNotMatch(firebaseConfig, /GEMINI_API_KEY|process\.env\.GEMINI_API_KEY|apiKey: '.*?[^A-Za-z0-9_-].*'/);
  assert.doesNotMatch(bundle, /GEMINI_API_KEY|process\.env\.GEMINI_API_KEY/);
});

test('the page discloses that images are sent to Google for AI analysis', async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();
  assert.match(html, /sent to Google through Firebase AI Logic/);
  assert.match(html, /Gemini API terms/);
  const goodToKnow = html.match(/<aside class="panel side-note">([\s\S]*?)<\/aside>/)?.[1] || '';
  assert.doesNotMatch(goodToKnow, /sent to Google through Firebase AI Logic/);
  assert.match(html, /id="camera-scanner"/);
  assert.match(html, /id="camera-video"[^>]*playsinline/);
  assert.match(html, /Open camera scanner/);
  assert.doesNotMatch(html, /id="camera-file"/);
  assert.match(html, /id="capture-photo"/);
});
