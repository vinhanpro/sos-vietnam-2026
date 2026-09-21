# -*- coding: utf-8 -*-
"""
Reformat DanhSach_TaiKhoan_PhanQuyen_DonVi_2026 (6).xlsx
to match the beautiful format of DanhSach_TaiKhoan_PhanQuyen_DonVi_2026-09-17.xlsx

Reads ALL data from source file (6), groups by province, applies:
- Dark blue title banner
- Colored column headers per sheet
- Section headers with emoji icons per province
- Zebra striping on data rows
- Purple bold username/password columns
- Thin light borders
- Proper column widths, row heights, alignments
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import sys
import os
from datetime import datetime
from collections import OrderedDict

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ─── Configuration ───────────────────────────────────────────────────

SRC_PATH = r"D:\DOWNLOAD\DanhSach_TaiKhoan_PhanQuyen_DonVi_2026 (6).xlsx"
OUT_PATH = r"D:\DOWNLOAD\DanhSach_TaiKhoan_PhanQuyen_DonVi_2026_formatted.xlsx"

CITY_PROVINCES = ["Cần Thơ", "Đà Nẵng", "Hải Phòng", "TP. Hồ Chí Minh", "Huế", "Hà Nội"]

# Province display order: cities first, then alphabetical provinces
PROVINCE_ORDER = [
    "Cần Thơ", "Đà Nẵng", "Hải Phòng", "TP. Hồ Chí Minh", "Huế", "Hà Nội",
    "An Giang", "Bắc Ninh", "Bình Dương", "Cà Mau", "Cao Bằng",
    "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp",
    "Gia Lai", "Hà Tĩnh", "Hưng Yên", "Khánh Hòa",
    "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai",
    "Nghệ An", "Ninh Bình", "Phú Thọ",
    "Quảng Ngãi", "Quảng Ninh", "Quảng Trị",
    "Sơn La", "Tây Ninh", "Thái Nguyên", "Thanh Hóa",
    "Tuyên Quang", "Vĩnh Long"
]

# ─── Styles (exact match to reference file) ──────────────────────────

# Fonts
font_banner_title = Font(name="Arial", size=10.5, bold=True, color="FFFFFF")
font_subtitle = Font(name="Arial", size=13, bold=True, color="1E3A8A")
font_metadata = Font(name="Arial", size=9.5, bold=False, color="475569")
font_header = Font(name="Arial", size=9.5, bold=True, color="FFFFFF")
font_section = Font(name="Arial", size=10.5, bold=True, color="0F172A")
font_data = Font(name="Arial", size=9, bold=False, color="0F172A")
font_user_pass = Font(name="Arial", size=9, bold=True, color="6D28D9")

# Fills
fill_banner = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
fill_transparent = PatternFill(fill_type=None)

# Per-sheet header fills
SHEET_STYLES = {
    "Công An & CAND": {
        "header_fill": PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid"),
        "section_fill": PatternFill(start_color="E0E7FF", end_color="E0E7FF", fill_type="solid"),
        "subtitle": "DANH SÁCH TÀI KHOẢN: LỰC LƯỢNG CÔNG AN & AN NINH NHÂN DÂN",
        "meta_suffix": "Chế độ: BẢO MẬT TÁC CHIẾN",
        "section_icon": "🏙️",
        "national_icon": "🏛️",
    },
    "Cấp Cứu Y Tế": {
        "header_fill": PatternFill(start_color="065F46", end_color="065F46", fill_type="solid"),
        "section_fill": PatternFill(start_color="D1FAE5", end_color="D1FAE5", fill_type="solid"),
        "subtitle": "DANH SÁCH TÀI KHOẢN: HỆ THỐNG CẤP CỨU Y TẾ & BỆNH VIỆN 34 TỈNH THÀNH",
        "meta_suffix": "Ngành: Y TẾ ĐIỀU PHỐI",
        "section_icon": "🏥",
        "national_icon": "🏥",
    },
    "Cứu Hộ Doanh Nghiệp": {
        "header_fill": PatternFill(start_color="9A3412", end_color="9A3412", fill_type="solid"),
        "section_fill": PatternFill(start_color="FFEDD5", end_color="FFEDD5", fill_type="solid"),
        "subtitle": "DANH SÁCH TÀI KHOẢN: DOANH NGHIỆP & GARAGE CỨU HỘ XE GIAO THÔNG 34 TỈNH THÀNH",
        "meta_suffix": "Ngành: DỊCH VỤ CỨU HỘ ĐƯỜNG BỘ",
        "section_icon": "🚗",
        "national_icon": "🚗",
    },
}

fill_zebra = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
fill_white = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

# Border
thin_side = Side(border_style="thin", color="CBD5E1")
cell_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

# Alignments per column (A=1 to L=12)
COL_ALIGNS = {
    1: Alignment(horizontal="center", vertical="center"),      # STT
    2: Alignment(horizontal="left", vertical="center"),         # Khu Vực
    3: Alignment(horizontal="left", vertical="center"),         # Lực Lượng
    4: Alignment(horizontal="center", vertical="center"),       # Cấp HC
    5: Alignment(horizontal="left", vertical="center"),         # Tên CQ
    6: Alignment(horizontal="left", vertical="center"),         # Địa Bàn
    7: Alignment(horizontal="center", vertical="center"),       # Username
    8: Alignment(horizontal="center", vertical="center"),       # Password
    9: Alignment(horizontal="left", vertical="center"),         # Cán Bộ
    10: Alignment(horizontal="center", vertical="center"),      # Chức Vụ
    11: Alignment(horizontal="center", vertical="center"),      # SĐT
    12: Alignment(horizontal="center", vertical="center"),      # SMS
}

# Column widths
COL_WIDTHS = {
    'A': 6, 'B': 18, 'C': 22, 'D': 18, 'E': 40, 'F': 24,
    'G': 18, 'H': 16, 'I': 22, 'J': 18, 'K': 16, 'L': 16
}

# Column headers
HEADERS = [
    "STT", "Khu Vực (Tỉnh/TP)", "Lực Lượng Nghiệp Vụ", "Cấp Hành Chính",
    "Tên Cơ Quan / Đơn Vị Trực Ban", "Địa Bàn (Xã/Phường)",
    "Tên Đăng Nhập", "Mật Khẩu", "Cán Bộ Phụ Trách",
    "Chức Vụ / Cấp Bậc", "SĐT Trực Ban", "SMS Tiếp Nhận"
]


# ─── Helper Functions ────────────────────────────────────────────────

def province_label(prov_name):
    """Format province name for section header."""
    if prov_name in CITY_PROVINCES:
        return f"TP. {prov_name.upper()}" if prov_name != "TP. Hồ Chí Minh" else "TP. HỒ CHÍ MINH"
    return f"TỈNH {prov_name.upper()}"


def read_data_rows(ws):
    """Read all data rows from a worksheet (skip header rows 1-5)."""
    rows = []
    for r in range(6, ws.max_row + 1):
        vals = [ws.cell(r, c).value for c in range(1, 13)]
        if any(vals):  # Skip completely empty rows
            rows.append(vals)
    return rows


def group_by_province(rows, is_police_sheet=False):
    """Group rows by province. Returns OrderedDict {province: [rows]}."""
    national = []
    by_prov = OrderedDict()

    for row in rows:
        prov = row[1]  # Column B = Khu Vực
        cap_hc = str(row[3] or '').strip()

        if is_police_sheet and (prov == 'Toàn Quốc' or cap_hc == 'Trung Ương'):
            national.append(row)
        else:
            if prov not in by_prov:
                by_prov[prov] = []
            by_prov[prov].append(row)

    # Sort provinces by PROVINCE_ORDER
    sorted_prov = OrderedDict()
    for p in PROVINCE_ORDER:
        if p in by_prov:
            sorted_prov[p] = by_prov[p]
    # Add any remaining provinces not in our order list
    for p in by_prov:
        if p not in sorted_prov:
            sorted_prov[p] = by_prov[p]

    return national, sorted_prov


def write_title_rows(ws, sheet_name, style_cfg):
    """Write rows 1-4 (title, subtitle, metadata, spacer)."""
    now = datetime.now()
    time_str = now.strftime("%H:%M:%S %d/%m/%Y")

    # Row 1: National banner
    ws.merge_cells('A1:L1')
    c = ws['A1']
    c.value = "HỆ THỐNG CỨU HỘ & CẢNH BÁO SOS KHẨN CẤP QUỐC GIA (34 TỈNH THÀNH)"
    c.font = font_banner_title
    c.fill = fill_banner
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 22

    # Row 2: Subtitle
    ws.merge_cells('A2:L2')
    c = ws['A2']
    c.value = style_cfg['subtitle']
    c.font = font_subtitle
    c.fill = fill_transparent
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 24

    # Row 3: Metadata
    ws.merge_cells('A3:L3')
    c = ws['A3']
    c.value = f"Thời điểm xuất: {time_str}  ·  Đơn vị: Trung Tâm Chỉ Huy Tác Chiến & Điều Phối Quốc Gia  ·  {style_cfg['meta_suffix']}"
    c.font = font_metadata
    c.fill = fill_transparent
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[3].height = 18

    # Row 4: Spacer
    ws.row_dimensions[4].height = 6


def write_header_row(ws, row_num, style_cfg):
    """Write column headers at given row."""
    for col_idx, header_text in enumerate(HEADERS, start=1):
        c = ws.cell(row=row_num, column=col_idx)
        c.value = header_text
        c.font = font_header
        c.fill = style_cfg['header_fill']
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = cell_border
    ws.row_dimensions[row_num].height = 26


def write_section_header(ws, row_num, label, style_cfg):
    """Write a merged section header row."""
    ws.merge_cells(start_row=row_num, start_column=1, end_row=row_num, end_column=12)
    c = ws.cell(row=row_num, column=1)
    c.value = label
    c.font = font_section
    c.fill = style_cfg['section_fill']
    c.alignment = Alignment(horizontal="left", vertical="center")
    c.border = cell_border
    # Apply border to all merged cells
    for col in range(2, 13):
        ws.cell(row=row_num, column=col).border = cell_border
    ws.row_dimensions[row_num].height = 22


def write_data_row(ws, row_num, data, stt, is_odd):
    """Write a single data row with formatting."""
    row_fill = fill_white if is_odd else fill_zebra

    # Column values
    values = [stt] + data[1:]  # Replace original STT with new sequential number

    for col_idx in range(1, 13):
        c = ws.cell(row=row_num, column=col_idx)
        val = values[col_idx - 1] if col_idx - 1 < len(values) else None
        c.value = val

        # Font: special for username (col 7) and password (col 8)
        if col_idx in (7, 8):
            c.font = font_user_pass
        else:
            c.font = font_data

        c.fill = row_fill
        c.alignment = COL_ALIGNS.get(col_idx, Alignment(horizontal="left", vertical="center"))
        c.border = cell_border

    ws.row_dimensions[row_num].height = 20


def set_column_widths(ws):
    """Set column widths."""
    for letter, width in COL_WIDTHS.items():
        ws.column_dimensions[letter].width = width


# ─── Main ────────────────────────────────────────────────────────────

def main():
    print(f"📖 Đọc file nguồn: {SRC_PATH}")
    wb_src = openpyxl.load_workbook(SRC_PATH, data_only=True)
    wb_out = openpyxl.Workbook()

    # Remove default sheet
    default_ws = wb_out.active
    wb_out.remove(default_ws)

    total_accounts = 0

    for sheet_name in wb_src.sheetnames:
        ws_src = wb_src[sheet_name]
        style_cfg = SHEET_STYLES.get(sheet_name)
        if not style_cfg:
            print(f"⚠️  Sheet '{sheet_name}' không có cấu hình style, bỏ qua.")
            continue

        print(f"\n📋 Đang xử lý sheet: {sheet_name} ({ws_src.max_row} dòng gốc)")

        ws_out = wb_out.create_sheet(title=sheet_name)
        is_police = (sheet_name == "Công An & CAND")

        # 1. Read data
        data_rows = read_data_rows(ws_src)
        print(f"   Đọc được {len(data_rows)} dòng dữ liệu")

        # 2. Group by province
        national, by_prov = group_by_province(data_rows, is_police_sheet=is_police)
        print(f"   Trung ương: {len(national)} | Tỉnh/TP: {len(by_prov)} khu vực")

        # 3. Write title rows (1-4)
        write_title_rows(ws_out, sheet_name, style_cfg)

        # 4. Write column headers (row 5)
        write_header_row(ws_out, 5, style_cfg)

        # 5. Write data with section headers
        current_row = 6
        stt = 1
        section_num = 1  # Section numbering starts at 1 for police (national = I)

        # National section (only for police sheet)
        if national:
            if is_police:
                label = f"{style_cfg['national_icon']} I. CẤP TRUNG ƯƠNG / QUỐC GIA (TỔNG HỢP)"
            else:
                label = f"{style_cfg['section_icon']} CẤP TRUNG ƯƠNG"
            write_section_header(ws_out, current_row, label, style_cfg)
            current_row += 1

            for i, row_data in enumerate(national):
                write_data_row(ws_out, current_row, row_data, stt, is_odd=(i % 2 == 0))
                stt += 1
                current_row += 1
                total_accounts += 1

            if is_police:
                section_num = 2  # Next section starts at 2

        # Province sections
        for prov_name, prov_rows in by_prov.items():
            # Section header
            prov_display = province_label(prov_name)
            label = f"{style_cfg['section_icon']} {section_num}. KHU VỰC: {prov_display}"
            write_section_header(ws_out, current_row, label, style_cfg)
            current_row += 1

            for i, row_data in enumerate(prov_rows):
                write_data_row(ws_out, current_row, row_data, stt, is_odd=(i % 2 == 0))
                stt += 1
                current_row += 1
                total_accounts += 1

            section_num += 1

        # 6. Set column widths
        set_column_widths(ws_out)

        # 7. Freeze panes at row 6 (below headers)
        ws_out.freeze_panes = 'A6'

        print(f"   ✅ Xuất {stt - 1} tài khoản trong {section_num - 1} khu vực → {current_row - 1} dòng")

    # Save
    wb_out.save(OUT_PATH)
    print(f"\n🎉 HOÀN THÀNH! File đã được lưu tại:")
    print(f"   📁 {OUT_PATH}")
    print(f"   📊 Tổng cộng: {total_accounts} tài khoản")


if __name__ == '__main__':
    main()
