# 🚀 CI/CD Playground

Một ứng dụng **Node.js + Express** có giao diện web, được tạo để bạn **học CI/CD bằng cách làm thật**: sửa code → push lên GitHub → xem pipeline tự động test, build và đóng gói.

![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)
<!-- ↑ Thay OWNER/REPO bằng username và tên repository của bạn -->

---

## ✨ Có gì trong dự án này?

- 🌐 Giao diện web hiện đại (HTML/CSS/JS thuần, không cần framework)
- 🧩 API REST cơ bản: health check, thông tin build, CRUD công việc
- 🧪 Unit test bằng **Node Test Runner** (có sẵn trong Node, không cần thêm thư viện)
- 🔁 Workflow **GitHub Actions**: matrix Node 20/22 → test → smoke test → build → upload artifact
- 🐳 Dockerfile để thực hành deploy
- 📊 Giao diện hiển thị thông tin commit, branch, run ID… lấy từ biến môi trường của GitHub Actions

---

## 🧰 Yêu cầu

- Node.js >= 20 (khuyến nghị 22)
- npm >= 10
- Git

Kiểm tra:

```bash
node -v
npm -v
```

---

## 🏃 Chạy dự án

```bash
# 1. Cài dependencies (dùng npm ci nếu đã có package-lock.json)
npm ci

# 2. Chạy chế độ phát triển (tự reload khi sửa code)
npm run dev

# Hoặc chạy production
npm start
```

Mở http://localhost:3000

### Các lệnh khác

| Lệnh | Ý nghĩa |
| --- | --- |
| `npm start` | Chạy server |
| `npm run dev` | Chạy với nodemon (tự reload) |
| `npm test` | Chạy toàn bộ test |
| `npm run test:watch` | Test ở chế độ watch |
| `npm run build` | Đóng gói thư mục `dist/` |
| `npm run smoke` | Kiểm tra nhanh app có "sống" không |

---

## 🔌 API

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| GET | `/api/health` | Health check (dùng cho CI/CD, monitoring) |
| GET | `/api/info` | Thông tin app, commit, branch, môi trường |
| GET | `/api/todos` | Danh sách công việc |
| POST | `/api/todos` | Thêm việc, body `{ "title": "..." }` |
| PATCH | `/api/todos/:id` | Cập nhật, body `{ "done": true }` |
| DELETE | `/api/todos/:id` | Xoá công việc |

Thử nhanh bằng curl:

```bash
curl http://localhost:3000/api/health

curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Học GitHub Actions"}'
```

---

## 📁 Cấu trúc thư mục

```
.
├── .github/
│   └── workflows/
│       └── ci.yml          # Pipeline CI/CD
├── public/                 # Giao diện web
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/
│   ├── app.js              # Toàn bộ routes + logic Express
│   └── server.js           # Khởi động server
├── test/
│   └── app.test.js         # Unit test API
├── scripts/
│   ├── build.js            # Đóng gói dist/
│   └── smoke.js            # Smoke test sau build
├── Dockerfile
├── package.json
└── README.md
```

---

## 🧪 Test hoạt động thế nào?

Test dùng `node:test` và `node:assert` có sẵn, không cần Jest. Server được khởi động trên một port ngẫu nhiên (`app.listen(0)`), gọi API thật bằng `fetch`, rồi tắt sau khi chạy xong.

```bash
npm test
```

Kết quả mong đợi khi mọi thứ đều ổn:

```
✔ GET / trả về giao diện web
✔ GET /api/health trả về status ok
✔ GET /api/info trả về thông tin build
✔ CRUD công việc hoạt động đúng
...
```

---

## 🔁 Pipeline CI/CD giải thích từng bước

File: `.github/workflows/ci.yml`

### Khi nào chạy?

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
```

- `push` lên `main`: chạy sau khi merge/ push trực tiếp
- `pull_request`: chạy để kiểm tra PR trước khi merge
- `workflow_dispatch`: cho phép bấm nút chạy tay trên GitHub

### Job 1 — `test`

Chạy trên **matrix** Node 20 và 22 để chắc chắn app tương thích nhiều phiên bản:

```yaml
strategy:
  matrix:
    node: [20, 22]
