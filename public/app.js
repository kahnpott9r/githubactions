'use strict';

const els = {
  envBadge: document.getElementById('env-badge'),
  statEnv: document.getElementById('stat-env'),
  statNode: document.getElementById('stat-node'),
  statCommit: document.getElementById('stat-commit'),
  statUptime: document.getElementById('stat-uptime'),
  refreshBtn: document.getElementById('refresh-btn'),
  form: document.getElementById('todo-form'),
  input: document.getElementById('todo-input'),
  list: document.getElementById('todo-list'),
  empty: document.getElementById('todo-empty'),
  count: document.getElementById('todo-count'),
  buildInfo: document.getElementById('build-info'),
  toast: document.getElementById('toast'),
};

let info = null;
let toastTimer = null;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Yêu cầu thất bại (HTTP ${res.status})`);
  }
  return data;
}

function showToast(message, type = 'success') {
  els.toast.textContent = message;
  els.toast.classList.toggle('error', type === 'error');
  els.toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  return `${hours} giờ ${minutes % 60} phút`;
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */

function renderInfo() {
  if (!info) return;

  els.envBadge.textContent = info.ci ? '⚡ CI runner' : '💻 Local dev';
  els.envBadge.classList.toggle('success', info.ci);

  els.statEnv.textContent = info.environment;
  els.statNode.textContent = info.node;
  els.statCommit.textContent = info.commit || 'local';
  els.statUptime.textContent = formatUptime(info.uptimeSeconds);

  const lines = [
    `app         : ${info.app}`,
    `version     : ${info.version}`,
    `repository  : ${info.repository || '(chưa có — chạy local)'}`,
    `branch      : ${info.branch || '(chưa có)'}`,
    `commit      : ${info.commit || '(chưa có)'}`,
    `workflow    : ${info.workflow || '(chưa có)'}`,
    `run id      : ${info.runId || '(chưa có)'}`,
    `node        : ${info.node}`,
    `platform    : ${info.platform}`,
    `started at  : ${new Date(info.startedAt).toLocaleString('vi-VN')}`,
  ];
  els.buildInfo.textContent = lines.join('\n');
}

function renderTodos(todos) {
  els.list.textContent = '';

  for (const todo of todos) {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.setAttribute('aria-label', `Đánh dấu "${todo.title}"`);
    checkbox.addEventListener('change', () => toggleTodo(todo, checkbox));

    const title = document.createElement('span');
    title.className = 'todo-title';
    title.textContent = todo.title;

    const remove = document.createElement('button');
    remove.className = 'icon-btn';
    remove.type = 'button';
    remove.title = 'Xoá';
    remove.setAttribute('aria-label', `Xoá "${todo.title}"`);
    remove.textContent = '✕';
    remove.addEventListener('click', () => deleteTodo(todo));

    li.append(checkbox, title, remove);
    els.list.append(li);
  }

  const remaining = todos.filter((todo) => !todo.done).length;
  els.count.textContent = `${todos.length} việc · ${remaining} chưa xong`;
  els.empty.hidden = todos.length > 0;
}

/* ------------------------------------------------------------------ */
/* Data loading                                                        */
/* ------------------------------------------------------------------ */

async function loadInfo() {
  info = await api('/api/info');
  renderInfo();
}

async function loadTodos() {
  const data = await api('/api/todos');
  renderTodos(data.todos);
}

async function refresh() {
  els.refreshBtn.disabled = true;
  try {
    await Promise.all([loadInfo(), loadTodos()]);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    els.refreshBtn.disabled = false;
  }
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

async function addTodo(event) {
  event.preventDefault();
  const title = els.input.value.trim();

  if (!title) {
    els.input.focus();
    return;
  }

  try {
    await api('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    els.input.value = '';
    await loadTodos();
    showToast('Đã thêm việc mới');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function toggleTodo(todo, checkbox) {
  checkbox.disabled = true;
  try {
    await api(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ done: checkbox.checked }),
    });
    await loadTodos();
  } catch (error) {
    checkbox.checked = todo.done;
    checkbox.disabled = false;
    showToast(error.message, 'error');
  }
}

async function deleteTodo(todo) {
  try {
    await api(`/api/todos/${todo.id}`, { method: 'DELETE' });
    await loadTodos();
    showToast('Đã xoá công việc');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

/* ------------------------------------------------------------------ */
/* Khởi động                                                           */
/* ------------------------------------------------------------------ */

els.form.addEventListener('submit', addTodo);
els.refreshBtn.addEventListener('click', async () => {
  await refresh();
  showToast('Đã làm mới dữ liệu');
});

refresh();
setInterval(loadInfo, 15000);
