# -*- coding: utf-8 -*-
"""Build an A4 administrative verification-record draft for an SOS case."""
import json
import sys
from datetime import datetime
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor, Inches


def value(data, key, fallback='Chưa xác định'):
    raw = data.get(key, fallback)
    return str(raw).strip() if raw is not None and str(raw).strip() else fallback


def set_font(run, size=13, bold=False, italic=False):
    run.font.name = 'Times New Roman'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(0, 0, 0)


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
        for p in ['Cần Thơ', 'Hà Nội', 'Hồ Chí Minh', 'Đà NẴng', 'Hải Phòng', 'Bình Dương', 'Đồng Nai', 'An Giang', 'Vĩnh Long']:
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


def add_para(doc, text='', bold_prefix=None, indent=0, space_after=4, align=None):
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(indent) if indent else None
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if align is not None:
        p.alignment = align
    if bold_prefix and text.startswith(bold_prefix):
        r = p.add_run(bold_prefix)
        set_font(r, bold=True)
        r = p.add_run(text[len(bold_prefix):])
        set_font(r)
    else:
        r = p.add_run(text)
        set_font(r)
    return p


def build(data, output_path):
    doc = Document()
    section = doc.sections[0]
    section.page_width, section.page_height = Cm(21), Cm(29.7)
    section.top_margin = Cm(1.8)
    section.bottom_margin = Cm(1.5)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.0)

    normal = doc.styles['Normal']
    normal.font.name = 'Times New Roman'
    normal._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    normal.font.size = Pt(13)

    # 1. Header Table (Decree 30/2020/ND-CP Standard)
    # Total printable width on A4 with 3cm left / 2cm right = 16.0cm (expandable to 16.5cm)
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
    set_font(r, 10.5 if len(upper_agency) > 25 else 11, bold=False)

    p_low = left.add_paragraph()
    p_low.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_low.paragraph_format.space_after = Pt(2)
    pPr_low = p_low._p.get_or_add_pPr()
    pPr_low.append(parse_xml(r'<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:noProof/><w:noWrap/></w:rPr>'))
    r = p_low.add_run(lower_agency)
    set_font(r, 10.5 if len(lower_agency) > 22 else 11, bold=True)

    # Line under issuing agency: Decree 30 standard: length = 1/3 to 1/2 text width (around 4.0cm, centered)
    p_line_left = left.add_paragraph()
    p_line_left.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line_left.paragraph_format.space_after = Pt(4)
    add_horizontal_shape_line(p_line_left, width_cm=4.0, line_weight_pt=1.0)

    p_num = left.add_paragraph()
    p_num.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_num.paragraph_format.space_after = Pt(0)
    rec_num = value(data, 'recordNumber', '...').replace('/BB-XM', '')
    r = p_num.add_run(f"Số: {rec_num}/BB-XM")
    set_font(r, 11, bold=False)

    # Right cell: National Motto + Solid Line
    p_nat = right.paragraphs[0]
    p_nat.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_nat.paragraph_format.space_after = Pt(2)
    pPr = p_nat._p.get_or_add_pPr()
    pPr.append(parse_xml(r'<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:noProof/><w:noWrap/></w:rPr>'))
    r_nat1 = p_nat.add_run('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')
    set_font(r_nat1, 12, bold=True)

    p_motto = right.add_paragraph()
    p_motto.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_motto.paragraph_format.space_after = Pt(2)
    r_nat2 = p_motto.add_run('Độc lập - Tự do - Hạnh phúc')
    set_font(r_nat2, 12.5, bold=True)

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
    set_font(r_date, 12, italic=True)

    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('BIÊN BẢN GHI NHẬN VÀ XÁC MINH\nTHÔNG TIN BÁO SỰ CỐ'); set_font(r, 13, True)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    raw_inc_id = str(value(data, 'incidentId', value(data, 'id', ''))).strip()
    if raw_inc_id and raw_inc_id.upper() not in ('SOS', 'SOS-FAKE', '...'):
        inc_code_display = f"#{raw_inc_id.lstrip('#')}"
    else:
        inc_code_display = '#SOS-XXXX'
    r = p.add_run(f"(Mã hồ sơ: {inc_code_display})"); set_font(r, 12, italic=True)
    p.paragraph_format.space_after = Pt(6)

    now = datetime.now().strftime('%H giờ %M phút, ngày %d tháng %m năm %Y')
    add_para(doc, f"Hôm nay, vào hồi {value(data, 'recordTime', now)}, tại {value(data, 'recordLocation', 'địa điểm xử lý hồ sơ')}, chúng tôi gồm:", indent=1, space_after=3)
    add_para(doc, f"1. Cán bộ lập biên bản: {value(data, 'officerName')}; chức vụ: {value(data, 'officerTitle', 'Cán bộ xử lý') }.", indent=1, space_after=3)
    add_para(doc, "2. Người tham gia xác minh: ........................................................................................................", indent=1, space_after=4)

    for heading in ('I. THÔNG TIN VỤ VIỆC', 'II. NỘI DUNG GHI NHẬN VÀ TÀI LIỆU KÈM THEO', 'III. NHẬN ĐỊNH BAN ĐẦU', 'IV. Ý KIẾN CỦA NGƯỜI LIÊN QUAN'):
        p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(4); p.paragraph_format.space_after = Pt(2)
        r = p.add_run(heading); set_font(r, 12.5, True)
        if heading == 'I. THÔNG TIN VỤ VIỆC':
            add_para(doc, f"- Người khai báo: {value(data, 'reporterName')}; liên hệ: {value(data, 'reporterPhone')}.", indent=0.5, space_after=2)
            add_para(doc, f"- Địa điểm/thông tin được khai báo: {value(data, 'address')}.", indent=0.5, space_after=2)
            add_para(doc, f"- Thời điểm tiếp nhận: {value(data, 'reportedTime')}.", indent=0.5, space_after=2)
        elif heading == 'II. NỘI DUNG GHI NHẬN VÀ TÀI LIỆU KÈM THEO':
            add_para(doc, f"- Kết quả xác minh ban đầu: {value(data, 'reason', 'Cần xác minh thêm')}.", indent=0.5, space_after=2)
            add_para(doc, f"- Ghi chú của cán bộ: {value(data, 'officerNotes', 'Không có')}.", indent=0.5, space_after=2)
            add_para(doc, f"- Dữ liệu kỹ thuật do hệ thống ghi nhận: IP {value(data, 'clientIp', 'Không có')}; thiết bị tự khai báo {value(data, 'platform', 'Không được cung cấp')}.", indent=0.5, space_after=2)
        elif heading == 'III. NHẬN ĐỊNH BAN ĐẦU':
            add_para(doc, 'Dữ liệu kỹ thuật chỉ là manh mối phục vụ xác minh, không tự xác định danh tính hoặc trách nhiệm pháp lý.', indent=0.5, space_after=2)
            add_para(doc, 'Việc xem xét hành vi báo tin giả hoặc không đúng sự thật thực hiện theo điểm c khoản 2 Điều 7 Nghị định 144/2021/NĐ-CP, đúng thẩm quyền và trình tự pháp luật.', indent=0.5, space_after=2)
        else:
            add_para(doc, '........................................................................................................................................', indent=0.5, space_after=2)
            add_para(doc, '........................................................................................................................................', indent=0.5, space_after=2)

    add_para(doc, 'Biên bản được lập thành .... bản, đã đọc lại cho những người có tên trên cùng nghe và ký xác nhận.', indent=1, space_after=8)
    signs = doc.add_table(rows=1, cols=2)
    signs.alignment = WD_TABLE_ALIGNMENT.CENTER
    signs.autofit = False
    trPr = signs.rows[0]._tr.get_or_add_trPr()
    trPr.append(parse_xml(r'<w:cantSplit xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))
    for cell in signs.rows[0].cells:
        set_cell_border_none(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
    signs.cell(0, 0).width = Cm(8.0)
    signs.cell(0, 1).width = Cm(8.0)

    p0 = signs.cell(0, 0).paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_after = Pt(2)
    pPr0 = p0._p.get_or_add_pPr()
    pPr0.append(parse_xml(r'<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:noProof/><w:noWrap/></w:rPr>'))
    r0_title = p0.add_run('NGƯỜI LẬP BIÊN BẢN\n')
    set_font(r0_title, 12, True)
    r0_sub = p0.add_run('(Ký, ghi rõ họ tên)\n\n\n')
    set_font(r0_sub, 11, False, italic=True)
    if value(data, 'officerName') and value(data, 'officerName') != 'Chưa xác định':
        r0_name = p0.add_run(value(data, 'officerName'))
        set_font(r0_name, 12, True)

    p1 = signs.cell(0, 1).paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.paragraph_format.space_after = Pt(2)
    pPr1 = p1._p.get_or_add_pPr()
    pPr1.append(parse_xml(r'<w:rPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:noProof/><w:noWrap/></w:rPr>'))
    r1_title = p1.add_run('NGƯỜI LIÊN QUAN\n')
    set_font(r1_title, 12, True)
    r1_sub = p1.add_run('(Ký, ghi rõ họ tên)\n\n\n')
    set_font(r1_sub, 11, False, italic=True)
    if value(data, 'reporterName') and value(data, 'reporterName') not in ('Chưa xác định', 'Không có'):
        r1_name = p1.add_run(value(data, 'reporterName'))
        set_font(r1_name, 12, True)
    doc.save(output_path)


if __name__ == '__main__':
    with open(sys.argv[1], encoding='utf-8') as handle:
        build(json.load(handle), sys.argv[2])
