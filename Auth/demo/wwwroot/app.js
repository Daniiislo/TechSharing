const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat('vi-VN').format(n);
let lab, credentialA = null, credentialB = null, busy = false, productDraftDirty = false, noticeTimer;
function notice(message) { $('notice').textContent = message; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('notice').textContent = '', 4500); }
function accessState(c) {
  if (!c) return 'Chưa đăng nhập';
  const token = lab?.accessTokens.find(t => t.id === c.accessId);
  if (!token || token.revoked) return 'Token bị thu hồi';
  return new Date(c.expiresAt) <= new Date() ? 'Token hết hạn' : 'Đã xác thực';
}
function render() {
  if (!lab) return;
  const a = lab.auction, permissions = lab.permissions;
  $('product-title').textContent = a.item;
  $('product-description').textContent = a.description;
  if (!productDraftDirty) {
    $('product-name-input').value = a.item;
    $('product-description-input').value = a.description;
  }
  $('current-bid').replaceChildren(document.createTextNode(money(a.currentBid) + ' '), Object.assign(document.createElement('small'), { textContent: '₫' }));
  $('bid-count').textContent = `${a.bidCount} lượt đặt giá`;
  $('auction-state').textContent = a.closed ? 'Đã đóng' : 'Đang mở'; $('auction-state').className = 'state' + (a.closed ? ' bad' : '');
  $('bid-amount').min = a.minimumBid;
  document.querySelectorAll('[name=role]').forEach(c => c.checked = lab.roles.includes(c.value));
  $('effective-permissions').replaceChildren(...(permissions.length ? permissions.map(p => permissionBadge(p)) : [Object.assign(document.createElement('p'), { textContent: 'Chưa được cấp quyền', className: 'muted' })]));
  $('role-summary').textContent = `${lab.roles.length} vai trò · ${permissions.length} permission`;
  for (const [action, permission, button] of [['bid', 'bid:place', 'bid-action'], ['close', 'event:close', 'close-action'], ['edit', 'product:update', 'edit-action']]) {
    const sources = lab.roles.filter(r => lab.rolePermissions[r].includes(permission));
    const badge = permissionBadge(permission, sources.length ? 'granted' : 'missing');
    const source = Object.assign(document.createElement('span'), { className: 'permission-source', textContent: sources.length ? sources.join(' · ') : 'Chưa được cấp' });
    $(`reason-${action}`).replaceChildren(badge, source);
    $(button).classList.toggle('denied', !sources.length);
    $(button).title = `${permission} · ${sources.length ? 'Được cấp' : 'Chưa được cấp'}`;
  }
  $('status-bid').textContent = permissions.includes('bid:place') ? 'Có quyền' : 'Không có quyền';
  $('status-bid').classList.toggle('allowed', permissions.includes('bid:place'));
  const stateA = accessState(credentialA);
  $('anna-state').textContent = stateA;
  $('anna-state').className = 'state' + (stateA === 'Đã xác thực' ? '' : stateA === 'Chưa đăng nhập' ? ' neutral' : ' bad');
  $('access-label').textContent = credentialA?.accessToken || 'Chưa được cấp';
  $('access-label').title = credentialA?.accessToken || '';
  updateCopiedToken();
  updateCredentialStatus();
}
// Only the countdown changes every second; leave role/permission DOM intact.
function updateCredentialStatus() {
  if (!lab) return;
  const stateA = accessState(credentialA);
  if ($('anna-state').textContent !== stateA) {
    $('anna-state').textContent = stateA;
    $('anna-state').className = 'state' + (stateA === 'Đã xác thực' ? '' : stateA === 'Chưa đăng nhập' ? ' neutral' : ' bad');
  }
  const expiry = credentialA ? `Còn ${Math.max(0, Math.ceil((new Date(credentialA.expiresAt) - Date.now()) / 1000))} giây` : '—';
  if ($('token-expiry').textContent !== expiry) $('token-expiry').textContent = expiry;
  updateCopiedToken();
}
function updateCopiedToken() {
  const element = $('copy-token-label');
  const copy = credentialB?.accessToken || 'Chưa có token';
  if (element.textContent !== copy) element.textContent = copy;
  element.title = credentialB ? `${credentialB.accessId} · ${accessState(credentialB)}\n${credentialB.accessToken}` : '';
}
function permissionBadge(permission, state = 'granted') {
  return Object.assign(document.createElement('code'), { className: `permission-code ${state}`, textContent: permission });
}
function formattedMessage(message) {
  const fragment = document.createDocumentFragment();
  const parts = String(message).split(/((?:product|event|bid):[a-z]+)/g);
  for (const part of parts) fragment.append(/^(?:product|event|bid):[a-z]+$/.test(part) ? permissionBadge(part) : document.createTextNode(part));
  return fragment;
}
function result(target, response, fallback = '') {
  const box = $(target); box.className = 'result ' + (response.ok ? 'success' : 'error');
  box.hidden = false;
  const code = Object.assign(document.createElement('span'), { className: 'result-code', textContent: `${response.status}` });
  box.replaceChildren(code, formattedMessage(response.data.message || fallback));
}
function trace(method, path, response, who) {
  const list = $('trace-list'); list.querySelector('.trace-empty')?.remove();
  const entry = document.createElement('li'); entry.className = 'trace-entry';
  const time = document.createElement('time'); time.textContent = new Date().toLocaleTimeString('vi-VN');
  const code = Object.assign(document.createElement('span'), { className: 'http-status' + (response.ok ? '' : ' error'), textContent: response.status });
  const detail = document.createElement('div');
  const title = Object.assign(document.createElement('strong'), { textContent: `${method} ${path}` });
  const message = document.createElement('p');
  message.append(formattedMessage(response.data.message || (path === '/api/presenter/roles' ? `${response.data.roles?.join(', ') || 'Không có vai trò'} · ${response.data.permissions?.join(', ') || 'Không có permission'}` : path === '/api/presenter/reset' ? 'Đã khôi phục trạng thái ban đầu.' : 'Đã cấp access token và refresh token.')));
  detail.append(title, message);
  const stage = response.data.stage || (path.includes('/presenter/') ? 'presenter' : 'authenticate');
  const tag = Object.assign(document.createElement('small'), { textContent: `${who} / ${stage}` });
  entry.append(time, code, detail, tag); list.prepend(entry);
  while (list.children.length > 60) list.lastElementChild.remove();
}
async function request(path, body, token, who = 'Anna · A') {
  const method = body === undefined ? 'GET' : 'POST';
  const res = await fetch(path, { method, signal: AbortSignal.timeout(10000), headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await res.json().catch(() => ({ message: 'Request không hợp lệ hoặc phản hồi không có JSON.' }));
  const response = { ok: res.ok, status: res.status, data }; trace(method, path, response, who); return response;
}
async function sync() {
  const response = await fetch('/api/lab', { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Không tải được trạng thái lab.');
  lab = await response.json(); render();
}
async function run(action) {
  if (busy) return; busy = true;
  const focused = document.activeElement;
  const controls = [...document.querySelectorAll('button,input')]; controls.forEach(c => c.disabled = true);
  $('main-content').setAttribute('aria-busy', 'true');
  try { await action(); await sync(); } catch (e) { notice('Không kết nối được server: ' + e.message); }
  finally {
    busy = false; controls.forEach(c => c.disabled = false);
    $('main-content').removeAttribute('aria-busy');
    if (document.activeElement === document.body && focused instanceof HTMLElement && focused.isConnected) focused.focus({ preventScroll: true });
  }
}
$('login-form').addEventListener('submit', e => { e.preventDefault(); run(async () => {
  const res = await request('/api/login', { username: $('username').value, password: $('password').value });
  if (res.ok) credentialA = res.data;
  result('result-login', res, `Đăng nhập thành công · ${res.data.accessId}`);
}); });
$('wrong-password').onclick = () => run(async () => result('result-login', await request('/api/login', { username: 'anna', password: 'wrong-password' })));
$('view-action').onclick = () => run(async () => result('result-a', await request('/api/products/current', undefined, null, 'Public')));
$('identity-b').onclick = () => run(async () => result('result-b', await request('/api/me', undefined, credentialB?.accessToken, 'Client B')));
$('product-name-input').oninput = $('product-description-input').oninput = () => { productDraftDirty = true; };
$('product-form').addEventListener('submit', e => { e.preventDefault(); run(async () => {
  const res = await request('/api/products/current', { name: $('product-name-input').value, description: $('product-description-input').value }, credentialA?.accessToken);
  if (res.ok) productDraftDirty = false;
  result('result-a', res);
}); });
$('bid-action').onclick = () => run(async () => {
  const input = $('bid-amount'), amount = Number(input.value);
  if (!input.value || !Number.isFinite(amount)) { notice('Nhập một giá đặt hợp lệ.'); return; }
  const response = await request('/api/bids', { amount }, credentialA?.accessToken); result('result-a', response);
  if (response.ok) input.value = amount + 100000;
});
$('close-action').onclick = () => run(async () => result('result-a', await request('/api/event/close', {}, credentialA?.accessToken)));
document.querySelectorAll('[name=role]').forEach(c => c.onchange = () => {
  const roles = [...document.querySelectorAll('[name=role]:checked')].map(c => c.value);
  run(async () => { const res = await request('/api/presenter/roles', { roles }, null, 'Quản trị'); if (!res.ok) notice(res.data.message); });
});
$('copy-token').onclick = () => {
  if (!credentialA) { notice('Đăng nhập Anna trước để có access token.'); return; }
  credentialB = { ...credentialA }; render();
  $('result-b').className = 'result'; $('result-b').textContent = `Đã sao chép ${credentialB.accessId}.`;
};
$('revoke-refresh').onclick = () => run(async () => {
  const res = await request('/api/presenter/revoke-refresh', {}, null, 'Quản trị'); notice(res.data.message);
});
$('revoke-access').onclick = () => run(async () => {
  if (!credentialA) { notice('Chưa có access token A để thu hồi.'); return; }
  const res = await request('/api/presenter/revoke-access', { accessToken: credentialA.accessToken }, null, 'Quản trị'); notice(res.data.message);
});
$('refresh').onclick = () => run(async () => {
  if (!credentialA) { notice('Đăng nhập trước để có refresh token.'); return; }
  const res = await request('/api/refresh', { refreshToken: credentialA.refreshToken });
  if (res.ok) credentialA = res.data;
  result('result-a', res, `Đã cấp token mới · ${res.data.accessId}`);
});
$('reset').onclick = () => run(async () => {
  const res = await request('/api/presenter/reset', {}, null, 'Quản trị');
  if (!res.ok) { notice(res.data.message); return; }
  credentialA = null; credentialB = null; productDraftDirty = false; $('bid-amount').value = '1600000'; $('username').value = 'anna'; $('password').value = 'Anna@123!';
  $('result-login').hidden = true; $('result-login').replaceChildren();
  for (const id of ['result-a', 'result-b']) { $(id).className = 'result'; $(id).textContent = 'Chưa có yêu cầu.'; }
  notice('Đã khôi phục trạng thái ban đầu.');
});
$('clear-trace').onclick = () => $('trace-list').replaceChildren(Object.assign(document.createElement('li'), { className: 'trace-empty', textContent: 'Chưa có yêu cầu.' }));
sync().catch(e => notice(e.message)); setInterval(updateCredentialStatus, 1000);
