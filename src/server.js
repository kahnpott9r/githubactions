'use strict';

const app = require('./app');

const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`🚀 CI/CD Playground đang chạy tại http://localhost:${port}`);
  console.log(`   Môi trường: ${process.env.NODE_ENV || 'development'}`);
});

function shutdown(signal) {
  console.log(`\nNhận ${signal}, đang tắt server...`);
  server.close(() => {
    console.log('Server đã dừng.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
