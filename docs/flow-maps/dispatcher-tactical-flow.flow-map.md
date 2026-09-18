# Tài Liệu Đặc Tả Luồng Tác Chiến: Phía Cán Bộ Trực Ban (Dispatcher Tactical Flow Map)

## 1. Thông Tin Chung
- **Tên tính năng / Quy trình**: Quy trình chỉ huy, điều phối và xử lý tác chiến của Cán bộ trực ban (Officer / Dispatcher Tactical Workflow).
- **Mã định danh**: `dispatcher-tactical-flow`
- **Mã tài liệu nguồn**: `DE_TAI_NGHIEN_CUU_KHOA_HOC_SOS_VIETNAM_2026_MOI.docx` (Chương 2.4 & 2.6).
- **Tệp SVG trực quan**: `docs/flow-maps/dispatcher-tactical-flow.flow.svg`
- **Trạng thái**: `READY_FOR_OWNER_REVIEW`

---

## 2. Mô Tả Chi Tiết 5 Bước Tác Chiến Chỉ Huy

### Bước 1: Tiếp Nhận Hàng Đợi & Phân Loại Sự Cố 24/7
- **Bảng làm việc Màn hình rộng (Desktop Command Center)**: Thiết kế tối ưu cho phòng trực ban tác chiến Công an và Ban Chỉ huy PCTT.
- **5 Hàng đợi nghiệp vụ chuyên trách**: Phân loại theo Công An (113/Xã), CSGT, PCCC & CNCH (114), Cứu hộ giao thông, Cấp cứu 115.
- **Hệ thống cảnh báo đa giác quan**: Chuông báo động âm thanh kỹ thuật số (Web Audio API) kết hợp chớp nháy thị giác cảnh báo mức độ khẩn cấp (Đỏ: Cấp cứu tính mạng; Vàng: Sự cố nghiêm trọng; Xanh: Hỗ trợ thông thường).

### Bước 2: Tác Chiến Không Gian Số Trên Bản Đồ GIS 3D (Spatial Triage)
- **Bản đồ số 3D MapLibre GL JS**: Khai thác dữ liệu phân vùng 34 tỉnh thành và 3.321 đơn vị hành chính cấp Xã/Phường toàn quốc.
- **Tự động bay đến tọa độ hiện trường (Auto-FlyTo)**: Khóa vị trí nạn nhân ngay khi nhấp vào tin báo.
- **Thuật toán quét bán kính trạm cứu nạn**: Tự động rà soát trong bán kính 2 - 5km các trụ sở Công An, đồn CSGT, đội PCCC cơ sở, trạm 115 và gara cứu hộ xe gần nhất để tính toán phương án tiếp cận nhanh nhất.

### Bước 3: Ra Lệnh Điều Động Lực Lượng Phản Ứng Nhanh (Unit Dispatch)
- **Hộp thoại điều động chuyên dụng**: Cho phép Cán bộ trực ban chọn Tổ công tác hiện trường, phương tiện (biển số xe), gán trang thiết bị nghiệp vụ (cáng thương, bình khí thở, kìm thủy lực...).
- **Phát lệnh tác chiến số tức thời**: Lệnh truyền tới máy tính bảng chuyên dụng của xe tuần tra, kích hoạt còi và đèn ưu tiên.
- **Đồng bộ trạng thái người dân**: Màn hình của người dân tự động chuyển sang "Điều động xe" và hiển thị danh tính cán bộ tiếp nhận trong vòng dưới 0.3 giây.

### Bước 4: Giám Sát Lộ Trình Di Chuyển Thời Gian Thực & Chỉ Huy Hiện Trường
- **Giám sát GPS phương tiện**: Cập nhật tọa độ di chuyển của xe tuần tra/cứu hộ theo từng giây, hiển thị vận tốc, khoảng cách còn lại và thời gian dự kiến đến (ETA).
- **Tiếp nhận Video Trực tiếp từ Hiện trường**: Cán bộ theo dõi quy mô đám cháy hoặc hiện trạng vụ va chạm xe, hướng dẫn xử lý từ xa và ghi hình làm chứng cứ pháp lý.
- **Hiệp đồng tác chiến liên ngành**: Điều phối phối hợp giữa nhiều lực lượng (CSGT phân luồng, PCCC dập lửa, 115 cấp cứu nạn nhân).

### Bước 5: Nghiệm Thu Hiện Trường, Ký Số Điện Tử & Xuất Hồ Sơ Nghị Định 30
- **Lập Biên bản Xử lý Hành chính chuẩn Nghị định 30/2020/NĐ-CP**: Đầy đủ quốc hiệu, tiêu ngữ, thông tin sự vụ, diễn biến và kết quả cứu trợ.
- **Cán bộ Trực ban Ký số Điện tử & Đóng Dấu Đơn vị**: Khẳng định trách nhiệm công vụ, bảo đảm tính pháp lý trọn vẹn theo Luật Giao dịch điện tử số 20/2023/QH15.
- **Đồng bộ 2 Chiều Web <-> Excel**: Ghi nhận vào sổ lưu trữ điện tử bất biến và xuất báo cáo thống kê đa chiều phục vụ công tác thanh tra, tổng kết.
