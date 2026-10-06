# Đặc Tả Kiến Trúc & Phân Hóa Cấp Bậc Các Role: SOS Vietnam 2026

## Feature Name
`role-hierarchy`

## Source Spec
- [`server.js`](file:///c:/Users/dienv/Desktop/sos_vietnam_2026_web_hosting/server.js)
- [`services/security-firewall-middleware.js`](file:///c:/Users/dienv/Desktop/sos_vietnam_2026_web_hosting/services/security-firewall-middleware.js)
- [`services/accounts-excel-generator.js`](file:///c:/Users/dienv/Desktop/sos_vietnam_2026_web_hosting/services/accounts-excel-generator.js)
- [`assets/agency-accounts.json`](file:///c:/Users/dienv/Desktop/sos_vietnam_2026_web_hosting/assets/agency-accounts.json)

## Reference Artifacts
- **Cơ sở dữ liệu danh bạ**: 453 tài khoản (`1` Quốc gia, `141` Tỉnh/TP, `273` Xã/Phường, `38` Doanh nghiệp cứu hộ).
- **Phân luồng nghiệp vụ**: Công An Nhân Dân (113 - 297 đv), CSGT (75 đv), Cảnh Sát PCCC & CNCH (114 - 40 đv), Cấp Cứu Y Tế (115 - 39 đv), Cứu Hộ Giao Thông & Đường Bộ (2 đv trực thuộc + 38 doanh nghiệp).

---

## 1. Danh Sách Các Cấp Bậc & Lực Lượng (Lanes)

| Tầng (Lane) | Tên Phân Tầng | Đại Diện Cấp Bậc / Cơ Quan | Thẩm Quyền Tác Chiến & Giới Hạn Nghiệp Vụ |
|---|---|---|---|
| **1. CITIZEN_PUBLIC** | Công Dân Báo Nạn | Người dân mở web (`index.html`) | Ẩn danh, cấp phiên bảo mật `x-sos-access-token` (SHA-256). Chỉ xem/sửa tin của chính mình. Gọi video 1 chạm. |
| **2. SECURITY_RBAC_WAF** | Tường Lửa & Zero-Trust | WAF Layer 7 Middleware | Kiểm tra 27 chữ ký AI Bot, chặn scraper, bẫy Honeypot, Multi-tier Rate Limiter, xác thực JWT Session Cookie. |
| **3. WARD_DISPATCHER** | Trực Ban Cấp Cơ Sở (Xã/Phường) | 273 Đơn vị Công An Xã/Phường & Trạm Y tế | Quản lý đúng địa bàn Xã/Phường được giao (`isIncidentInOfficerWard`). Điều động dân phòng/công an xã. Được quyền kích hoạt leo thang (`sos_escalate`). |
| **4. PROVINCE_DISPATCHER** | Điều Phối Tuyến Tỉnh / TP | 141 Đơn vị CA Tỉnh, CSGT, PCCC (PC07), 115 | Tiếp nhận toàn tỉnh (`matchProvince`) và tiếp quản các ca leo thang từ cấp Xã/Phường. Điều động xe chuyên dụng, hiệp đồng tác chiến liên ngành. |
| **5. ENTERPRISE_PARTNER** | Đối Tác Cứu Hộ Đường Bộ | 38 Doanh nghiệp / Gara cứu hộ | Xử lý sự cố phương tiện nhóm `traffic-rescue`. Điều xe cẩu kéo, phối hợp CSGT giải tỏa ách tắc. |
| **6. FIELD_RESPONDER** | Lực Lượng Cơ Động Hiện Trường | Xe tuần tra 113, xe chữa cháy 114, cấp cứu 115, xe cẩu | Nhận lệnh điều động (`dispatchUnit`), cập nhật tiến độ `enroute` ➔ `onscene` ➔ `resolved`. Thẩm tra và lập biên bản hiện trường giả. |
| **7. NATIONAL_COMMAND** | Chỉ Huy Tác Chiến Quốc Gia | Trung Tâm Chỉ Huy Quốc Gia (Admin/SuperAdmin) | Giám sát 3D toàn quốc (34 tỉnh thành, 3.321 xã phường). Nhận mọi sự cố/cuộc gọi. Ban lệnh tối cao chi viện liên tỉnh. Quản trị 453 tài khoản và Audit Log. |

---

## 2. Bảng Nodes Chi Tiết

| Node ID | Kiểu Shape | Thuộc Lane | Thuộc Flow | Trạng Thái | Mô Tả Nghiệp Vụ |
|---|---|---|---|---|---|
| `node-citizen-start` | START | CITIZEN_PUBLIC | FLOW_CITIZEN_ACCESS | defined | Công dân mở giao diện index.html |
| `node-citizen-action-report` | USER_ACTION | CITIZEN_PUBLIC | FLOW_CITIZEN_ACCESS | defined | Gửi tọa độ GPS Kalman + viễn trắc User-Agent |
| `node-citizen-token-issued` | STATE | CITIZEN_PUBLIC | FLOW_CITIZEN_ACCESS | defined | Cấp phát token ẩn danh x-sos-access-token |
| `node-citizen-call-init` | USER_ACTION | CITIZEN_PUBLIC | FLOW_CITIZEN_ACCESS | defined | Khởi tạo cuộc gọi WebRTC thoại/video |
| `node-citizen-closed` | END | CITIZEN_PUBLIC | FLOW_CITIZEN_ACCESS | defined | Đóng ca báo nạn thành công |
| `node-junc-citizen-to-waf` | JUNCTION | SECURITY_RBAC_WAF | FLOW_CITIZEN_ACCESS | defined | Điểm nối chuyển tiếp request vào WAF |
| `node-waf-inspect-request` | SYSTEM_ACTION | SECURITY_RBAC_WAF | FLOW_SECURITY_RBAC | defined | L7 WAF kiểm tra IP, User-Agent, Honeypots |
| `node-waf-decision-bot` | DECISION | SECURITY_RBAC_WAF | FLOW_SECURITY_RBAC | defined | Rẽ nhánh: Có phải Bot AI / IP bị khóa? |
| `node-waf-bot-denied` | ERROR | SECURITY_RBAC_WAF | FLOW_SECURITY_RBAC | defined | Từ chối 403 AI_BOT_FORBIDDEN / IP_BANNED |
| `node-waf-rbac-guard` | SYSTEM_ACTION | SECURITY_RBAC_WAF | FLOW_SECURITY_RBAC | defined | Zero-Trust RBAC: Kiểm tra Cookie/JWT Session |
| `node-waf-rate-limit-check` | DECISION | SECURITY_RBAC_WAF | FLOW_SECURITY_RBAC | defined | Rẽ nhánh: Vượt ngưỡng Multi-tier Token Bucket? |
| `node-waf-rate-limit-denied` | ERROR | SECURITY_RBAC_WAF | FLOW_SECURITY_RBAC | defined | Từ chối 429 & Tự động khóa IP 15 phút |
| `node-waf-token-revoked` | ERROR | SECURITY_RBAC_WAF | FLOW_SECURITY_RBAC | defined | Từ chối 401 SESSION_REVOKED khi đã logout |
| `node-junc-waf-to-ward` | JUNCTION | WARD_DISPATCHER | FLOW_WARD_DISPATCH | defined | Điểm nối chuyển tiếp tin báo vào cấp Xã/Phường |
| `node-ward-intake-event` | EVENT | WARD_DISPATCHER | FLOW_WARD_DISPATCH | defined | Tiếp nhận SSE sos_new khớp địa bàn xã |
| `node-ward-decision-capacity` | DECISION | WARD_DISPATCHER | FLOW_WARD_DISPATCH | defined | Rẽ nhánh: Cấp cơ sở đủ năng lực tự xử lý? |
| `node-ward-assign-local` | SYSTEM_ACTION | WARD_DISPATCHER | FLOW_WARD_DISPATCH | defined | Điều động lực lượng xã (Công an xã, dân phòng) |
| `node-ward-escalate-action` | SYSTEM_ACTION | WARD_DISPATCHER | FLOW_ESCALATION | defined | Bấm Leo thang / Chuyển cấp lên Tuyến Tỉnh |
| `node-ward-fake-flag` | SYSTEM_ACTION | WARD_DISPATCHER | FLOW_WARD_DISPATCH | defined | Lập biên bản viễn trắc OSINT báo khống (NĐ 144) |
| `node-ward-resolved` | STATE | WARD_DISPATCHER | FLOW_WARD_DISPATCH | defined | Hoàn thành kiểm soát sự cố cấp cơ sở |
| `node-junc-escalation-to-prov` | JUNCTION | PROVINCE_DISPATCHER | FLOW_ESCALATION | defined | Điểm nối bàn giao quyền chỉ huy cho Tuyến Tỉnh |
| `node-prov-intake-event` | EVENT | PROVINCE_DISPATCHER | FLOW_PROVINCE_DISPATCH | defined | Tiếp nhận sự cố cấp Tỉnh và ca leo thang |
| `node-prov-decision-agency` | DECISION | PROVINCE_DISPATCHER | FLOW_PROVINCE_DISPATCH | defined | Rẽ nhánh: Phân công theo lực lượng 113/114/115 |
| `node-prov-dispatch-police` | SYSTEM_ACTION | PROVINCE_DISPATCHER | FLOW_PROVINCE_DISPATCH | defined | Công an Tỉnh điều cảnh sát cơ động / phản ứng nhanh |
| `node-prov-dispatch-traffic` | SYSTEM_ACTION | PROVINCE_DISPATCHER | FLOW_PROVINCE_DISPATCH | defined | Phòng CSGT điều xe tuần tra phân luồng tuyến |
| `node-prov-dispatch-fire` | SYSTEM_ACTION | PROVINCE_DISPATCHER | FLOW_PROVINCE_DISPATCH | defined | PC07 điều xe chữa cháy, xe thang cứu nạn |
| `node-prov-dispatch-med` | SYSTEM_ACTION | PROVINCE_DISPATCHER | FLOW_PROVINCE_DISPATCH | defined | Cấp Cứu 115 điều xe chuyên dụng & bệnh viện tỉnh |
| `node-prov-inter-agency` | SYSTEM_ACTION | PROVINCE_DISPATCHER | FLOW_PROVINCE_DISPATCH | defined | Hiệp đồng tác chiến liên ngành cấp Tỉnh |
| `node-ent-intake-event` | EVENT | ENTERPRISE_PARTNER | FLOW_ENTERPRISE_RESCUE | defined | Tiếp nhận yêu cầu cứu hộ giao thông đường bộ |
| `node-ent-decision-type` | DECISION | ENTERPRISE_PARTNER | FLOW_ENTERPRISE_RESCUE | defined | Rẽ nhánh: Xe hỏng thông thường hay tai nạn nghiêm trọng? |
| `node-ent-dispatch-tow` | SYSTEM_ACTION | ENTERPRISE_PARTNER | FLOW_ENTERPRISE_RESCUE | defined | Điều xe cẩu kéo, xe sàn trượt di dời phương tiện |
| `node-ent-collab-police` | SYSTEM_ACTION | ENTERPRISE_PARTNER | FLOW_ENTERPRISE_RESCUE | defined | Báo phối hợp CSGT giải tỏa ách tắc tuyến đường |
| `node-junc-prov-to-field` | JUNCTION | FIELD_RESPONDER | FLOW_PROVINCE_DISPATCH | defined | Điểm nối phát lệnh điều động ra hiện trường |
| `node-field-receive-dispatch` | EVENT | FIELD_RESPONDER | FLOW_PROVINCE_DISPATCH | defined | Kíp cơ động trên xe nhận lệnh và tọa độ GPS |
| `node-field-status-enroute` | STATE | FIELD_RESPONDER | FLOW_PROVINCE_DISPATCH | defined | Đang di chuyển khẩn cấp (status: enroute) |
| `node-field-status-onscene` | STATE | FIELD_RESPONDER | FLOW_PROVINCE_DISPATCH | defined | Đã có mặt tại hiện trường (status: onscene) |
| `node-field-decision-verify` | DECISION | FIELD_RESPONDER | FLOW_PROVINCE_DISPATCH | defined | Rẽ nhánh: Hiện trường có thật hay báo khống? |
| `node-field-record-fake` | SYSTEM_ACTION | FIELD_RESPONDER | FLOW_PROVINCE_DISPATCH | defined | Lập biên bản viễn trắc hiện trường giả |
| `node-field-resolve` | END | FIELD_RESPONDER | FLOW_PROVINCE_DISPATCH | defined | Cứu hộ thành công, hoàn tất tác chiến |
| `node-nat-monitor-all` | SYSTEM_ACTION | NATIONAL_COMMAND | FLOW_NATIONAL_OVERSIGHT | defined | Giám sát 3D thời gian thực toàn quốc |
| `node-nat-decision-intervene` | DECISION | NATIONAL_COMMAND | FLOW_NATIONAL_OVERSIGHT | defined | Rẽ nhánh: Tình huống khủng hoảng đa tỉnh cần can thiệp? |
| `node-nat-override-dispatch` | SYSTEM_ACTION | NATIONAL_COMMAND | FLOW_NATIONAL_OVERSIGHT | defined | Phát lệnh chỉ huy tối cao chi viện đa tỉnh |
| `node-nat-excel-sync` | DATA_STORE | NATIONAL_COMMAND | FLOW_NATIONAL_OVERSIGHT | defined | CSDL 453 tài khoản & 192 trạm (Excel 4 Sheet) |
| `node-nat-audit-log-store` | DATA_STORE | NATIONAL_COMMAND | FLOW_NATIONAL_OVERSIGHT | defined | Sổ trực ban & Nhật ký kiểm toán bất biến (NĐ 30) |
| `node-nat-blacklist-mgt` | DATA_STORE | NATIONAL_COMMAND | FLOW_NATIONAL_OVERSIGHT | defined | CSDL Dấu vết số OSINT & Blacklist toàn quốc |
| `node-junc-fake-to-blacklist` | JUNCTION | NATIONAL_COMMAND | FLOW_NATIONAL_OVERSIGHT | defined | Điểm nối nhập hồ sơ báo khống vào Blacklist |
| `node-gap-de-escalation` | SPEC_GAP | WARD_DISPATCHER | FLOW_ESCALATION | unresolved_gap | GAP: Chưa có quy trình hạ cấp Tỉnh ➔ Phường |
| `node-decision-de-escalate-policy` | OWNER_DECISION_REQUIRED | PROVINCE_DISPATCHER | FLOW_ESCALATION | owner_decision_required | QUYẾT ĐỊNH OWNER: Tỉnh có bàn giao lại Phường đóng ca? |
| `node-gap-enterprise-territory` | SPEC_GAP | ENTERPRISE_PARTNER | FLOW_ENTERPRISE_RESCUE | unresolved_gap | GAP: Thiếu ranh giới bán kính km cho xe cứu hộ |
| `node-gap-field-direct-auth` | SPEC_GAP | FIELD_RESPONDER | FLOW_PROVINCE_DISPATCH | unresolved_gap | GAP: Cán bộ trên xe chưa có role riêng 'field_officer' |

---

## 3. Bảng Edges (Các Liên Kết và Điều Kiện Chuyển Luồng)

Toàn bộ 35 edge kết nối đã được định danh chính xác, có điều kiện tường minh (`data-condition`), loại luồng (`data-edge-type`), và trích dẫn mã nguồn thực tế.

---

## 4. Bảng Gaps & Risk Notes

| Gap / Risk ID | Phân Loại | Vị Trí Phát Hiện | Nguyên Nhân Chặn Triển Khai | Giải Pháp Khắc Phục Bắt Buộc |
|---|---|---|---|---|
| `GAP_DE_ESCALATION` | SPEC_GAP | `server.js#L1599-1639` | Hệ thống chỉ một chiều leo thang (`ward ➔ province`); sau khi dập lửa/cấp cứu xong, tỉnh không thể bàn giao ngược về phường theo dõi. | Cần bổ sung endpoint `POST /api/incidents/:id/de-escalate` và kiểm tra quyền điều phối tỉnh. |
| `GAP_ENTERPRISE_TERRITORY` | SPEC_GAP | `server.js#L525-573` | Cứu hộ giao thông doanh nghiệp (38 tài khoản) mới phân vùng theo tỉnh chung, chưa có bán kính hoạt động (km) trên bản đồ. | Bổ sung `serviceRadiusKm` trong `assets/agency-accounts.json` và thuật toán tính cự ly Haversine. |
| `GAP_FIELD_DIRECT_AUTH` | SPEC_GAP | `security-firewall-middleware.js` | Cán bộ cơ động trên xe hiện trường đang dùng chung tài khoản web của trực ban; tiềm ẩn nguy cơ bảo mật và không định danh được cá nhân. | Bổ sung role `field_officer` và xác thực qua mã QR trên xe cơ động. |
| `DECISION_DE_ESCALATE_POLICY` | OWNER_DECISION_REQUIRED | Quy trình nghiệp vụ tác chiến | Owner cần xác định: Sau khi Tỉnh chi viện xong, ai là người ký đóng ca pháp lý theo Nghị định 30 (Chỉ huy Tỉnh hay Trực ban Xã)? | Cần văn bản phê duyệt quy trình đóng ca từ Chủ quản dự án. |
