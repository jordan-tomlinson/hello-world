const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

test('GET / returns 200 with Hello world', async () => {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello world');
    } else {
      res.writeHead(405);
      res.end('Method Not Allowed');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  const body = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}`, (res) => {
      assert.strictEqual(res.statusCode, 200);
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

  assert.strictEqual(body, 'Hello world');
  await new Promise((resolve) => server.close(resolve));
});

test('non-GET returns 405', async () => {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
      res.writeHead(200);
      res.end('Hello world');
    } else {
      res.writeHead(405);
      res.end('Method Not Allowed');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  const statusCode = await new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, method: 'POST' }, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.end();
  });

  assert.strictEqual(statusCode, 405);
  await new Promise((resolve) => server.close(resolve));
});
