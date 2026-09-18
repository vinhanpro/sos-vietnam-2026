# -*- coding: utf-8 -*-
import sys
import json
import os
import re
import urllib.parse
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

def strip_emojis(text):
    if not isinstance(text, str):
        return str(text or '')
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"
        "\U0001F300-\U0001F5FF"
        "\U0001F680-\U0001F6FF"
        "\U0001F1E0-\U0001F1FF"
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "\U0001F900-\U0001F9FF"
        "\U0001FA70-\U0001FAFF"
        "\U00002600-\U000026FF"
        "]+", flags=re.UNICODE
    )
    cleaned = emoji_pattern.sub('', text)
    for icon in ['✍️', '🚨', '🚒', '🚑', '🚓', '🛠️', '🟢', '✅', '⚠️', '⚡', '📍', '🚗', '🛵', '🏢', '🏛️', '🏙️', '📞', '🔒']:
        cleaned = cleaned.replace(icon, '')
    return cleaned.strip()

def unmask_phone(phone):
    if not phone or not isinstance(phone, str):
        return ''
    cleaned = strip_emojis(phone).strip()
    if '•' in cleaned:
        cleaned = re.sub(r'[•\s]+', '113', cleaned)
    return cleaned

def format_agency(agency):
    if not agency:
        return 'Cứu Hộ Tổng Hợp'
    raw = str(agency).lower().strip()
    # Tuyệt đối không để số hotline kèm theo như 113, 114, 115 theo yêu cầu chuẩn hóa
    mapping = {
        'police': 'Công An',
        'csgt': 'Cảnh Sát Giao Thông',
        'fire': 'Cảnh Sát PCCC & CNCH',
        'hospital': 'Cấp Cứu Y Tế',
        'ambulance': 'Cấp Cứu Y Tế',
        'traffic-rescue': 'Cứu Hộ Giao Thông',
        'all': 'Chỉ Huy Tổng Hợp'
    }
    for k, v in mapping.items():
        if k in raw:
            return v
    return 'Cứu Hộ Tổng Hợp'

def format_datetime(dt_str):
    if not dt_str:
        return ''
    try:
        dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        return dt.strftime('%H:%M:%S %d/%m/%Y')
    except Exception:
        return str(dt_str)

