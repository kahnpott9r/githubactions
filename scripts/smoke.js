'use strict';

/**
 * Smoke test: khởi động app trên một port ngẫu nhiên, gọi thử /api/health
 * rồi tắt. Được dùng trong CI để chắc chắn app thật sự "sống" sau khi build.
 */

const app = require('../src/app');

const server = app.listen(0, async () => {
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/api/health`;

  try {
    const res = await fetch(url);
    const body = await res.json();

    if (!res.ok || body.status !== 'ok') {
      throw new Error(`Health check thất bại: HTTP ${res.status} - ${JSON.stringify(body)}`);
    }

    console.log(`✅ Smoke test OK — ${url} trả về status "ok"`);
    server.close(() => process.exit(0));
  } catch (error) {
    console.error('❌ Smoke test thất bại:', error.message);
    server.close(() => process.exit(1));
  }
});
