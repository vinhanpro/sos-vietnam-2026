# -*- coding: utf-8 -*-
import sys
import json
import os
import io
import re
import base64
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn

def set_cell_border_none(cell):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        el = OxmlElement(f'w:{edge}')
        el.set(qn('w:val'), 'nil')
        borders.append(el)
    tc_pr.append(borders)

def add_horizontal_shape_line(paragraph, width_cm=6.5, line_weight_pt=1.0):
    """Draw a solid horizontal line using Word DrawingML Preset Shape Line."""
    cx = int(width_cm * 360000)
    line_w = int(line_weight_pt * 12700)
    drawing_xml = (
        f'<w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        f'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        f'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        f'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'
        f'<w:drawing>'
        f'<wp:inline distT="0" distB="0" distL="0" distR="0">'
        f'<wp:extent cx="{cx}" cy="10000"/>'
        f'<wp:docPr id="101" name="LineShape"/>'
        f'<wp:cNvGraphicFramePr/>'
        f'<a:graphic>'
        f'<a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">'
        f'<wps:wsp>'
        f'<wps:cNvSpPr/>'
        f'<wps:spPr>'
        f'<a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="0"/></a:xfrm>'
        f'<a:prstGeom prst="line"><a:avLst/></a:prstGeom>'
        f'<a:ln w="{line_w}"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln>'
        f'</wps:spPr>'
        f'<wps:bodyPr/>'
        f'</wps:wsp>'
        f'</a:graphicData>'
        f'</a:graphic>'
        f'</wp:inline>'
        f'</w:drawing>'
        f'</w:r>'
    )
    paragraph._p.append(parse_xml(drawing_xml))

def get_agency_header(data):
    """
    Format official agency header according to Decree 30/2020/ND-CP:
    - Upper line: Superior agency (chữ in hoa, đứng, không đậm, cỡ 11-12pt)
    - Lower line: Issuing agency (chữ in hoa, đứng, ĐẬM, cỡ 11-12pt)
    Returns (upper_line, lower_line)
    """
    agency = (data.get('agency') or 'police').lower()
    province = (data.get('province') or '').strip()
    ward = (data.get('ward') or '').strip()
    unit_name = (data.get('unitName') or '').strip()
    is_escalated = data.get('isEscalated', False) or data.get('currentLevel') == 'province' or 'tuyến tỉnh' in unit_name.lower() or 'trụ sở' in unit_name.lower()

    if not province:
        addr = data.get('address') or data.get('incidentAddress') or data.get('unitAddress') or ''
        for p in ['Cần Thơ', 'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Bình Dương', 'Đồng Nai', 'An Giang', 'Vĩnh Long']:
            if p.lower() in addr.lower() or p.lower() in unit_name.lower():
                province = p
                break
    if not province:
        province = 'CẦN THƠ'

    p_clean = province.upper().replace('TP.', '').replace('TP ', '').replace('THÀNH PHỐ ', '').replace('TỈNH ', '').strip()
    is_city = any(c in p_clean for c in ['CẦN THƠ', 'HÀ NỘI', 'HỒ CHÍ MINH', 'ĐÀ NẴNG', 'HẢI PHÒNG', 'CAN THO', 'HA NOI', 'HO CHI MINH', 'DA NANG', 'HAI PHONG'])
    prov_title = f"TP. {p_clean}" if is_city else f"TỈNH {p_clean}"

    if agency == 'csgt':
        upper = f"CÔNG AN {prov_title}"
        lower = "PHÒNG CẢNH SÁT GIAO THÔNG"
        if unit_name and ('đội' in unit_name.lower() or 'trật tự' in unit_name.lower()):
            lower = unit_name.upper()
    elif agency in ['fire', '114']:
        upper = f"CÔNG AN {prov_title}"
        lower = "PHÒNG CẢNH SÁT PCCC & CNCH"
        if unit_name and 'đội' in unit_name.lower():
            lower = unit_name.upper()
    elif agency in ['hospital', '115', 'medical']:
        upper = f"SỞ Y TẾ {prov_title}"
        lower = "TRUNG TÂM CẤP CỨU 115"
        if unit_name and ('bệnh viện' in unit_name.lower() or 'ttyt' in unit_name.lower()):
            lower = unit_name.upper()
    elif agency in ['traffic-rescue', 'rescue']:
        upper = f"BAN AN TOÀN GIAO THÔNG {prov_title}"
        lower = "TRUNG TÂM CỨU HỘ GIAO THÔNG"
    else:
        if is_escalated:
            upper = "BỘ CÔNG AN"
            lower = f"CÔNG AN {prov_title}"
        else:
            upper = f"CÔNG AN {prov_title}"
            if ward:
                w_clean = ward.upper()
                if not w_clean.startswith('PHƯỜNG') and not w_clean.startswith('XÃ') and not w_clean.startswith('THỊ TRẤN'):
                    w_clean = f"PHƯỜNG {w_clean}"
                lower = f"CÔNG AN {w_clean}"
            elif unit_name and 'công an' in unit_name.lower():
                lower = unit_name.upper().replace('(TRỤ SỞ CHÍNH)', '').strip()
            else:
                lower = f"CÔNG AN KHU VỰC {prov_title}"

    return upper, lower

