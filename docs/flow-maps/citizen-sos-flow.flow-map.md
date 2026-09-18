# Tài Liệu Đặc Tả Luồng Tác Chiến: Phân Hệ Người Dân (Citizen SOS Flow Map)

## 1. Thông Tin Chung
- **Tên tính năng / Quy trình**: Quy trình tiếp nhận và gửi tín hiệu cứu hộ khẩn cấp phía Người dân (Citizen SOS End-to-End Workflow).
- **Mã định danh**: `citizen-sos-flow`
- **Mã tài liệu nguồn**: `DE_TAI_NGHIEN_CUU_KHOA_HOC_SOS_VIETNAM_2026_MOI.docx` (Chương 2).
- **Tệp SVG trực quan**: `docs/flow-maps/citizen-sos-flow.flow.svg`
- **Trạng thái**: `READY_FOR_OWNER_REVIEW`

---

## 2. Mô Tả Chi Tiết 5 Bước Tác Chiến

### Bước 1: Khởi Phát Báo Động SOS & Lựa Chọn Lực Lượng Chuyên Trách
- **Tác nhân**: Người dân đối mặt với tình huống nguy cấp hoặc chứng kiến sự cố.
- **Hành động**: Nhấn nút báo động trung tâm **Master SOS Orb** (tích hợp hiệu ứng hạt ánh sáng và sóng xung kích).
- **Ma trận 5 Lực lượng Chuyên biệt**:
  1. *Công An Khu Vực (113/Cấp Xã)*: Xử lý an ninh trật tự, trộm cướp, bạo lực gia đình, người lạc.
  2. *Cảnh Sát Giao Thông (CSGT)*: Va chạm, tai nạn giao thông nghiêm trọng, xe lật chắn cao tốc.
  3. *Cảnh Sát PCCC & CNCH (114)*: Cháy nhà, chung cư, sập công trình, đuối nước, mắc kẹt thang máy.
  4. *Cứu Hộ Giao Thông (Doanh nghiệp 5★)*: Kéo xe, cẩu xe, cứu hộ kỹ thuật đường bộ.
  5. *Cấp Cứu Y Tế 115 & Bệnh Viện*: Nạn nhân bất tỉnh, ngừng tim phổi, chấn thương nặng.
- **Lối tắt khẩn cấp bổ trợ**:
  - *SOS Người Thân (Family Alert)*: Gửi tin nhắn SMS đính kèm đường dẫn Google Maps tọa độ GPS.
  - *Cẩm Nang Sinh Tồn Ngoại Tuyến*: Hoạt động không cần Internet với 4 mô-đun kỹ năng thoát hiểm.

### Bước 2: Phân Loại Tình Huống (Chips) & Trích Xuất Vệ Tinh GPS
- **Động cơ Gợi ý Sự cố (Contextual Chips Engine)**: Hiển thị danh mục sự cố đặc thù theo từng lực lượng (ví dụ: CSGT có chip "Tai nạn giao thông", "Xe lật"; PCCC có chip "Cháy nhà dân", "Người mắc kẹt"). Người dân chỉ cần 1-chạm không cần gõ phím khi hoảng loạn.
- **Thu nhận Vệ tinh GPS WGS-84**: Trích xuất tọa độ chính xác, bán kính sai số và tự động ánh xạ vào ranh giới 3.321 Xã/Phường.
- **Cảnh báo Chế tài Pháp lý (Nghị định 144/2021/NĐ-CP)**: Răn đe các hành vi báo tin giả (phạt 4.000.000đ - 6.000.000đ hoặc truy cứu hình sự).

### Bước 3: Đồng Bộ Thời Gian Thực & Kết Nối Phòng Chỉ Huy
- **Gói tin SOS**: Gửi tức thời qua giao thức WebSocket (fallback HTTP API).
- **Thanh tiến trình 5 giai đoạn trực quan**:
  1. *Đã phát SOS* -> 2. *Đã tiếp nhận* -> 3. *Điều động xe* -> 4. *Đến hiện trường* -> 5. *Hoàn tất*.
- **Minh bạch Đơn vị Tiếp nhận**: Tên cơ quan Công An/CSGT/PCCC, Họ tên Sĩ quan chỉ huy trực ban, Số máy bàn trực ban, Hotline SMS và Email tiếp nhận.

### Bước 4: Tương Tác Hai Chiều & Đàm Thoại Trực Tiếp Hiện Trường
- **WebRTC Audio & Video 2 chiều**: Cán bộ hướng dẫn sơ cấp cứu, trấn an tinh thần; người dân truyền hình ảnh thực tế giúp lực lượng chuẩn bị trang thiết bị.
- **Bản đồ Lộ trình Di chuyển Thời gian thực**: Theo dõi xe tuần tra/cứu hộ đang tiếp cận (biển số xe, vận tốc, khoảng cách và thời gian dự kiến đến).
- **Kênh Chat & Tải Ảnh**: Dành cho nạn nhân đang trong tình huống nguy hiểm không thể phát ra tiếng nói.

### Bước 5: Ký Tên Điện Tử Xác Nhận & Hoàn Tất Hồ Sơ Số
- **Canvas Cảm ứng HTML5**: Người dân ký tên bằng nét vẽ tay hoặc nhập họ tên.
- **Phân định Thẩm quyền Khắt khe**: Người dân chỉ được ký vào ô Công dân; cột Cán bộ tiếp nhận bị khóa cứng (Readonly). Backend bảo vệ bằng mã HTTP 403.
- **Lưu trữ Hồ sơ Chuẩn Nghị định 30/2020/NĐ-CP**: Xuất Phiếu tiếp nhận thông tin sự cố đầy đủ 2 chữ ký, lưu vết vĩnh viễn trên máy chủ.
