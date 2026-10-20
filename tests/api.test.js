const test = require('node:test');
const assert = require('node:assert/strict');
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

test('health and categories endpoints return usable configuration', async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  const healthPayload = await health.json();
  assert.equal(healthPayload.status, 'ok');
  assert.equal('firestore' in healthPayload, false);
  const response = await fetch(`${baseUrl}/api/waste/categories`);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.ok(payload.categories.some((category) => category.id === 'electronic'));
  const authResponse = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(authResponse.status, 404);
  const guideResponse = await fetch(`${baseUrl}/api/recycling/cardboard`);
  assert.equal(guideResponse.status, 200);
  assert.match((await guideResponse.json()).guide.source, /verify with your local waste authority/i);
});

test('the responsive application shell is served at the site root', async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /Give your waste/);
});

test('manual analysis labels results honestly and does not retain or return uploaded images', async () => {
  const body = new FormData();
  body.set('category', 'cardboard');
  body.set('image', new Blob([Buffer.from([0xff, 0xd8, 0xff])], { type: 'image/jpeg' }), 'temporary.jpg');
  const response = await fetch(`${baseUrl}/api/waste/analyze`, { method: 'POST', body });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.mode, 'manual');
  assert.equal(result.recognition.objectName, 'Manual category selection');
  assert.equal(result.recognition.confidence, null);
  assert.equal('imageDataUrl' in result, false);
  assert.equal('scanId' in result, false);
  assert.equal('saved' in result, false);
});

test('production same-origin writes work behind an HTTPS-terminating proxy', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousClientOrigin = process.env.CLIENT_ORIGIN;
  process.env.NODE_ENV = 'production';
  delete process.env.CLIENT_ORIGIN;
  try {
    const body = new FormData();
    body.set('category', 'cardboard');
    const response = await fetch(`${baseUrl}/api/waste/analyze`, {
      method: 'POST',
      headers: {
        Origin: baseUrl.replace('http://', 'https://'),
        'X-Forwarded-Proto': 'https'
      },
      body
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).mode, 'manual');
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousClientOrigin === undefined) delete process.env.CLIENT_ORIGIN;
    else process.env.CLIENT_ORIGIN = previousClientOrigin;
  }
});

test('AI is not represented as available when no provider key is configured', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const body = new FormData();
    body.set('image', new Blob([Buffer.from([0xff, 0xd8, 0xff])], { type: 'image/jpeg' }), 'item.jpg');
    const response = await fetch(`${baseUrl}/api/waste/analyze`, { method: 'POST', body });
    const result = await response.json();
    assert.equal(response.status, 503);
    assert.equal(result.code, 'AI_NOT_CONFIGURED');
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test('invalid manual category and unsupported image bytes are rejected', async () => {
  const invalidCategory = new FormData();
  invalidCategory.set('category', 'not-real');
  let response = await fetch(`${baseUrl}/api/waste/analyze`, { method: 'POST', body: invalidCategory });
  assert.equal(response.status, 400);

  const invalidImage = new FormData();
  invalidImage.set('image', new Blob(['not an image'], { type: 'image/png' }), 'sample.png');
  response = await fetch(`${baseUrl}/api/waste/analyze`, { method: 'POST', body: invalidImage });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /not a supported image/i);
});

test('image size limit is enforced by the upload middleware', async () => {
  const body = new FormData();
  const oversized = new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' });
  body.set('image', oversized, 'large.png');
  const response = await fetch(`${baseUrl}/api/waste/analyze`, { method: 'POST', body });
  assert.equal(response.status, 413);
  assert.match((await response.json()).error, /upload limit/i);
});

test('sign-in and personal-data persistence APIs are disabled', async () => {
  const paths = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/password-reset',
    '/api/scans',
    '/api/activities',
    '/api/feedback',
    '/api/collections',
    '/api/notifications',
    '/api/admin/users'
  ];
  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 404, `${path} should not be available`);
  }
  for (const path of ['/api/auth/register', '/api/auth/login', '/api/activities', '/api/feedback', '/api/collections']) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    assert.equal(response.status, 404, `${path} should not accept writes`);
  }
});

test('nearby centers page and endpoint are no longer exposed', async () => {
  const page = await fetch(baseUrl);
  assert.doesNotMatch(await page.text(), /Nearby centers|view-centers|centers-list/);
  const response = await fetch(`${baseUrl}/api/centers`);
  assert.equal(response.status, 404);
});