PROVINCES_VIETNAM = [
    'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh',
    'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau',
    'Cần Thơ', 'Cao Bằng', 'Đà Nẵng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên',
    'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Nội',
    'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên',
    'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn',
    'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận',
    'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh',
    'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
    'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'TP. Hồ Chí Minh', 'Hồ Chí Minh',
    'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
]


def format_doc_date_location(data):
    """Format '{Location}, ngày DD tháng MM năm YYYY' according to Decree 30/2020/ND-CP."""
    import re
    from datetime import datetime
    # 1. Location Detection
    prov = (data.get('province') or '').strip()
    if not prov and isinstance(data.get('jurisdiction'), dict):
        prov = (data['jurisdiction'].get('province') or '').strip()

    if not prov:
        search_text = ' '.join([
            str(data.get('address') or ''),
            str(data.get('incidentAddress') or ''),
            str(data.get('unitAddress') or ''),
            str(data.get('unitName') or ''),
            str(data.get('recordLocation') or '')
        ])
        for p in PROVINCES_VIETNAM:
            p_pattern = r'\b' + re.escape(p.lower()) + r'\b'
            if re.search(p_pattern, search_text.lower()):
                prov = p
                break

    if not prov:
        prov = 'Cần Thơ'

    prov_clean = prov.replace('Tỉnh ', '').replace('tỉnh ', '').replace('TP. ', '').replace('TP ', '').replace('Thành phố ', '').replace('thành phố ', '').strip()
    if prov_clean.lower() in ['hồ chí minh', 'tp. hồ chí minh', 'tp hồ chí minh']:
        prov_display = 'TP. Hồ Chí Minh'
    elif prov_clean.lower() == 'hà nội':
        prov_display = 'Hà Nội'
    elif prov_clean.lower() == 'cần thơ':
        prov_display = 'Cần Thơ'
    elif prov_clean.lower() == 'đà nẵng':
        prov_display = 'Đà Nẵng'
    elif prov_clean.lower() == 'hải phòng':
        prov_display = 'Hải Phòng'
    else:
        matched = next((p for p in PROVINCES_VIETNAM if p.lower() == prov_clean.lower()), prov_clean.title())
        prov_display = matched

    # 2. Date & Time Detection
    raw_time = data.get('incidentTime') or data.get('reportedTime') or data.get('createdAt') or data.get('flaggedAt') or data.get('recordTime')
    dt = None
    if isinstance(raw_time, (int, float)):
        try:
            ts = raw_time / 1000.0 if raw_time > 1e11 else raw_time
            dt = datetime.fromtimestamp(ts)
        except Exception:
            pass
    elif isinstance(raw_time, str) and raw_time.strip():
        s = raw_time.strip()
        # Check Vietnamese regex: "ngày DD tháng MM năm YYYY"
        vn_match = re.search(r'ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})', s, re.IGNORECASE)
        if vn_match:
            try:
                d_val, m_val, y_val = int(vn_match.group(1)), int(vn_match.group(2)), int(vn_match.group(3))
                dt = datetime(y_val, m_val, d_val)
            except Exception:
                pass

        if not dt:
            try:
                clean_iso = s.replace('Z', '+00:00')
                dt = datetime.fromisoformat(clean_iso)
            except Exception:
                pass
        if not dt:
            for fmt in (
                '%Y-%m-%d %H:%M:%S', '%d/%m/%Y %H:%M:%S', '%d/%m/%Y %H:%M',
                '%d-%m-%Y %H:%M:%S', '%d-%m-%Y %H:%M', '%H:%M:%S %d/%m/%Y',
                '%H:%M %d/%m/%Y', '%d/%m/%Y', '%Y-%m-%d'
            ):
                try:
                    dt = datetime.strptime(s.split('.')[0].split('+')[0].strip(), fmt)
                    break
                except Exception:
                    continue
    if not dt:
        dt = datetime.now()

    day_str = f"{dt.day:02d}"
    month_str = f"{dt.month:02d}"
    year_str = f"{dt.year}"

    return f"{prov_display}, ngày {day_str} tháng {month_str} năm {year_str}"

