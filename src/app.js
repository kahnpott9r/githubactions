'use strict';

const path = require('node:path');
const express = require('express');
const pkg = require('../package.json');

const app = express();
const startedAt = Date.now();

app.disable('x-powered-by');
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

/* ------------------------------------------------------------------ */
/* Dữ liệu demo (lưu trong bộ nhớ, phù hợp để học CI/CD)              */
/* ------------------------------------------------------------------ */

let nextId = 4;
const todos = [
  { id: 1, title: 'Tạo repository trên GitHub', done: true, createdAt: new Date().toISOString() },
  { id: 2, title: 'Viết workflow CI đầu tiên', done: true, createdAt: new Date().toISOString() },
  { id: 3, title: 'Thêm bước build & upload artifact', done: false, createdAt: new Date().toISOString() },
];

function getBuildInfo() {
  const sha = process.env.GITHUB_SHA || '';
  return {
    app: process.env.APP_NAME || pkg.name,
    version: process.env.APP_VERSION || pkg.version,
    environment: process.env.NODE_ENV || 'development',
    node: process.version,
    platform: process.platform,
    ci: Boolean(process.env.CI || process.env.GITHUB_ACTIONS),
    repository: process.env.GITHUB_REPOSITORY || null,
    branch: process.env.GITHUB_REF_NAME || null,
    commit: sha ? sha.slice(0, 7) : null,
    runId: process.env.GITHUB_RUN_ID || null,
    workflow: process.env.GITHUB_WORKFLOW || null,
    startedAt: new Date(startedAt).toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  };
}

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/info', (req, res) => {
  res.json(getBuildInfo());
});

app.get('/api/todos', (req, res) => {
  res.json({ todos, total: todos.length });
});

app.post('/api/todos', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';

  if (!title) {
    return res.status(400).json({ error: 'Tiêu đề không được để trống.' });
  }
  if (title.length > 120) {
    return res.status(400).json({ error: 'Tiêu đề tối đa 120 ký tự.' });
  }

  const todo = { id: nextId++, title, done: false, createdAt: new Date().toISOString() };
  todos.push(todo);
  return res.status(201).json(todo);
});

app.patch('/api/todos/:id', (req, res) => {
  const todo = todos.find((item) => item.id === Number(req.params.id));

  if (!todo) {
    return res.status(404).json({ error: 'Không tìm thấy công việc.' });
  }
  if (typeof req.body?.done !== 'boolean') {
    return res.status(400).json({ error: 'Trường "done" phải là boolean.' });
  }

  todo.done = req.body.done;
  return res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  const index = todos.findIndex((item) => item.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy công việc.' });
  }

  const [removed] = todos.splice(index, 1);
  return res.json(removed);
});

// API không tồn tại -> trả JSON thay vì HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API không tồn tại.' });
});

// Mọi đường dẫn khác -> giao diện web
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Xử lý lỗi tập trung
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: 'Đã có lỗi xảy ra trên server.' });
});

module.exports = app;
