'use strict';

/**
 * Bước "build" của dự án.
 *
 * App Node.js thuần không cần biên dịch, nên build ở đây có nghĩa là:
 *   1. Dọn thư mục dist/
 *   2. Copy những file cần thiết để chạy production
 *   3. Ghi build-info.json (dấu vết của lần build, rất hữu ích khi học CI/CD)
 *
 * Trong CI, thư mục dist/ sẽ được upload thành artifact và có thể deploy.
 */

const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../package.json');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const filesToCopy = ['public', 'src', 'package.json', 'package-lock.json', 'README.md'];

for (const entry of filesToCopy) {
  const source = path.join(root, entry);
  if (!fs.existsSync(source)) continue;
  fs.cpSync(source, path.join(dist, entry), { recursive: true });
}

const sha = process.env.GITHUB_SHA || '';
const buildInfo = {
  name: pkg.name,
  version: pkg.version,
  builtAt: new Date().toISOString(),
  node: process.version,
  repository: process.env.GITHUB_REPOSITORY || null,
  branch: process.env.GITHUB_REF_NAME || null,
  commit: sha ? sha.slice(0, 7) : null,
  runId: process.env.GITHUB_RUN_ID || null,
  workflow: process.env.GITHUB_WORKFLOW || null,
};

fs.writeFileSync(path.join(dist, 'build-info.json'), `${JSON.stringify(buildInfo, null, 2)}\n`);

console.log('✅ Build xong!');
console.log(`   Thư mục: dist/`);
console.log(`   Version: ${buildInfo.version}`);
console.log(`   Commit : ${buildInfo.commit || 'local'}`);