def strip_emojis(text):
    if not isinstance(text, str):
        return str(text or '')
    # Remove emoji characters
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags (iOS)
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "\U0001F900-\U0001F9FF"  # supplemental symbols
        "\U0001FA70-\U0001FAFF"
        "\U00002600-\U000026FF"  # misc symbols
        "]+", flags=re.UNICODE
    )
    cleaned = emoji_pattern.sub('', text)
    cleaned = cleaned.replace('✍️', '').replace('🚨', '').replace('🚒', '').replace('🚑', '').replace('🚓', '').replace('🛠️', '').replace('🟢', '').replace('✅', '').replace('⚠️', '')
    return cleaned.strip()

def generate_report(data, output_path):
    doc = Document()

    # Page Margins according to Decree 30/2020/ND-CP (Top: 20mm, Bottom: 20mm, Left: 30mm, Right: 15-20mm)
    for section in doc.sections:
        section.top_margin = Inches(0.79)     # 20mm
        section.bottom_margin = Inches(0.79)  # 20mm
        section.left_margin = Inches(0.98)    # 25mm
        section.right_margin = Inches(0.79)   # 20mm

    # Set normal style font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(0, 0, 0)

    # 1. Header Table (Decree 30/2020/ND-CP Standard)
    # Total printable width on A4 with 2.5cm left / 2.0cm right = 16.5cm
    # Left column: 7.2cm (guarantees CÔNG AN KHU VỰC TP. CẦN THƠ does NOT wrap), Right column: 9.3cm
    upper_agency, lower_agency = get_agency_header(data)

    header = doc.add_table(rows=1, cols=2)
    header.alignment = WD_TABLE_ALIGNMENT.CENTER
    header.autofit = False
    left, right = header.rows[0].cells
    left.width, right.width = Cm(7.2), Cm(9.3)
    for cell in (left, right):
        set_cell_border_none(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
        tcPr = cell._tc.get_or_add_tcPr()
        tcPr.append(parse_xml(r'<w:tcMar xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:left w:w="20" w:type="dxa"/><w:right w:w="20" w:type="dxa"/></w:tcMar>'))

    # Left cell: Superior Agency + Issuing Agency + Solid line + Doc Number
    p_up = left.paragraphs[0]
    p_up.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_up.paragraph_format.space_after = Pt(2)
    pPr_up = p_up._p.get_or_add_pPr()
    pPr_up.append(parse_xml(r'<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:noProof/><w:noWrap/></w:rPr>'))
    r = p_up.add_run(upper_agency)
    r.font.name = 'Times New Roman'
    r._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    r.font.size = Pt(10.5 if len(upper_agency) > 25 else 11)
    r.bold = False

    p_low = left.add_paragraph()
    p_low.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_low.paragraph_format.space_after = Pt(2)
    pPr_low = p_low._p.get_or_add_pPr()
    pPr_low.append(parse_xml(r'<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:noProof/><w:noWrap/></w:rPr>'))
    r = p_low.add_run(lower_agency)
    r.font.name = 'Times New Roman'
    r._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    r.font.size = Pt(10.5 if len(lower_agency) > 22 else 11)
    r.bold = True

    # Line under issuing agency: Decree 30 standard: length = 1/3 to 1/2 text width (around 4.0cm, centered)
    p_line_left = left.add_paragraph()
    p_line_left.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line_left.paragraph_format.space_after = Pt(4)
    add_horizontal_shape_line(p_line_left, width_cm=4.0, line_weight_pt=1.0)

    p_num = left.add_paragraph()
    p_num.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_num.paragraph_format.space_after = Pt(0)
    raw_num = strip_emojis(data.get('incidentId', 'SOS')).replace('#', '')
    if not raw_num or raw_num.upper() in ('SOS', 'SOS-FAKE'):
        raw_num = '...'
    r = p_num.add_run(f"Số: {raw_num}/PTN-SC")
    r.font.name = 'Times New Roman'
    r._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    r.font.size = Pt(11)
    r.bold = False

    # Right cell: National Motto + Solid Line
    p_nat = right.paragraphs[0]
    p_nat.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_nat.paragraph_format.space_after = Pt(2)
    pPr = p_nat._p.get_or_add_pPr()
    pPr.append(parse_xml(r'<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:noProof/><w:noWrap/></w:rPr>'))
    r_nat1 = p_nat.add_run('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')
    r_nat1.font.name = 'Times New Roman'
    r_nat1._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    r_nat1.font.size = Pt(12)
    r_nat1.bold = True

    p_motto = right.add_paragraph()
    p_motto.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_motto.paragraph_format.space_after = Pt(2)
    r_nat2 = p_motto.add_run('Độc lập - Tự do - Hạnh phúc')
    r_nat2.font.name = 'Times New Roman'
    r_nat2._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    r_nat2.font.size = Pt(12.5)
    r_nat2.bold = True

    p_line_right = right.add_paragraph()
    p_line_right.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line_right.paragraph_format.space_after = Pt(4)
    # Line under national motto: Decree 30 standard (around 4.5cm - 4.8cm, centered under motto)
    add_horizontal_shape_line(p_line_right, width_cm=4.8, line_weight_pt=1.0)

    p_date = right.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_date.paragraph_format.space_before = Pt(4)
    p_date.paragraph_format.space_after = Pt(2)
    date_loc_str = format_doc_date_location(data)
    r_date = p_date.add_run(date_loc_str)
    r_date.font.name = 'Times New Roman'
    r_date._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    r_date.font.size = Pt(12)
    r_date.italic = True

    # Header Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("PHIẾU THÔNG BÁO VÀ TIẾP NHẬN THÔNG TIN\nỨNG PHÓ SỰ CỐ KHẨN CẤP")
    run_title.bold = True
    run_title.font.size = Pt(14)
    run_title.font.name = 'Times New Roman'

    p_sos_id = doc.add_paragraph()
    p_sos_id.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sos_id.paragraph_format.space_after = Pt(12)
    r_id = p_sos_id.add_run(f"Mã tiếp nhận: #{strip_emojis(data.get('incidentId', 'SOS-XXXX'))} | Thời gian: {strip_emojis(data.get('incidentTime', ''))}")
    r_id.italic = True
    r_id.font.size = Pt(11)

    # Section A
    p_a = doc.add_paragraph()
    r_a = p_a.add_run("A. THÔNG TIN CHUNG (ĐƠN VỊ TIẾP NHẬN)")
    r_a.bold = True
    r_a.font.size = Pt(12)

    p_a1 = doc.add_paragraph()
    p_a1.paragraph_format.left_indent = Inches(0.2)
    p_a1.add_run("- Họ tên cán bộ tiếp nhận: ").bold = True
    p_a1.add_run(f"{strip_emojis(data.get('officerName', ''))} ({strip_emojis(data.get('officerTitle', 'Cán bộ trực ban'))})")

    p_a2 = doc.add_paragraph()
    p_a2.paragraph_format.left_indent = Inches(0.2)
    p_a2.add_run("- Địa chỉ cơ quan / Trụ sở công tác: ").bold = True
    p_a2.add_run(f"{strip_emojis(data.get('unitAddress', ''))}")

    # Agency checkboxes
    agency = data.get('agency', 'police')
    ward = strip_emojis(data.get('ward', ''))
    province = strip_emojis(data.get('province', ''))
    unit_name = strip_emojis(data.get('unitName', ''))
    is_escalated = data.get('isEscalated', False) or data.get('currentLevel') == 'province' or data.get('status') == 'escalated' or 'Tuyến Tỉnh' in unit_name or 'Trụ Sở' in unit_name

    if is_escalated and agency == 'police':
        police_area = f"{unit_name} (Tuyến Tỉnh/TP trực tiếp tiếp nhận & chỉ đạo điều phối)"
    else:
        police_area = f"{ward}, {province}" if (ward or province) else unit_name

    p_a_boxes = doc.add_paragraph()
    p_a_boxes.paragraph_format.left_indent = Inches(0.3)
    p_a_boxes.add_run(f"{'[X]' if agency == 'police' else '[ ]'} Công an khu vực / Đơn vị tiếp nhận: {police_area if agency == 'police' else ''}\n")
    p_a_boxes.add_run(f"{'[X]' if agency == 'csgt' else '[ ]'} CSGT: {unit_name if agency == 'csgt' else ''}\n")
    p_a_boxes.add_run(f"{'[X]' if agency == 'fire' else '[ ]'} PCCC và CNCH: {unit_name if agency == 'fire' else ''}")


    p_a3 = doc.add_paragraph()
    p_a3.paragraph_format.left_indent = Inches(0.2)
    p_a3.add_run("- Số điện thoại liên hệ trực ban: ").bold = True
    p_a3.add_run(f"{strip_emojis(data.get('unitPhone', ''))} | Đường dây khẩn cấp / SMS: {strip_emojis(data.get('unitSms', '0988 113 113'))}")

    # Section B
    p_b = doc.add_paragraph()
    r_b = p_b.add_run("B. THÔNG TIN ĐẾN (NGƯỜI BÁO & HIỆN TRƯỜNG SỰ CỐ)")
    r_b.bold = True
    r_b.font.size = Pt(12)

    p_b1 = doc.add_paragraph()
    p_b1.paragraph_format.left_indent = Inches(0.2)
    p_b1.add_run("- Tên người gọi / Người báo tin: ").bold = True
    p_b1.add_run(f"{strip_emojis(data.get('reporterName', 'Người dân'))}")

    p_b2 = doc.add_paragraph()
    p_b2.paragraph_format.left_indent = Inches(0.2)
    target_type = data.get('targetType', 'Người dân')
    p_b2.add_run(f"- Thuộc đối tượng: {'[X]' if target_type == 'Người dân' else '[ ]'} Người dân    {'[X]' if target_type == 'Nhân viên cơ sở' else '[ ]'} Nhân viên cơ sở    {'[X]' if target_type == 'Lực lượng ứng phó' else '[ ]'} Lực lượng ứng phó")

    p_b3 = doc.add_paragraph()
    p_b3.paragraph_format.left_indent = Inches(0.2)
    p_b3.add_run("- Số điện thoại người gọi: ").bold = True
    p_b3.add_run(f"{strip_emojis(data.get('reporterPhone', ''))}                    ")
    p_b3.add_run("Giờ gọi / Báo tin: ").bold = True
    p_b3.add_run(f"{strip_emojis(data.get('incidentTime', ''))}")

    p_b4 = doc.add_paragraph()
    p_b4.paragraph_format.left_indent = Inches(0.2)
    p_b4.add_run("- Vị trí xảy ra sự cố (Địa chỉ thực tế): ").bold = True
    p_b4.add_run(f"{strip_emojis(data.get('incidentAddress', ''))}")

    p_b5 = doc.add_paragraph()
    p_b5.paragraph_format.left_indent = Inches(0.2)
    p_b5.add_run("- Tọa độ định vị GPS: ").bold = True
    p_b5.add_run(f"{data.get('lat', '')}, {data.get('lng', '')}")

    p_b6 = doc.add_paragraph()
    p_b6.paragraph_format.left_indent = Inches(0.2)
    p_b6.add_run("- Đường dẫn vị trí Google Maps: ").bold = True
    gmaps_url = data.get('gmapsUrl', f"https://www.google.com/maps/search/?api=1&query={data.get('lat', '')},{data.get('lng', '')}")
    p_b6.add_run(f"{gmaps_url}")

    p_b7 = doc.add_paragraph()
    p_b7.paragraph_format.left_indent = Inches(0.2)
    p_b7.add_run("- Loại sự cố & Mô tả chi tiết: ").bold = True
    p_b7.add_run(f"{strip_emojis(data.get('incidentTags', ''))} - {strip_emojis(data.get('incidentDescription', 'Cần hỗ trợ khẩn cấp tại hiện trường.'))}")

    p_b8 = doc.add_paragraph()
    p_b8.paragraph_format.left_indent = Inches(0.2)
    p_b8.add_run("- Có ảnh hưởng tới người dân: ").bold = True
    p_b8.add_run("[X] Có      [ ] Không")

    p_b9 = doc.add_paragraph()
    p_b9.paragraph_format.left_indent = Inches(0.2)
    p_b9.add_run("- Tình huống có yêu cầu trợ giúp: ").bold = True
    p_b9.add_run("[X] Có      [ ] Không")

    p_b10 = doc.add_paragraph()
    p_b10.paragraph_format.left_indent = Inches(0.2)
    p_b10.add_run("- Yêu cầu trợ giúp cụ thể: ").bold = True
    p_b10.add_run(f"{strip_emojis(data.get('helpRequest', 'Điều động lực lượng phản ứng nhanh và phương tiện cứu nạn tiếp cận hiện trường.'))}")

    p_b11 = doc.add_paragraph()
    p_b11.paragraph_format.left_indent = Inches(0.2)
    p_b11.add_run("- Lời khuyên / Khuyến cáo đã hướng dẫn cho người dân qua điện thoại / Trực tuyến:\n").bold = True
    p_b11.add_run(f"{strip_emojis(data.get('adviceGiven', 'Giữ bình tĩnh, di chuyển đến vị trí an toàn, quan sát môi trường xung quanh, duy trì kết nối điện thoại và định vị GPS để lực lượng tiếp cận nhanh nhất.'))}")

    p_b12 = doc.add_paragraph()
    p_b12.paragraph_format.left_indent = Inches(0.2)
    p_b12.add_run("- Xác minh cuộc gọi / Tín hiệu: ").bold = True
    p_b12.add_run("[X] Đã xác minh chính xác qua GPS & Kênh trực ban")

    p_b13 = doc.add_paragraph()
    p_b13.paragraph_format.left_indent = Inches(0.2)
    p_b13.add_run("- Kết quả xử lý: ").bold = True
    p_b13.add_run(f"[X] {strip_emojis(data.get('resolutionResult', 'Đã tiếp cận, xử lý an toàn hoàn tất và hỗ trợ người dân kịp thời.'))}")

    # Embed attached photos if present
    media_list = data.get('media', [])
    if media_list:
        p_c = doc.add_paragraph()
        p_c.add_run("C. HÌNH ẢNH / TÀI LIỆU HIỆN TRƯỜNG ĐÍNH KÈM:").bold = True
        for idx, item in enumerate(media_list):
            data_url = item.get('dataUrl', '')
            if data_url and 'base64,' in data_url:
                try:
                    img_data = base64.b64decode(data_url.split('base64,')[1])
                    image_stream = io.BytesIO(img_data)
                    doc.add_picture(image_stream, width=Inches(3.2))
                    p_img = doc.add_paragraph()
                    p_img.paragraph_format.left_indent = Inches(0.2)
                    r_caption = p_img.add_run(f"Hình {idx+1}: {strip_emojis(item.get('name', 'Ảnh hiện trường'))}")
                    r_caption.italic = True
                    r_caption.font.size = Pt(10)
                except Exception as e:
                    pass

    # Signatures table
    doc.add_paragraph()
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell_left = table.cell(0, 0)
    cell_right = table.cell(0, 1)
    cell_left.width = Inches(3.2)
    cell_right.width = Inches(3.2)

    # Citizen Signature
    p_left = cell_left.paragraphs[0]
    p_left.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_l1 = p_left.add_run("NGƯỜI BÁO TIN / NGƯỜI DÂN\n")
    r_l1.bold = True
    r_l2 = p_left.add_run("(Ký, ghi rõ họ tên)\n")
    r_l2.italic = True

    citizen_sig = data.get('citizenSignature', {})
    if citizen_sig and citizen_sig.get('signatureData'):
        sig_data = citizen_sig.get('signatureData', '')
        if 'base64,' in sig_data:
            try:
                sig_bytes = base64.b64decode(sig_data.split('base64,')[1])
                p_left.add_run().add_picture(io.BytesIO(sig_bytes), width=Inches(1.8))
                p_left.add_run("\n")
            except Exception as e:
                p_left.add_run("\n\n")
        else:
            r_sig_txt = p_left.add_run(f"(Chữ ký điện tử: {strip_emojis(sig_data)})\n")
            r_sig_txt.italic = True
            r_sig_txt.bold = True
            r_sig_txt.font.color.rgb = RGBColor(30, 58, 138)
    else:
        p_left.add_run("\n\n\n")

    r_l3 = p_left.add_run(f"{strip_emojis(data.get('reporterName', 'Người dân'))}")
    r_l3.bold = True
    if citizen_sig.get('signedAt'):
        r_l_time = p_left.add_run(f"\nThời gian ký: {strip_emojis(citizen_sig.get('signedAt'))}")
        r_l_time.font.size = Pt(9)
        r_l_time.italic = True

    # Officer Signature
    p_right = cell_right.paragraphs[0]
    p_right.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_r1 = p_right.add_run("CÁN BỘ / CHỈ HUY TIẾP NHẬN\n")
    r_r1.bold = True
    r_r2 = p_right.add_run("(Ký, đóng dấu và ghi rõ họ tên)\n")
    r_r2.italic = True

    officer_sig = data.get('officerSignature', {})
    if officer_sig and officer_sig.get('signatureData'):
        sig_data = officer_sig.get('signatureData', '')
        if 'base64,' in sig_data:
            try:
                sig_bytes = base64.b64decode(sig_data.split('base64,')[1])
                p_right.add_run().add_picture(io.BytesIO(sig_bytes), width=Inches(1.8))
                p_right.add_run("\n")
            except Exception as e:
                p_right.add_run("\n\n")
        else:
            r_sig_txt = p_right.add_run(f"(Chữ ký điện tử: {strip_emojis(sig_data)})\n")
            r_sig_txt.italic = True
            r_sig_txt.bold = True
            r_sig_txt.font.color.rgb = RGBColor(30, 58, 138)
    else:
        p_right.add_run("\n\n\n")

    r_r3 = p_right.add_run(f"{strip_emojis(data.get('officerName', 'Cán bộ trực ban'))}")
    r_r3.bold = True
    if officer_sig.get('signedAt'):
        r_r_time = p_right.add_run(f"\nThời gian ký: {strip_emojis(officer_sig.get('signedAt'))}")
        r_r_time.font.size = Pt(9)
        r_r_time.italic = True

    doc.save(output_path)
    print(f"Generated DOCX report successfully at {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate_report_docx.py <input_json_path> <output_docx_path>")
        sys.exit(1)

    input_json = sys.argv[1]
    output_docx = sys.argv[2]

    with open(input_json, 'r', encoding='utf-8') as f:
        payload = json.load(f)

    generate_report(payload, output_docx)
