'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('../src/app');

let server;
let base;

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function json(path, options) {
  const res = await fetch(`${base}${path}`, options);
  const body = await res.json();
  return { res, body };
}

test('GET / trả về giao diện web', async () => {
  const res = await fetch(base);
  const html = await res.text();

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.match(html, /CI\/CD Playground/);
});

test('GET /api/health trả về status ok', async () => {
  const { res, body } = await json('/api/health');

  assert.equal(res.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(typeof body.uptimeSeconds, 'number');
});

test('GET /api/info trả về thông tin build', async () => {
  const { res, body } = await json('/api/info');

  assert.equal(res.status, 200);
  assert.equal(body.app, 'ci-cd-playground');
  assert.equal(typeof body.version, 'string');
  assert.equal(typeof body.node, 'string');
  assert.equal(typeof body.startedAt, 'string');
});

test('CRUD công việc hoạt động đúng', async () => {
  // Tạo mới
  const created = await json('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Viết test cho CI' }),
  });

  assert.equal(created.res.status, 201);
  assert.equal(created.body.title, 'Viết test cho CI');
  assert.equal(created.body.done, false);

  // Đọc danh sách
  const list = await json('/api/todos');
  assert.equal(list.res.status, 200);
  assert.ok(list.body.todos.some((todo) => todo.id === created.body.id));

  // Cập nhật trạng thái
  const updated = await json(`/api/todos/${created.body.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: true }),
  });

  assert.equal(updated.res.status, 200);
  assert.equal(updated.body.done, true);

  // Xoá
  const removed = await json(`/api/todos/${created.body.id}`, { method: 'DELETE' });
  assert.equal(removed.res.status, 200);
  assert.equal(removed.body.id, created.body.id);

  const afterDelete = await json('/api/todos');
  assert.ok(!afterDelete.body.todos.some((todo) => todo.id === created.body.id));
});

test('POST /api/todos từ chối tiêu đề rỗng', async () => {
  const { res, body } = await json('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '   ' }),
  });

  assert.equal(res.status, 400);
  assert.match(body.error, /trống/);
});

test('PATCH /api/todos/:id trả 404 khi không tồn tại', async () => {
  const { res, body } = await json('/api/todos/99999', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: true }),
  });

  assert.equal(res.status, 404);
  assert.match(body.error, /Không tìm thấy/);
});

test('API không tồn tại trả về JSON 404', async () => {
  const { res, body } = await json('/api/khong-ton-tai');

  assert.equal(res.status, 404);
  assert.ok(body.error);
});
