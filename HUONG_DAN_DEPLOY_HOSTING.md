# HƯỚNG DẪN TRIỂN KHAI (DEPLOY) LÊN HOSTING — SOS VIỆT NAM 2026

Thư mục này là **bản sao hoàn chỉnh, tinh gọn và độc lập** của hệ thống **SOS Việt Nam 2026**, đã loại bỏ hoàn toàn các file rác, file log, mã nguồn kiểm thử tự động nội bộ và môi trường phát triển. Anh có thể sử dụng thư mục này để đưa lên bất kỳ dịch vụ hosting nào.

---

## 📁 1. CẤU TRÚC THƯ MỤC XUẤT BẢN

| Thư mục / Tập tin | Mô tả chức năng |
| :--- | :--- |
| `index.html` | Trang chủ ứng dụng Cứu hộ Khẩn cấp SOS dành cho Người dân (Citizen App). Hỗ trợ PWA 1-Click. |
| `dispatcher.html` | Cổng tác chiến & Điều phối Cứu hộ dành cho Trực ban các lực lượng (Dispatcher Dashboard). |
| `heritage.html` | Trang giới thiệu truyền thống & danh dự lực lượng Công An Nhân Dân. |
| `server.js` | Server backend Node.js ESM (Xử lý API SOS thời gian thực, đồng bộ 2 chiều Excel, bảo mật ND13, WAF L7). |
| `css/` | Bảng định dạng giao diện Cyber Tactical Glassmorphism chuẩn WCAG 2.1 AA. |
| `js/` | Mã nguồn điều khiển giao diện, ghi âm cuộc gọi, xử lý định vị GPS vệ tinh, hoạt họa. |
| `assets/` | Tài nguyên âm thanh còi báo động, video nền, logo biểu trưng Công An Nhân Dân và dữ liệu danh bạ trạm 34 tỉnh thành. |
| `services/` | Các module dịch vụ backend: Tường lửa bảo mật WAF, mã hóa dữ liệu ND13, đồng bộ bản đồ. |
| `vendor/` | Thư viện bản đồ MapLibre GL 3D và giải mã âm thanh LAME. |
| `sw.js` & `manifest.json` | Cấu hình Progressive Web App (PWA) để cài đặt ứng dụng 1-Click ra màn hình chính điện thoại và máy tính. |
| `Dockerfile` & `docker-compose.yml` | Cấu hình đóng gói container Docker sẵn sàng chạy ngay. |
| `package.json` | Khai báo dự án Node.js (dự án dùng toàn bộ native ESM core modules, cực nhẹ, khởi động chỉ mất ~50ms). |

---

## 🚀 2. HƯỚNG DẪN CÁC PHƯƠNG THỨC TRIỂN KHAI LÊN HOSTING

### CÁCH 1: Triển khai lên VPS / Server riêng / Máy chủ Cloud (KHUYÊN DÙNG — ĐẦY ĐỦ TÍNH NĂNG NHẤT)
*Phương thức này đảm bảo chạy đầy đủ 100% tính năng: Nhận báo động SOS thời gian thực, Đồng bộ file Excel 2 chiều, Phân quyền trực ban, Tường lửa bảo mật.*

1. **Upload thư mục**: Upload toàn bộ các file trong thư mục này lên VPS (qua SFTP, FileZilla hoặc Git).
2. **Cài đặt Node.js**: Cài Node.js (phiên bản 18 trở lên):
   ```bash
   node -v
   ```
3. **Khởi chạy ứng dụng**:
   - Chạy trực tiếp:
     ```bash
     npm start
     # hoặc: node server.js
     ```
   - Chạy nền vĩnh viễn bằng PM2 (khuyên dùng):
     ```bash
     npm install -g pm2
     pm2 start ecosystem.config.cjs
     pm2 save
     pm2 startup
     ```
   - Hoặc chạy qua Docker:
     ```bash
     docker-compose up -d
     ```
4. **Cấu hình Nginx làm Reverse Proxy và cấp SSL**:
   Trỏ domain vào port `3000` và cài SSL Let's Encrypt (`certbot --nginx`).

---

### CÁCH 2: Triển khai lên Hosting Cloud tự động (Render, Railway, Fly.io)
1. Tạo một repository mới trên GitHub (Private hoặc Public).
2. Đẩy toàn bộ các file trong thư mục này lên GitHub repo đó.
3. Kết nối repo với **Render.com** hoặc **Railway.app**:
   - **Environment**: `Node`
   - **Build Command**: Để trống (hoặc `npm install`)
   - **Start Command**: `node server.js`
   - **Port**: `3000`
4. Dịch vụ sẽ tự động deploy và cấp phát đường dẫn HTTPS miễn phí!

---

### CÁCH 3: Triển khai lên cPanel Hosting (Hosting PHP / Cpanel có Node.js)
1. Nén toàn bộ thư mục thành file `.zip` và upload lên thư mục `public_html` (hoặc subdomain).
2. Giải nén trên cPanel File Manager.
3. Trong giao diện cPanel, tìm mục **"Setup Node.js App"**:
   - **Node.js version**: Chọn bản mới nhất (18.x hoặc 20.x).
   - **Application root**: Đường dẫn thư mục chứa code.
   - **Application startup file**: `server.js`
   - Bấm **"Run JS script"** hoặc **"Start App"**.

---

### CÁCH 4: Triển khai Hosting Tĩnh (Vercel, Netlify, Cloudflare Pages, cPanel thuần HTML)
*Dành cho trường hợp chỉ cần chạy giao diện ứng dụng phía người dân (Citizen Frontend).*
1. Kéo thả toàn bộ thư mục này vào **Vercel** hoặc **Netlify** / **Cloudflare Pages**.
2. Hệ thống sẽ tự nhận diện `index.html` làm trang chủ.

---

## 🔒 3. LƯU Ý QUAN TRỌNG VỀ HTTPS & SSL
- **Bắt buộc bật SSL (HTTPS)**: Để các tính năng hiện đại như **Định vị GPS Vệ tinh (`navigator.geolocation`)**, **Ghi âm giọng nói (`MediaRecorder`)** và **Tạo lối tắt Màn hình chính 1-Click (PWA)** hoạt động được trên điện thoại iPhone, Android và máy tính, hosting bắt buộc phải có chứng chỉ bảo mật HTTPS (SSL). Hầu hết các hosting hiện nay (Vercel, Render, Cloudflare, Let's Encrypt) đều tự động cấp SSL miễn phí.
- **Tài khoản quản trị mặc định**: Được quản lý an toàn trong file cấu hình phân quyền và cơ chế phân cấp địa bàn Công An 34 tỉnh thành.