```

Các bước:

1. **Checkout** — lấy code về runner
2. **Setup Node.js** — cài đúng phiên bản, bật cache npm
3. **npm ci** — cài dependencies chính xác theo `package-lock.json`
4. **npm test** — chạy unit test
5. **npm run smoke** — khởi động app thật và gọi `/api/health`

### Job 2 — `build`

Chỉ chạy khi job `test` xanh nhờ `needs: test`:

```yaml
needs: test
```

Các bước:

1. Cài dependencies
2. `npm run build` — tạo `dist/` + `build-info.json`
3. In nội dung build info ra log
4. Upload `dist/` thành **artifact** (giữ 7 ngày)

Artifact chính là "sản phẩm" của pipeline. Bạn có thể tải nó về ở tab **Actions** → chọn run → mục **Artifacts**.

---

## 🎓 Lộ trình học gợi ý

1. **Chạy local**: `npm ci` → `npm test` → `npm start`
2. **Push code lên GitHub** và mở tab **Actions** xem pipeline chạy
3. **Cố tình làm test fail** (sửa một assert trong `test/app.test.js`), push và xem pipeline đỏ
4. **Sửa lại cho xanh**, xem job `build` chỉ chạy khi test pass
5. **Tải artifact** trong tab Actions về máy
6. **Sửa giao diện** (`public/`), push và thấy thay đổi
7. Làm các bài tập nâng cao bên dưới

### Bài tập nâng cao

- [ ] Thêm bước **ESLint** (hoặc Prettier check) vào CI
- [ ] Bật **Dependabot** cho npm
- [ ] Thêm **cache** cho `node_modules` (workflow hiện tại đã cache npm — thử bỏ đi rồi so sánh thời gian)
- [ ] Thêm job **deploy** sau `build`, ví dụ deploy lên Render/Railway/VPS
- [ ] Thêm **Docker build & push** image lên GitHub Container Registry (GHCR)
- [ ] Thêm **coverage** bằng `node --test --experimental-test-coverage`
- [ ] Tách workflow thành `ci.yml` (test) và `deploy.yml` (deploy)
- [ ] Thêm **branch protection**: bắt buộc CI xanh mới được merge PR
- [ ] Thêm **environment + secrets** cho bước deploy

---

## 🐳 Chạy bằng Docker

```bash
docker build -t ci-cd-playground .
docker run --rm -p 3000:3000 ci-cd-playground
```

Mở http://localhost:3000

---

## 🚀 Gợi ý deploy (CD)

Sau khi có CI xanh, bạn có thể thêm job deploy:

```yaml
deploy:
  name: Deploy
  runs-on: ubuntu-latest
  needs: build
  if: github.ref == 'refs/heads/main'
  steps:
    - name: Download artifact
      uses: actions/download-artifact@v4
      with:
        name: app-dist-${{ github.sha }}
        path: dist

    # Thêm bước deploy thật ở đây:
    # - scp/rsync lên VPS
    # - gọi webhook của Render/Railway
    # - build & push Docker image lên GHCR
```

> Lưu ý: cần khai báo `permissions` phù hợp (ví dụ `packages: write` khi push GHCR) và dùng **GitHub Secrets** cho thông tin nhạy cảm.

---

## 🔐 Biến môi trường

App đọc các biến sau (tất cả đều tuỳ chọn):

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `PORT` | `3000` | Port server |
| `NODE_ENV` | `development` | Môi trường chạy |
| `APP_NAME` | `ci-cd-playground` | Tên app hiển thị |
| `APP_VERSION` | version trong package.json | Version hiển thị |
| `GITHUB_SHA`, `GITHUB_REF_NAME`, `GITHUB_RUN_ID`… | — | GitHub Actions tự bơm vào runner |

Xem `.env.example` để tham khảo.

---

## ❓ Câu hỏi thường gặp

**Vì sao dùng `npm ci` thay vì `npm install`?**
`npm ci` cài chính xác theo `package-lock.json`, nhanh hơn và đảm bảo CI tái lập được. Nếu thiếu lock file hoặc lock file lệch `package.json`, nó sẽ báo lỗi.

**Vì sao test dùng port 0?**
`listen(0)` để hệ điều hành chọn port trống, tránh xung đột khi chạy test song song hoặc khi port 3000 đang bận.

**Dữ liệu todo lưu ở đâu?**
Trong bộ nhớ. Mục đích là để học CI/CD, không phải làm app production. Muốn học thêm, hãy thử thay bằng SQLite/Postgres.

---

## 📄 License

ISC — cứ dùng thoải mái để học.
