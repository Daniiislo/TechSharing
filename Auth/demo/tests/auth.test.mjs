import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const base = 'http://127.0.0.1:5091';
let server, output = '';
before(async () => {
  server = spawn('dotnet', ['run', '--project', root, '--no-launch-profile'], {
    env: { ...process.env, AUTHLAB_PORT: '5091', AUTHLAB_ACCESS_SECONDS: '3' }, stdio: ['ignore', 'pipe', 'pipe']
  });
  server.stdout.on('data', x => output += x);
  server.stderr.on('data', x => output += x);
  for (let i = 0; i < 200; i++) {
    try { if ((await fetch(base + '/api/health')).ok) return; } catch {}
    if (server.exitCode !== null) throw new Error(output);
    await new Promise(r => setTimeout(r, 150));
  }
  throw new Error('Server did not start: ' + output);
});
after(() => server?.kill());

async function lab() {
  const res = await fetch(base + '/api/lab');
  const cookie = res.headers.get('set-cookie').split(';')[0];
  const call = async (path, body, token) => {
    const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST',
      headers: { cookie, origin: base, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  };
  const login = async () => (await call('/api/login', { username: 'anna', password: 'Anna@123!' })).body;
  return { call, login, cookie };
}
test('auth lifecycle and all role combinations', async () => {
  const { call, login } = await lab();
  assert.equal((await call('/api/products/current')).status, 200);
  assert.equal((await call('/api/me')).status, 401);
  assert.equal((await call('/api/login', { username: 'anna', password: 'wrong' })).status, 401);
  const credentials = await login();
  assert.ok(credentials.accessToken);
  const product = await call('/api/products/current');
  assert.equal(product.status, 200);
  assert.equal(product.body.product.name, 'Tranh Bình Minh');
  for (let mask = 0; mask < 4; mask++) {
    await call('/api/presenter/reset', {});
    const c = await login();
    const roles = ['Bidder', 'Auctioneer'].filter((_, i) => mask & (1 << i));
    assert.equal((await call('/api/presenter/roles', { roles })).status, 200);
    assert.equal((await call('/api/products/current')).status, 200);
    assert.equal((await call('/api/me', undefined, c.accessToken)).status, 200);
    assert.equal((await call('/api/products/current', { name: 'Tranh Hoàng Hôn', description: 'Tranh sơn dầu' }, c.accessToken)).status, mask & 2 ? 200 : 403);
    assert.equal((await call('/api/bids', { amount: 1600000 }, c.accessToken)).status, mask & 1 ? 200 : 403);
    assert.equal((await call('/api/event/close', {}, c.accessToken)).status, mask & 2 ? 200 : 403);
  }
});
test('role removal is 403, refresh revocation leaves access, access revoke blocks both copies', async () => {
  const { call, login } = await lab();
  const c = await login();
  await call('/api/presenter/roles', { roles: ['Bidder'] });
  assert.equal((await call('/api/me', undefined, c.accessToken)).status, 200);
  await call('/api/presenter/roles', { roles: [] });
  assert.equal((await call('/api/bids', { amount: 1600000 }, c.accessToken)).status, 403);
  await call('/api/presenter/revoke-refresh', {});
  assert.equal((await call('/api/refresh', { refreshToken: c.refreshToken })).status, 401);
  assert.equal((await call('/api/me', undefined, c.accessToken)).status, 200);
  await call('/api/presenter/revoke-access', { accessToken: c.accessToken });
  for (let i = 0; i < 2; i++) assert.equal((await call('/api/me', undefined, c.accessToken)).status, 401);
});
test('business validation, reset, refresh rotation and browser isolation', async () => {
  const a = await lab(), b = await lab();
  const c = await a.login();
  await a.call('/api/presenter/roles', { roles: ['Bidder', 'Auctioneer'] });
  assert.equal((await a.call('/api/bids', { amount: 1 }, c.accessToken)).status, 422);
  assert.equal((await a.call('/api/presenter/roles', { roles: ['SuperAdmin'] })).status, 400);
  assert.equal((await b.call('/api/me', undefined, c.accessToken)).status, 401);
  assert.deepEqual((await b.call('/api/lab')).body.roles, []);
  await a.call('/api/event/close', {}, c.accessToken);
  assert.equal((await a.call('/api/bids', { amount: 1600000 }, c.accessToken)).status, 409);
  const renewed = await a.call('/api/refresh', { refreshToken: c.refreshToken });
  assert.equal(renewed.status, 200);
  assert.notEqual(renewed.body.refreshToken, c.refreshToken);
  assert.equal((await a.call('/api/refresh', { refreshToken: c.refreshToken })).status, 401);
  await a.call('/api/presenter/reset', {});
  assert.equal((await a.call('/api/me', undefined, renewed.body.accessToken)).status, 401);
});
test('expired token and cross-origin presenter calls are rejected', async () => {
  const a = await lab(), c = await a.login();
  const attack = await fetch(base + '/api/presenter/roles', { method: 'POST', headers: { cookie: a.cookie, origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ roles: ['Auctioneer'] }) });
  assert.equal(attack.status, 403);
  await new Promise(r => setTimeout(r, 3200));
  assert.equal((await a.call('/api/me', undefined, c.accessToken)).status, 401);
});
test('invalid role inputs return 400 and concurrent refresh consumes a token only once', async () => {
  const a = await lab();
  assert.equal((await a.call('/api/presenter/roles', { roles: [null] })).status, 400);
  assert.equal((await a.call('/api/presenter/roles', { roles: null })).status, 400);
  const c = await a.login();
  const results = await Promise.all([a.call('/api/refresh', { refreshToken: c.refreshToken }), a.call('/api/refresh', { refreshToken: c.refreshToken })]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 401]);
});


test('auctioneer edits product metadata while bidder cannot, with public reads and validation', async () => {
  const a = await lab();
  assert.deepEqual((await a.call('/api/lab')).body.roles, []);
  assert.equal((await a.call('/api/products/current', { name: 'Mới', description: '' })).status, 401);
  const c = await a.login();
  await a.call('/api/presenter/roles', { roles: ['Bidder'] });
  assert.equal((await a.call('/api/products/current', { name: 'Mới', description: '' }, c.accessToken)).status, 403);
  await a.call('/api/presenter/roles', { roles: ['Auctioneer'] });
  assert.equal((await a.call('/api/products/current', { name: '   ', description: '' }, c.accessToken)).status, 400);
  assert.equal((await a.call('/api/products/current', { name: 'Tranh Hoàng Hôn', description: 'Tranh sơn dầu trên canvas.' }, c.accessToken)).status, 200);
  const product = (await a.call('/api/products/current')).body.product;
  assert.equal(product.name, 'Tranh Hoàng Hôn');
  assert.equal(product.description, 'Tranh sơn dầu trên canvas.');
  assert.equal(product.currentBid, 1500000);
  await a.call('/api/presenter/roles', { roles: [] });
  assert.equal((await a.call('/api/products/current', { name: 'Không được sửa', description: '' }, c.accessToken)).status, 403);
  await a.call('/api/presenter/revoke-access', { accessToken: c.accessToken });
  assert.equal((await a.call('/api/products/current', undefined, c.accessToken)).status, 200);
  assert.equal((await a.call('/api/me', undefined, c.accessToken)).status, 401);
  await a.call('/api/presenter/reset', {});
  assert.equal((await a.call('/api/products/current')).body.product.name, 'Tranh Bình Minh');
});