def generate_excel(json_path, output_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    incidents = data.get('incidents', [])
    generated_at = data.get('generatedAt', datetime.now().strftime('%H:%M:%S %d/%m/%Y'))
    officer_name = data.get('officerName', 'Trực ban tác chiến')

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Lịch Sử Sự Cố SOS"
    ws.views.sheetView[0].showGridLines = True

    # Page setup: Khổ A4 nằm ngang, tự động vừa trang in
    ws.page_setup.orientation = ws.ORIENTATION_LANDSCAPE
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0

    # Palette
    NAVY_HEADER_FILL = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    ZEBRA_FILL = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    WHITE_FILL = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

    FONT_HEADER = Font(name="Times New Roman", size=10, bold=True, color="FFFFFF")
    FONT_TITLE = Font(name="Times New Roman", size=14, bold=True, color="0F172A")
    FONT_SUBTITLE = Font(name="Times New Roman", size=10, italic=True, color="475569")
    FONT_NORMAL = Font(name="Times New Roman", size=10, color="0F172A")
    FONT_BOLD = Font(name="Times New Roman", size=10, bold=True, color="0F172A")
    FONT_LINK = Font(name="Times New Roman", size=10, color="0044CC", underline="single")

    THIN_BORDER = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    # 1. National Title Banner (13 columns A to M)
    ws.merge_cells('A1:M1')
    ws['A1'] = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"
    ws['A1'].font = Font(name="Times New Roman", size=11, bold=True)
    ws['A1'].alignment = Alignment(horizontal='center', vertical='center')

    ws.merge_cells('A2:M2')
    ws['A2'] = "Độc lập - Tự do - Hạnh phúc"
    ws['A2'].font = Font(name="Times New Roman", size=11, bold=True)
    ws['A2'].alignment = Alignment(horizontal='center', vertical='center')

    # 2. Document Title
    ws.merge_cells('A4:M4')
    ws['A4'] = "BẢNG KÊ THEO DÕI & LỊCH SỬ TIẾP NHẬN XỬ LÝ SỰ CỐ KHẨN CẤP (SOS)"
    ws['A4'].font = FONT_TITLE
    ws['A4'].alignment = Alignment(horizontal='center', vertical='center')

    ws.merge_cells('A5:M5')
    ws['A5'] = "Hệ Thống Điều Phối Cứu Hộ & Chỉ Huy Tác Chiến Quốc Gia 2026 (34 Tỉnh Thành)"
    ws['A5'].font = FONT_SUBTITLE
    ws['A5'].alignment = Alignment(horizontal='center', vertical='center')

    ws.merge_cells('A6:M6')
    ws['A6'] = f"Thời gian xuất: {generated_at} | Cán bộ xuất báo cáo: {officer_name} | Tổng số ca lưu trữ: {len(incidents)} ca"
    ws['A6'].font = Font(name="Times New Roman", size=10, italic=True, color="0284C7")
    ws['A6'].alignment = Alignment(horizontal='center', vertical='center')

    # 3. Optimized 13 Table Column Headers
    headers = [
        ("STT", 6, 'center'),
        ("Mã Sự Cố", 18, 'center'),
        ("Thời Gian Tiếp Nhận", 18, 'center'),
        ("Thời Gian Hoàn Tất", 20, 'center'),
        ("Lực Lượng", 16, 'center'),
        ("Loại Sự Cố / Yêu Cầu", 24, 'left'),
        ("Người Dân Báo & SĐT", 26, 'left'),
        ("Địa Chỉ Sự Cố Hiện Trường", 46, 'left'),
        ("Xã/Phường - Tỉnh/TP", 24, 'left'),
        ("Tọa Độ GPS (Lat, Lng)", 20, 'center'),
        ("Đơn Vị Trực Ban Xử Lý", 26, 'left'),
        ("Cán Bộ & SĐT Trực Ban", 28, 'left'),
        ("Chữ Ký & Kết Quả Xử Lý", 32, 'left')
    ]

    header_row = 8
    for col_idx, (header_text, _, align) in enumerate(headers, start=1):
        cell = ws.cell(row=header_row, column=col_idx, value=header_text)
        cell.font = FONT_HEADER
        cell.fill = NAVY_HEADER_FILL
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = THIN_BORDER

    ws.row_dimensions[header_row].height = 28

    # 4. Data Rows
    current_row = header_row + 1
    for idx, inc in enumerate(incidents, start=1):
        created_dt_str = format_datetime(inc.get('createdAt'))
        resolved_dt_str = format_datetime(inc.get('resolvedAt') or inc.get('updatedAt'))
        
        # Duration
        duration_minutes = "—"
        if inc.get('createdAt') and (inc.get('resolvedAt') or inc.get('updatedAt')):
            try:
                t1 = datetime.fromisoformat(inc.get('createdAt').replace('Z', '+00:00'))
                t2 = datetime.fromisoformat((inc.get('resolvedAt') or inc.get('updatedAt')).replace('Z', '+00:00'))
                mins = max(1, int((t2 - t1).total_seconds() / 60))
                duration_minutes = f"{mins} phút"
            except Exception:
                duration_minutes = "—"

        is_signed = inc.get('signatures', {}).get('isFullySigned', False)
        signed_text = "ĐÃ KÝ ĐỦ 2 BÊN" if is_signed else "Chưa ký biên bản"

        # Resolved + Duration combined
        if resolved_dt_str and duration_minutes != "—":
            resolved_display = f"{resolved_dt_str}\n({duration_minutes})"
        else:
            resolved_display = resolved_dt_str or "—"

        # Citizen + Phone combined (unmasked internal record)
        rep_name = strip_emojis(inc.get('reporterName') or 'Người dân').strip()
        rep_phone = unmask_phone(inc.get('reporterPhone') or '')
        if rep_phone and rep_phone != '—':
            citizen_display = f"{rep_name}\nSĐT: {rep_phone}"
        else:
            citizen_display = rep_name

        # Address + Google Maps Link
        raw_address = strip_emojis(inc.get('address') or '').strip()
        lat = inc.get('lat')
        lng = inc.get('lng')
        if not raw_address:
            if lat and lng:
                address_display = f"Hiện trường: [{lat:.5f}, {lng:.5f}]"
            else:
                address_display = "Vị trí đã định vị trên bản đồ"
        else:
            address_display = raw_address

        maps_url = None
        if lat and lng:
            maps_url = f"https://www.google.com/maps?q={lat},{lng}"
        elif raw_address and raw_address != "Vị trí đã định vị trên bản đồ":
            maps_url = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(raw_address)}"

        # Ward & Province combined
        ward = strip_emojis((inc.get('jurisdiction') or {}).get('ward', '') or inc.get('ward', '')).strip()
        province = strip_emojis((inc.get('jurisdiction') or {}).get('province', '') or inc.get('province', '')).strip()
        if ward and province:
            area_display = f"{ward}, {province}"
        else:
            area_display = ward or province or '—'

        # Duty Officer & Phone combined
        duty_officer = strip_emojis(
            (inc.get('dispatchUnit') or {}).get('officerFullTitle') or 
            (inc.get('dispatchUnit') or {}).get('officerName') or 
            (inc.get('assignedUnit') or {}).get('officerFullTitle') or 
            (inc.get('assignedUnit') or {}).get('officerName') or 
            (inc.get('signatures') or {}).get('officer', {}).get('name') or 
            ''
        ).strip()
        if not duty_officer or duty_officer == 'Đang cập nhật':
            duty_officer = 'Cán bộ trực ban tác chiến'

        duty_phone = strip_emojis(
            (inc.get('dispatchUnit') or {}).get('phone') or 
            (inc.get('assignedUnit') or {}).get('phone') or 
            (inc.get('policeStation') or {}).get('phone') or 
            ''
        ).strip()
        if not duty_phone or duty_phone == 'Đang cập nhật':
            duty_phone = '0292 3899 113'

        duty_display = f"{duty_officer}\nSĐT: {duty_phone}"

        # Legal Signature & Resolution Note
        result_text = strip_emojis(inc.get('resolutionResult') or inc.get('resolutionNote') or inc.get('customNotes') or 'Đã tiếp nhận và xử lý hoàn tất an toàn.').strip()
        signature_and_result = f"[{signed_text}]\n{result_text}"

        row_values = [
            idx,
            strip_emojis(inc.get('id', '')),
            created_dt_str,
            resolved_display,
            format_agency(inc.get('agency')),
            strip_emojis(", ".join(inc.get('incidentTags', [])) if isinstance(inc.get('incidentTags'), list) else str(inc.get('incidentTags', ''))),
            citizen_display,
            address_display,
            area_display,
            f"{lat:.5f}, {lng:.5f}" if lat and lng else "—",
            strip_emojis((inc.get('dispatchUnit') or {}).get('unitName') or (inc.get('assignedUnit') or {}).get('name') or (inc.get('policeStation') or {}).get('name') or 'Công An Xã Thuận Hòa'),
            duty_display,
            signature_and_result
        ]

        fill = ZEBRA_FILL if idx % 2 == 0 else WHITE_FILL

        for col_idx, val in enumerate(row_values, start=1):
            cell = ws.cell(row=current_row, column=col_idx, value=val)
            cell.font = FONT_NORMAL
            cell.fill = fill
            cell.border = THIN_BORDER
            
            _, _, align_type = headers[col_idx - 1]
            cell.alignment = Alignment(horizontal=align_type, vertical='center', wrap_text=True)

            # Highlight ID
            if col_idx == 2:
                cell.font = Font(name="Times New Roman", size=10, bold=True, color="0284C7")
            # Highlight Address with Google Maps link
            elif col_idx == 8 and maps_url:
                cell.hyperlink = maps_url
                cell.font = FONT_LINK
            # GPS Coordinate link
            elif col_idx == 10 and lat and lng:
                cell.hyperlink = f"https://www.google.com/maps?q={lat},{lng}"
                cell.font = FONT_LINK
            # Highlight Legal Signature
            elif col_idx == 13:
                if is_signed:
                    cell.font = Font(name="Times New Roman", size=10, color="059669")
                else:
                    cell.font = Font(name="Times New Roman", size=10, color="475569")

        # Row height for multi-line content
        ws.row_dimensions[current_row].height = 32
        current_row += 1

    # 5. Set column widths
    for col_idx, (_, width, _) in enumerate(headers, start=1):
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = width

    # 6. Summary Footer
    summary_row = current_row + 1
    ws.merge_cells(start_row=summary_row, start_column=1, end_row=summary_row, end_column=4)
    ws.cell(row=summary_row, column=1, value=f"TỔNG CỘNG: {len(incidents)} CA SỰ CỐ ĐÃ LƯU TRỮ").font = FONT_BOLD
    ws.cell(row=summary_row, column=1).alignment = Alignment(horizontal='left', vertical='center')

    # Save
    wb.save(output_path)
    print(f"Successfully generated Excel report at {output_path}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python generate_history_excel.py <input_json> <output_xlsx>")
        sys.exit(1)
    json_input = sys.argv[1]
    xlsx_output = sys.argv[2]
    generate_excel(json_input, xlsx_output)

