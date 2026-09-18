# -*- coding: utf-8 -*-
"""
generate_project_dossier_docx.py
Tạo tài liệu Word toàn diện: "HỒ SƠ MÔ TẢ DỰ ÁN, HƯỚNG DẪN SỬ DỤNG VÀ QUY TRÌNH VẬN HÀNH SOS VIỆT NAM 2026"
Tiêu chuẩn: Nghị định 30/2020/NĐ-CP & Thẩm mỹ kỹ thuật số hiện đại.
"""

import sys
import os
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_dossier():
    doc = Document()

    # Cấu hình lề trang chuẩn A4 (Nghị định 30/2020/NĐ-CP: Trên 2cm, Dưới 2cm, Trái 3cm, Phải 2cm)
    for section in doc.sections:
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(3.0)
        section.right_margin = Cm(2.0)
        section.page_width = Cm(21.0)
        section.page_height = Cm(29.7)
        
        # Header & Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("SOS VIỆT NAM 2026 — TÀI LIỆU VẬN HÀNH CHỈ HUY TÁC CHIẾN C4ISR")
        hrun.font.name = "Times New Roman"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(120, 144, 156)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Mật mã vận hành nội bộ • Lưu hành theo thẩm quyền • Năm 2026")
        frun.font.name = "Times New Roman"
        frun.font.size = Pt(8.5)
        frun.font.italic = True
        frun.font.color.rgb = RGBColor(148, 163, 184)

    # Style mặc định
    style_normal = doc.styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Times New Roman'
    font_normal.size = Pt(11)
    font_normal.color.rgb = RGBColor(30, 41, 59)

    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

    def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_cell_border_light(cell):
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'<w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'<w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)

    def add_callout(text, title="LƯU Ý NGHIỆP VỤ:", border_color="0284C7", bg_color="F0F9FF"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=160, bottom=160, left=240, right=200)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="none"/>'
            f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
            f'<w:bottom w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        r_title = p.add_run(f"📌 {title} ")
        r_title.bold = True
        r_title.font.name = "Times New Roman"
        r_title.font.size = Pt(10.5)
        r_title.font.color.rgb = RGBColor(2, 132, 199) if border_color=="0284C7" else RGBColor(185, 28, 28)
        
        r_text = p.add_run(text)
        r_text.font.name = "Times New Roman"
        r_text.font.size = Pt(10.5)
        r_text.font.italic = True
        doc.add_paragraph().paragraph_format.space_after = Pt(2)

    # =========================================================================
    # TRANG BÌA & TIÊU ĐỀ QUỐC GIA (COVER & ADMINISTRATIVE HEADER)
    # =========================================================================
    
    # Header Quốc hiệu theo NĐ 30/2020/NĐ-CP
    table_hdr = doc.add_table(rows=1, cols=2)
    table_hdr.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_hdr.autofit = False
    
    cell_l = table_hdr.cell(0, 0)
    cell_r = table_hdr.cell(0, 1)
    cell_l.width = Cm(8.0)
    cell_r.width = Cm(8.0)

    # Cơ quan ban hành
    p_org = cell_l.paragraphs[0]
    p_org.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p_org.add_run("BỘ CÔNG AN\n")
    r1.bold = False
    r1.font.size = Pt(11)
    r2 = p_org.add_run("TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA\n")
    r2.bold = True
    r2.font.size = Pt(10.5)
    r3 = p_org.add_run("HỆ THỐNG ĐIỀU PHỐI SOS 2026")
    r3.bold = False
    r3.font.size = Pt(10)
    
    # Quốc hiệu - Tiêu ngữ
    p_nat = cell_r.paragraphs[0]
    p_nat.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rn1 = p_nat.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n")
    rn1.bold = True
    rn1.font.size = Pt(11)
    rn2 = p_nat.add_run("Độc lập - Tự do - Hạnh phúc\n")
    rn2.bold = True
    rn2.font.size = Pt(11.5)
    rn3 = p_nat.add_run("───────────")
    rn3.bold = True
    rn3.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Logo trung tâm (nếu có)
    logo_path = os.path.join(os.getcwd(), 'assets', 'icons', 'khien.png')
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(6)
        p_logo.paragraph_format.space_after = Pt(12)
        p_logo.add_run().add_picture(logo_path, width=Inches(1.2))

    # Tên tài liệu chính thức
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(4)
    run_main_title = p_title.add_run("TÀI LIỆU MÔ TẢ KIẾN TRÚC DỰ ÁN,\nHƯỚNG DẪN SỬ DỤNG VÀ QUY TRÌNH VẬN HÀNH\nHỆ THỐNG CỨU HỘ & TÁC CHIẾN SOS VIỆT NAM 2026")
    run_main_title.bold = True
    run_main_title.font.size = Pt(16)
    run_main_title.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(16)
    run_sub = p_sub.add_run("Hạ Tầng Điều Phối Đa Lực Lượng Liên Ngành (Công An • CSGT • PCCC • Y Tế 115 • Cứu Hộ Giao Thông)\nBản Đồ Hành Chính Số 34 Tỉnh Thành Mới — Đáp Ứng Nghị Định 30/2020/NĐ-CP & Nghị Định 13/2023/NĐ-CP")
    run_sub.font.size = Pt(10.5)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Khung tóm tắt thông tin phát hành
    table_meta = doc.add_table(rows=4, cols=2)
    table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_meta.autofit = False
    meta_widths = [Cm(5.0), Cm(11.0)]
    meta_rows = [
        ("Cơ quan chủ quản & Thiết kế:", "Trung Tâm Chỉ Huy Tác Chiến Quốc Gia • Dự Án SOS Việt Nam 2026"),
        ("Phiên bản hệ thống:", "v2026.09 (Bản chuẩn hóa địa giới 34 Tỉnh Thành — Giao diện C4ISR V4)"),
        ("Phạm vi triển khai:", "Toàn quốc (3.321 Đơn vị cơ sở — 2.628 Phường Xã mới sau sáp nhập)"),
        ("Ngày phát hành & Hiệu lực:", "17/09/2026 • Ban hành chính thức phục vụ trực ban 24/7")
    ]
    for idx, (label, val) in enumerate(meta_rows):
        r = table_meta.rows[idx]
        cell_a = r.cells[0]
        cell_b = r.cells[1]
        cell_a.width = meta_widths[0]
        cell_b.width = meta_widths[1]
        set_cell_background(cell_a, "F8FAFC")
        set_cell_background(cell_b, "FFFFFF")
        set_cell_margins(cell_a, top=100, bottom=100, left=140, right=140)
        set_cell_margins(cell_b, top=100, bottom=100, left=140, right=140)
        set_cell_border_light(cell_a)
        set_cell_border_light(cell_b)
        
        pa = cell_a.paragraphs[0]
        pa.paragraph_format.space_after = Pt(1)
        ra = pa.add_run(label)
        ra.bold = True
        ra.font.size = Pt(10)
        
        pb = cell_b.paragraphs[0]
        pb.paragraph_format.space_after = Pt(1)
        rb = pb.add_run(val)
        rb.font.size = Pt(10)

    doc.add_page_break()

    # =========================================================================
    # MỤC LỤC TỔNG QUAN (TABLE OF CONTENTS)
    # =========================================================================
    p_toc_title = doc.add_paragraph()
    p_toc_title.paragraph_format.space_before = Pt(8)
    p_toc_title.paragraph_format.space_after = Pt(10)
    r_toc = p_toc_title.add_run("MỤC LỤC TỔNG QUAN")
    r_toc.bold = True
    r_toc.font.size = Pt(14)
    r_toc.font.color.rgb = RGBColor(15, 23, 42)

    toc_items = [
        ("PHẦN 1: BỐI CẢNH, TẦM NHÌN VÀ MÔ TẢ TỔNG QUAN DỰ ÁN", "Trang 3"),
        ("    1.1. Bối cảnh cấp thiết và nghịch lý trong cứu hộ truyền thống", "Trang 3"),
        ("    1.2. Mục tiêu chiến lược và triết lý thiết kế hai phân hệ", "Trang 4"),
        ("    1.3. Ma trận điều phối 5 lực lượng phản ứng nhanh liên ngành", "Trang 4"),
        ("    1.4. Đột phá bản đồ địa giới số 34 tỉnh thành mới năm 2026", "Trang 5"),
        ("PHẦN 2: HƯỚNG DẪN SỬ DỤNG CHI TIẾT TỪNG PHÂN HỆ", "Trang 6"),
        ("    2.1. Cổng tiếp nhận khẩn cấp dành cho Người Dân (Citizen SOS)", "Trang 6"),
        ("    2.2. Bảng điều khiển tác chiến dành cho Cán Bộ Trực Ban (Dispatcher)", "Trang 8"),
        ("    2.3. Quy trình xác thực bảo vệ an ninh hai tầng (Cyber Shield)", "Trang 10"),
        ("PHẦN 3: QUY TRÌNH VẬN HÀNH & VÒNG ĐỜI XỬ LÝ SỰ CỐ (LIFECYCLE)", "Trang 11"),
        ("    3.1. Giai đoạn 1: Tiếp nhận và đối soát địa giới số thời gian thực", "Trang 11"),
        ("    3.2. Giai đoạn 2: Điều động lực lượng, xuất kích và bám đuổi lộ trình", "Trang 12"),
        ("    3.3. Giai đoạn 3: Đàm thoại hai chiều, chi viện và tác chiến hiện trường", "Trang 13"),
        ("    3.4. Giai đoạn 4: Nghiệm thu, ký duyệt số và kết xuất biên bản NĐ 30", "Trang 14"),
        ("    3.5. Giai đoạn 5: Tự hủy dữ liệu nhạy cảm 24h và bảo mật thông tin", "Trang 15"),
        ("PHẦN 4: HỆ THỐNG CÔNG NGHỆ CHUYÊN SÂU & AN NINH MẠNG", "Trang 16"),
        ("    4.1. Lá chắn phòng thủ Cyber Shield và chống quấy rối phá hoại", "Trang 16"),
        ("    4.2. Cơ chế giám sát dấu vết OSINT Telemetry phát hiện báo khống", "Trang 17"),
        ("    4.3. Kiến trúc nén video thông minh và tối ưu đường truyền yếu", "Trang 18"),
        ("PHẦN 5: PHỤ LỤC NGHIỆP VỤ & BẢNG TRA CỨU ĐIỀU HÀNH", "Trang 19"),
        ("    Phụ lục A: Danh mục phân loại mã nghiệp vụ sự cố 5 lực lượng", "Trang 19"),
        ("    Phụ lục B: Bảng phân vùng và đầu mối chỉ huy 34 tỉnh thành 2026", "Trang 20"),
        ("    Phụ lục C: Mẫu biên bản xác minh hiện trường chuẩn Nghị định 30", "Trang 21"),
        ("    Phụ lục D: Bảng thuật ngữ chuyên ngành và mã hiệu viễn thông", "Trang 22")
    ]

    for title, page in toc_items:
        p_item = doc.add_paragraph()
        p_item.paragraph_format.space_before = Pt(2)
        p_item.paragraph_format.space_after = Pt(2)
        p_item.paragraph_format.line_spacing = 1.15
        
        is_heading = not title.startswith("    ")
        r_t = p_item.add_run(title)
        r_t.font.size = Pt(10.5 if is_heading else 9.5)
        r_t.bold = is_heading
        if is_heading:
            r_t.font.color.rgb = RGBColor(15, 23, 42)
            
        r_dots = p_item.add_run(" " + "." * (68 - len(title)) + " ")
        r_dots.font.color.rgb = RGBColor(148, 163, 184)
        
        r_p = p_item.add_run(page)
        r_p.bold = is_heading
        r_p.font.size = Pt(10 if is_heading else 9.5)
        r_p.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_page_break()

    # =========================================================================
    # PHẦN 1: BỐI CẢNH, TẦM NHÌN VÀ MÔ TẢ TỔNG QUAN DỰ ÁN
    # =========================================================================
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    r = h1.add_run("PHẦN 1: BỐI CẢNH, TẦM NHÌN VÀ MÔ TẢ TỔNG QUAN DỰ ÁN")
    r.bold = True
    r.font.size = Pt(13.5)
    r.font.color.rgb = RGBColor(2, 132, 199)

    # 1.1. Bối cảnh cấp thiết
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(8)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("1.1. Bối cảnh cấp thiết và nghịch lý trong cứu hộ truyền thống")
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph(
        "Trong mọi thảm họa, tai nạn hoặc sự cố an ninh trật tự, thời gian là ranh giới mong manh giữa sự sống và cái chết. "
        "Trước đây, công tác tiếp nhận tin báo khẩn cấp tại Việt Nam phân tán qua nhiều đầu số riêng lẻ: 113 (Công an), 114 (Cứu hỏa), 115 (Y tế cấp cứu). "
        "Khi lâm vào trạng thái hoảng loạn cực độ, người dân thường lúng túng không nhớ rõ đầu số chuyên trách, hoặc không thể diễn đạt chính xác vị trí mình đang đứng giữa một khu vực xa lạ, đèo dốc vắng vẻ hoặc địa bàn vừa mới sáp nhập tên gọi."
    )
    doc.add_paragraph(
        "Mặt khác, ranh giới hành chính giữa các địa phương giáp ranh thường tạo nên sự chồng chéo. Một vụ việc xảy ra ngay ranh giới giữa hai tỉnh thường mất từ 15 đến 30 phút chỉ để các bên xác định 'thuộc thẩm quyền quản lý của đơn vị nào'. "
        "Sự chậm trễ này không xuất phát từ trách nhiệm của người cán bộ, mà do khoảng trống thiếu hụt một nền tảng công nghệ liên kết dùng chung theo thời gian thực."
    )

    add_callout(
        "Quy tắc vàng 5 phút trong cấp cứu và cứu nạn: Cứ mỗi phút chậm trễ trong cấp cứu ngừng tuần hoàn hoặc cứu hộ đám cháy, cơ hội sống sót của nạn nhân giảm đi 10%. "
        "SOS Việt Nam 2026 được xây dựng nhằm mục tiêu cao nhất: đưa thời gian định vị và kích hoạt lực lượng cơ sở về dưới 15 giây.",
        title="NGUYÊN TẮC TỐI THƯỢNG:"
    )

    # 1.2. Mục tiêu chiến lược
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(8)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("1.2. Mục tiêu chiến lược và triết lý thiết kế hai phân hệ")
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph(
        "Hệ thống SOS Việt Nam 2026 giải quyết bài toán trên thông qua triết lý kiến trúc đối xứng: "
        "'Dành sự tối giản 1 chạm cho người dân — Dành sự toàn năng, đa chiều cho người chỉ huy'."
    )
    
    # Bảng phân hệ
    tbl_sub = doc.add_table(rows=3, cols=2)
    tbl_sub.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_sub.autofit = False
    col_w = [Cm(7.5), Cm(8.5)]
    
    # Header bảng
    hdr_cells = tbl_sub.rows[0].cells
    hdr_cells[0].text = "PHÂN HỆ CÔNG DÂN (CITIZEN PORTAL)"
    hdr_cells[1].text = "PHÂN HỆ ĐIỀU HÀNH TÁC CHIẾN (DISPATCHER C4ISR)"
    for idx, c in enumerate(hdr_cells):
        c.width = col_w[idx]
        set_cell_background(c, "0F172A")
        set_cell_margins(c, top=140, bottom=140, left=160, right=160)
        p = c.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(10)
        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

    data_rows = [
        ("Môi trường: Trình duyệt Web Mobile không cài đặt (PWA), chạy mượt từ kết nối 3G/4G chập chờn.\n\n"
         "Tính năng lõi: Nút bấm SOS 1 chạm, tự động giải mã tọa độ GPS, micro thoại trực tiếp, truyền video hiện trường, theo dõi thời gian thực xe cứu trợ tiếp cận.",
         "Môi trường: Màn hình chỉ huy tác chiến đa điểm (Desktop C4ISR HUD), hỗ trợ màn hình lớn, máy tính chuyên dụng trung tâm tác chiến.\n\n"
         "Tính năng lõi: Bản đồ tác chiến 34 tỉnh thành, radar quét lực lượng cơ sở, hàng đợi ưu tiên khẩn cấp, đàm thoại thoại/video 2 chiều, khóa địa giới tỉnh, phát hiện báo khống OSINT, lập biên bản số NĐ 30."),
        ("Mục tiêu người dùng: Trợ giúp khẩn cấp trong vòng 3 thao tác, tuyệt đối không đòi hỏi đăng ký rườm rà, có cơ chế giấu thông tin phòng chống bạo lực gia đình.",
         "Mục tiêu người dùng: Cung cấp bức tranh toàn cảnh cho kíp trực ban, giảm thiểu 90% thời gian xử lý văn bản, điều phối đúng xe, đúng trạm, đúng thẩm quyền.")
    ]

    for r_idx, (c1, c2) in enumerate(data_rows):
        row = tbl_sub.rows[r_idx + 1]
        row.cells[0].width = col_w[0]
        row.cells[1].width = col_w[1]
        set_cell_margins(row.cells[0], top=120, bottom=120, left=140, right=140)
        set_cell_margins(row.cells[1], top=120, bottom=120, left=140, right=140)
        set_cell_border_light(row.cells[0])
        set_cell_border_light(row.cells[1])
        set_cell_background(row.cells[0], "F8FAFC" if r_idx % 2 == 0 else "FFFFFF")
        set_cell_background(row.cells[1], "F8FAFC" if r_idx % 2 == 0 else "FFFFFF")
        
        p1 = row.cells[0].paragraphs[0]
        p1.paragraph_format.line_spacing = 1.15
        p1.add_run(c1).font.size = Pt(9.5)
        
        p2 = row.cells[1].paragraphs[0]
        p2.paragraph_format.line_spacing = 1.15
        p2.add_run(c2).font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 1.3. Ma trận 5 lực lượng
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(8)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("1.3. Ma trận điều phối 5 lực lượng phản ứng nhanh liên ngành")
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph(
        "Thay vì hoạt động độc lập, SOS Việt Nam 2026 tích hợp 5 cánh tay xung kích phản ứng nhanh vào một luồng điều phối duy nhất:"
    )
    doc.add_paragraph(
        "1. Lực lượng Công An Nhân Dân (113): Tiếp nhận các vụ việc an ninh trật tự, tội phạm hình sự, bạo lực, bắt cóc, đe dọa tính mạng.\n"
        "2. Cảnh Sát Giao Thông (CSGT): Tiếp nhận sự cố va chạm, tai nạn giao thông, ùn tắc nghiêm trọng, truy bắt phương tiện gây tai nạn bỏ chạy.\n"
        "3. Cảnh Sát PCCC & CNCH (114): Ứng cứu hỏa hoạn nhà cao tầng, khu công nghiệp, sập đổ công trình, cứu nạn vùng lũ lụt, chìm tàu đò.\n"
        "4. Đội Cấp Cứu Y Tế 115: Xuất xe cứu thương có bác sĩ, hồi sức cấp cứu ngoại viện, điều phối nạn nhân đến bệnh viện còn trống giường hồi sức.\n"
        "5. Đội Cứu Hộ Giao Thông & Dân Sự: Xe cẩu chuyên dụng giải tỏa ách tắc, cứu kéo xe rơi vực, hỗ trợ kỹ thuật hiện trường 24/7."
    )

    # 1.4. Đột phá bản đồ 34 tỉnh thành
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(8)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("1.4. Đột phá bản đồ địa giới số 34 tỉnh thành mới năm 2026")
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph(
        "Một trong những ưu điểm kỹ thuật vượt trội của dự án là việc nạp sẵn và đồng bộ toàn bộ ranh giới hành chính của Đề án Sắp xếp, Sáp nhập Đơn vị Hành chính năm 2026. "
        "Hệ thống quản lý chi tiết 34 tỉnh thành mới, phân giải sâu đến 3.321 đơn vị cơ sở và 2.628 phường, xã, thị trấn mới thành lập."
    )
    doc.add_paragraph(
        "Khi người dân gửi yêu cầu, thuật toán đối soát địa giới áp dụng cơ chế 'Strict Province Border Locking' (Khóa chặt ranh giới tỉnh): "
        "Tuyệt đối ngăn chặn hiện tượng gán nhầm sang trạm của tỉnh khác chỉ vì khoảng cách địa lý gần hơn theo đường chim bay. "
        "Mọi ca sự cố ở xã vùng giáp ranh của Tỉnh Đồng Nai sẽ được định tuyến chuẩn xác về đúng Công an Xã sở tại và Công an Tỉnh Đồng Nai, bảo đảm trật tự hành chính và kỷ luật chỉ huy."
    )

    # Ảnh chụp minh chứng thanh điều hành
    topbar_img = os.path.join(os.getcwd(), 'Reports', 'qa', 'playwright', 'evidence-c4isr-3zone-complete.png')
    if not os.path.exists(topbar_img):
        topbar_img = os.path.join(os.getcwd(), 'Reports', 'qa', 'playwright', 'evidence-header-and-topbar-fix.png')
    if os.path.exists(topbar_img):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.add_run().add_picture(topbar_img, width=Inches(6.2))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(10)
        r_cap = p_cap.add_run("Hình 1.1: Giao diện Trung tâm chỉ huy tác chiến C4ISR 3 phân vùng tiêu chuẩn: Bản đồ số vệ tinh liên tuyến (Trái) — Hàng đợi tiếp nhận sự cố (Giữa) — Hồ sơ điều phối tác chiến thực địa (Phải)")
        r_cap.font.italic = True
        r_cap.font.size = Pt(9.5)
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_page_break()

    # =========================================================================
    # PHẦN 2: HƯỚNG DẪN SỬ DỤNG CHI TIẾT TỪNG PHÂN HỆ
    # =========================================================================
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    r = h1.add_run("PHẦN 2: HƯỚNG DẪN SỬ DỤNG CHI TIẾT TỪNG PHÂN HỆ")
    r.bold = True
    r.font.size = Pt(13.5)
    r.font.color.rgb = RGBColor(2, 132, 199)

    # 2.1. Cổng tiếp nhận Người Dân
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(8)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("2.1. Cổng tiếp nhận khẩn cấp dành cho Người Dân (Citizen SOS)")
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph(
        "Người dân khi cần trợ giúp chỉ cần thực hiện 3 bước đơn giản trên điện thoại:"
    )
    doc.add_paragraph(
        "• Bước 1: Mở liên kết khẩn cấp (qua trình duyệt web, quét mã QR công cộng hoặc bấm link thông báo khẩn). "
        "Trang tiếp nhận tự động bật định vị GPS có độ chính xác cao và hiển thị địa chỉ hành chính (Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố).\n"
        "• Bước 2: Bấm nút 'GỬI SOS KHẨN CẤP' màu đỏ lớn ở giữa màn hình. Chọn nhanh lực lượng cần chi viện (Công an, Y tế, Cứu hỏa hoặc Tai nạn xe).\n"
        "• Bước 3: Theo dõi phản hồi. Màn hình ngay lập tức chuyển sang chế độ Tác Chiến Trực Tiếp (Live Tracking): "
        "hiển thị tên đơn vị tiếp nhận (ví dụ: Công An Xã An Phước), số điện thoại nóng của trực ban, biển số xe cứu hộ đang di chuyển và thời gian dự kiến tiếp cận."
    )

    add_callout(
        "Chế độ Giấu Thông Tin Khẩn Cấp (Stealth Mode): Trong các tình huống đe dọa tính mạng (bắt cóc, trộm đột nhập, bạo lực gia đình), "
        "người dân có thể kích hoạt chế độ 'Yên lặng'. Màn hình sẽ tắt mọi chuông báo, ngụy trang thành giao diện xem tin tức thông thường "
        "nhưng vẫn âm thầm truyền tọa độ vệ tinh và âm thanh hiện trường về máy chủ chỉ huy.",
        title="TÍNH NĂNG NHÂN VĂN ĐẶC BIỆT:"
    )

    # 2.2. Bảng điều khiển tác chiến Trực ban
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(8)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("2.2. Bảng điều khiển tác chiến dành cho Cán Bộ Trực Ban (Dispatcher)")
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph(
        "Giao diện trực ban được chuẩn hóa theo phong cách HUD C4ISR quân sự hiện đại. Các thao tác nghiệp vụ chính gồm:"
    )
    doc.add_paragraph(
        "1. Theo dõi Hàng Đợi Sự Cố (Incident Queue): Các ca SOS gửi về được xếp theo mức độ khẩn cấp (Màu Đỏ: Nguy cấp; Màu Vàng: Đang điều phối; Màu Xanh: Đã xử lý). "
        "Cảnh báo âm thanh đa tần số đặc biệt lập tức phát ra khi có tín hiệu mới.\n"
        "2. Bản đồ Tác chiến Tương tác: Hiển thị marker vị trí người dân, vòng bán kính radar các đồn trạm công an/bệnh viện lân cận. "
        "Cán bộ có thể nhấp vào marker để xem đầy đủ hồ sơ viễn thông và bấm 'ĐIỀU ĐỘNG ĐƠN VỊ' chỉ trong 1 thao tác.\n"
        "3. Bộ Lọc Nghiệp Vụ Tinh Gọn: Thanh công cụ đỉnh cao 42px cho phép lọc tức thì danh sách sự cố theo 5 lực lượng (CA, GT, PC, 115, CH) hoặc kiểm tra hồ sơ nghi vấn Báo Khống.\n"
        "4. Kênh Đàm Thoại 2 Chiều: Nhấp vào nút 'GỌI TRỰC TIẾP' để kích hoạt cuộc gọi thoại hoặc video streaming được mã hóa đầu cuối với người dân mà không làm lộ số điện thoại cá nhân của cán bộ."
    )

    # 2.3. Quy trình xác thực an ninh Cyber Shield
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(8)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("2.3. Quy trình xác thực bảo vệ an ninh hai tầng (Cyber Shield)")
    r.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph(
        "Để bảo vệ tuyệt mật cơ sở dữ liệu và bản đồ tác chiến trước các cuộc tấn công mạng, hệ thống áp dụng cơ chế xác thực hai tầng nghiêm ngặt:"
    )
    doc.add_paragraph(
        "• Tầng 1 — Cổng An Ninh Cyber Shield (Gatekeeper Pass): Khi truy cập giao diện chỉ huy, cán bộ bắt buộc nhập mã an ninh quân sự (Mặc định: 2002). "
        "Nếu phát hiện truy cập trái phép hoặc dò quét tự động (Brute-force / Crawler), tường lửa lập tức phong tỏa IP trong 24 giờ.\n"
        "• Tầng 2 — Đăng Nhập Cán Bộ Trực Ban (Officer Duty Shift): Cán bộ chọn đơn vị trực ban (Công an xã/phường, Đội CSGT, Đội PCCC, v.v.), "
        "nhập tài khoản định danh được cấp và thiết lập ca trực (Họ tên cán bộ, cấp bậc, kíp trực từ mấy giờ đến mấy giờ). "
        "Mọi thao tác can thiệp vào sự cố đều được ký số gắn với định danh của cán bộ phụ trách."
    )

    doc.add_page_break()

    # =========================================================================
    # PHẦN 3: QUY TRÌNH VẬN HÀNH & VÒNG ĐỜI XỬ LÝ SỰ CỐ (LIFECYCLE)
    # =========================================================================
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    r = h1.add_run("PHẦN 3: QUY TRÌNH VẬN HÀNH & VÒNG ĐỜI XỬ LÝ SỰ CỐ (LIFECYCLE)")
    r.bold = True
    r.font.size = Pt(13.5)
    r.font.color.rgb = RGBColor(2, 132, 199)

    doc.add_paragraph(
        "Một sự cố khẩn cấp từ thời điểm phát sinh đến khi kết thúc đều trải qua 5 giai đoạn khép kín được tự động hóa hoàn toàn trên hệ thống:"
    )

    lifecycle_steps = [
        ("GIAI ĐOẠN 1: TIẾP NHẬN & THẨM ĐỊNH TỌA ĐỘ", 
         "Hệ thống bắt tín hiệu GPS vệ tinh, đối soát với bản đồ 34 tỉnh thành 2026. "
         "Giải mã địa chỉ thực địa, khóa ranh giới tỉnh để tránh gán nhầm. "
         "Máy chủ kiểm tra chỉ số an ninh viễn thông để loại trừ báo giả. Thời gian: 0 - 5 giây."),
        ("GIAI ĐOẠN 2: ĐIỀU ĐỘNG LỰC LƯỢNG & XUẤT KÍCH", 
         "Trung tâm chỉ huy phát lệnh điều động đến trạm cơ sở gần nhất (Công an xã, Đội CSGT, Bệnh viện). "
         "Xe chuyên dụng nhận tọa độ và lộ trình tối ưu tránh kẹt xe. "
         "Người dân nhìn thấy vị trí xe đang tiếp cận trên bản đồ. Thời gian: 15 - 45 giây."),
        ("GIAI ĐOẠN 3: PHỐI HỢP TÁC CHIẾN TẠI HIỆN TRƯỜNG", 
         "Lực lượng cứu nạn tiếp cận mục tiêu. Mở kênh đàm thoại hình ảnh 2 chiều với trung tâm chỉ huy nếu cần chi viện thêm xe cứu hỏa hoặc trực thăng. "
         "Ghi nhận tình trạng hiện trường theo thời gian thực."),
        ("GIAI ĐOẠN 4: NGHIỆM THU & KÝ DUYỆT SỐ BIÊN BẢN", 
         "Sau khi hoàn tất sơ cứu/bắt giữ/dập lửa, cán bộ trực ban mở biểu mẫu điện tử. "
         "Nhập tóm tắt kết quả, ký tên điện tử cán bộ và người dân ký xác nhận trên màn hình cảm ứng. "
         "Hệ thống tự động xuất file Word (.docx) chuẩn thể thức Nghị định 30/2020/NĐ-CP."),
        ("GIAI ĐOẠN 5: TỰ HỦY DỮ LIỆU NHẠY CẢM SAU 24H", 
         "Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân: Toàn bộ âm thanh ghi âm, hình ảnh hiện trường và số điện thoại công dân sẽ tự động xóa sạch sau 24 giờ. "
         "Chỉ lưu lại bản ghi thống kê mã hóa phục vụ báo cáo chỉ huy.")
    ]

    tbl_life = doc.add_table(rows=len(lifecycle_steps)+1, cols=2)
    tbl_life.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_life.autofit = False
    
    tbl_life.rows[0].cells[0].text = "BƯỚC NGHIỆP VỤ"
    tbl_life.rows[0].cells[1].text = "HÀNH ĐỘNG HỆ THỐNG & CHI TIẾT VẬN HÀNH"
    tbl_life.rows[0].cells[0].width = Cm(5.5)
    tbl_life.rows[0].cells[1].width = Cm(10.5)
    set_cell_background(tbl_life.rows[0].cells[0], "0F172A")
    set_cell_background(tbl_life.rows[0].cells[1], "0F172A")
    set_cell_margins(tbl_life.rows[0].cells[0], top=120, bottom=120, left=140, right=140)
    set_cell_margins(tbl_life.rows[0].cells[1], top=120, bottom=120, left=140, right=140)
    tbl_life.rows[0].cells[0].paragraphs[0].runs[0].font.bold = True
    tbl_life.rows[0].cells[0].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    tbl_life.rows[0].cells[1].paragraphs[0].runs[0].font.bold = True
    tbl_life.rows[0].cells[1].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)

    for idx, (title_step, desc_step) in enumerate(lifecycle_steps):
        row = tbl_life.rows[idx + 1]
        row.cells[0].width = Cm(5.5)
        row.cells[1].width = Cm(10.5)
        set_cell_margins(row.cells[0], top=110, bottom=110, left=140, right=140)
        set_cell_margins(row.cells[1], top=110, bottom=110, left=140, right=140)
        set_cell_border_light(row.cells[0])
        set_cell_border_light(row.cells[1])
        set_cell_background(row.cells[0], "F8FAFC" if idx % 2 == 0 else "FFFFFF")
        set_cell_background(row.cells[1], "F8FAFC" if idx % 2 == 0 else "FFFFFF")

        p0 = row.cells[0].paragraphs[0]
        r0 = p0.add_run(title_step)
        r0.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(2, 132, 199)

        p1 = row.cells[1].paragraphs[0]
        p1.paragraph_format.line_spacing = 1.15
        r1 = p1.add_run(desc_step)
        r1.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    doc.add_page_break()

    # =========================================================================
    # PHẦN 4: HỆ THỐNG CÔNG NGHỆ CHUYÊN SÂU & AN NINH MẠNG
    # =========================================================================
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    r = h1.add_run("PHẦN 4: HỆ THỐNG CÔNG NGHỆ CHUYÊN SÂU & AN NINH MẠNG")
    r.bold = True
    r.font.size = Pt(13.5)
    r.font.color.rgb = RGBColor(2, 132, 199)

    doc.add_paragraph(
        "Hệ thống khẩn cấp quốc gia đòi hỏi tiêu chuẩn sẵn sàng cao (High Availability 99.99%) và khả năng chống chịu trước các đợt tấn công mạng có chủ đích."
    )
    doc.add_paragraph(
        "1. Kiến trúc Phòng thủ Chủ động (Cyber Shield Defense):\n"
        "   - Bộ lọc biểu thức viễn thông phân tích mọi request HTTP/WebSocket trước khi chạm tới cơ sở dữ liệu.\n"
        "   - Cơ chế Honeypot tự động bẫy các công cụ quét lỗ hổng và cấm IP vĩnh viễn.\n"
        "   - Mã hóa toàn bộ phiên làm việc bằng HMAC-SHA256 với khóa bảo mật luân phiên."
    )
    doc.add_paragraph(
        "2. Cơ chế Điều tra Dấu vết Báo Khống (OSINT Telemetry Trace):\n"
        "   - Khi một sự cố bị nghi ngờ là báo tin sai, cán bộ trực ban kích hoạt tính năng 'Khoanh Vùng Dấu Vết OSINT'.\n"
        "   - Hệ thống trích xuất thông số kỹ thuật viễn thông: Địa chỉ IP, nhà mạng Internet, thông số User-Agent, độ trôi GPS và lịch sử các lần gọi trước.\n"
        "   - Tự động đối chiếu với các điều khoản xử phạt của Nghị định 144/2021/NĐ-CP (Xử phạt vi phạm hành chính trong lĩnh vực an ninh trật tự), "
        "lập hồ sơ lưu trữ riêng biệt phục vụ công tác rà soát và xử lý theo pháp luật."
    )
    doc.add_paragraph(
        "3. Tối ưu Hóa Truyền Tải Trong Điều Kiện Mạng Yếu:\n"
        "   - Giao thức Server-Sent Events (SSE) tối ưu hóa tiêu thụ băng thông, bảo đảm kết nối liên tục kể cả khi di chuyển qua vùng sóng chập chờn.\n"
        "   - Video nén chuẩn WebM / MP4 tối ưu hóa dung lượng xuống dưới 1.5MB, tự động hạ chất lượng hình ảnh khi nghẽn mạng để ưu tiên duy trì liên lạc thoại."
    )

    doc.add_page_break()

    # =========================================================================
    # PHẦN 5: PHỤ LỤC NGHIỆP VỤ & BẢNG TRA CỨU ĐIỀU HÀNH
    # =========================================================================
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    r = h1.add_run("PHẦN 5: PHỤ LỤC NGHIỆP VỤ & BẢNG TRA CỨU ĐIỀU HÀNH")
    r.bold = True
    r.font.size = Pt(13.5)
    r.font.color.rgb = RGBColor(2, 132, 199)

    # Phụ lục A: Mã sự cố
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(6)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("Phụ lục A: Danh mục phân loại mã nghiệp vụ sự cố 5 lực lượng")
    r.bold = True
    r.font.size = Pt(11.5)
    r.font.color.rgb = RGBColor(15, 23, 42)

    tbl_code = doc.add_table(rows=6, cols=3)
    tbl_code.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_code.autofit = False
    col_c = [Cm(3.5), Cm(4.5), Cm(8.0)]
    
    headers_c = ["MÃ NGHIỆP VỤ", "LỰC LƯỢNG CHỦ TRÌ", "ĐẶC ĐIỂM SỰ CỐ & QUY TRÌNH XỬ LÝ"]
    for idx, text in enumerate(headers_c):
        cell = tbl_code.rows[0].cells[idx]
        cell.width = col_c[idx]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    codes_data = [
        ("CODE-POLICE-01", "Công An Nhân Dân (113)", "Đe dọa tính mạng, cướp giật, trộm cắp đột nhập, bạo lực hung khí."),
        ("CODE-TRAFFIC-02", "Cảnh Sát Giao Thông (CSGT)", "Va chạm giao thông có thương tích, xe lật chắn luồng quốc lộ, phương tiện bỏ trốn."),
        ("CODE-FIRE-03", "Cảnh Sát PCCC & CNCH (114)", "Cháy nhà xưởng, khu dân cư, mắc kẹt thang máy, đuối nước, sập hầm."),
        ("CODE-MED-04", "Cấp Cứu Y Tế 115", "Ngừng tuần hoàn, tai biến mạch máu não, sốc phản vệ, chấn thương sọ não."),
        ("CODE-RESCUE-05", "Cứu Hộ Giao Thông", "Xe tải lật vực, phương tiện hỏng đứt trục trên cao tốc, kéo xe giải tỏa hiện trường.")
    ]

    for r_i, (c1, c2, c3) in enumerate(codes_data):
        row = tbl_code.rows[r_i + 1]
        for c_i, val in enumerate([c1, c2, c3]):
            cell = row.cells[c_i]
            cell.width = col_c[c_i]
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            set_cell_border_light(cell)
            set_cell_background(cell, "F8FAFC" if r_i % 2 == 0 else "FFFFFF")
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if c_i == 0:
                r.bold = True
                r.font.color.rgb = RGBColor(185, 28, 28)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Phụ lục B: Bảng phân vùng 34 tỉnh thành
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(6)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("Phụ lục B: Bảng phân vùng và đầu mối chỉ huy 34 tỉnh thành 2026 (Trích dẫn)")
    r.bold = True
    r.font.size = Pt(11.5)
    r.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph(
        "Hệ thống tích hợp dữ liệu GeoJSON ranh giới của 34 Tỉnh/Thành phố mới sau sáp nhập. "
        "Dưới đây là bảng trích mẫu các đơn vị trọng điểm phía Nam và Tây Nguyên:"
    )

    tbl_prov = doc.add_table(rows=5, cols=3)
    tbl_prov.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_prov.autofit = False
    
    for idx, text in enumerate(["ĐƠN VỊ HÀNH CHÍNH 2026", "TRỤ SỞ TRỰC BAN CHỈ HUY", "ĐẦU MỐI ĐIỀU PHỐI ĐỒNG BỘ"]):
        cell = tbl_prov.rows[0].cells[idx]
        cell.width = col_c[idx]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    prov_data = [
        ("Tỉnh Đồng Nai", "Quốc lộ 51, Xã An Phước, Long Thành", "Công An Tỉnh Đồng Nai • Đồn CA Xã An Phước"),
        ("TP. Hồ Chí Minh", "Trung tâm Tác chiến Quận 1 & TP. Thủ Đức", "Bộ Tư Lệnh Tác Chiến • CA Phường Bến Thành"),
        ("Tỉnh Cần Thơ", "Đại lộ Hòa Bình, Quận Ninh Kiều", "Công An TP. Cần Thơ • CA Phường Tân An"),
        ("Tỉnh Lâm Đồng", "Trung tâm Điều phối Cao nguyên Đà Lạt", "Công An Tỉnh Lâm Đồng • CA Phường 1")
    ]

    for r_i, (c1, c2, c3) in enumerate(prov_data):
        row = tbl_prov.rows[r_i + 1]
        for c_i, val in enumerate([c1, c2, c3]):
            cell = row.cells[c_i]
            cell.width = col_c[c_i]
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            set_cell_border_light(cell)
            set_cell_background(cell, "F8FAFC" if r_i % 2 == 0 else "FFFFFF")
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if c_i == 0:
                r.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Phụ lục C: Thể thức biên bản Nghị định 30
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(6)
    h2.paragraph_format.space_after = Pt(4)
    r = h2.add_run("Phụ lục C: Mẫu biên bản xác minh hiện trường chuẩn Nghị định 30/2020/NĐ-CP")
    r.bold = True
    r.font.size = Pt(11.5)
    r.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph(
        "Mọi biên bản điện tử tự động xuất từ hệ thống đều bảo đảm đầy đủ 9 thành phần thể thức văn bản hành chính nhà nước:\n"
        "1. Quốc hiệu và Tiêu ngữ chuẩn (cỡ chữ 12-13pt, in hoa đứng đậm).\n"
        "2. Tên cơ quan ban hành (cỡ chữ 12-13pt, in hoa đứng, gạch chân 1/3 - 1/2).\n"
        "3. Số, ký hiệu văn bản (Mã sự cố tự động sinh: BB-XM/SOS-2026-XXXX).\n"
        "4. Địa danh và thời gian lập biên bản (lấy theo giờ máy chủ nguyên tử Asia/Ho_Chi_Minh).\n"
        "5. Tên loại và trích yếu nội dung: BIÊN BẢN XÁC MINH VỤ VIỆC CỨU NẠN CỨU HỘ.\n"
        "6. Nội dung chi tiết: Thành phần tham gia, tọa độ GPS, hiện trạng nạn nhân, biện pháp đã xử lý.\n"
        "7. Chữ ký, họ tên người có thẩm quyền và chữ ký số của người dân.\n"
        "8. Dấu chỉ dẫn điện tử mã QR tra cứu hồ sơ an toàn."
    )

    # Lời kết và chữ ký trách nhiệm
    doc.add_paragraph().paragraph_format.space_before = Pt(12)
    tbl_sign = doc.add_table(rows=1, cols=2)
    tbl_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_sign.autofit = False
    
    c_left = tbl_sign.cell(0, 0)
    c_right = tbl_sign.cell(0, 1)
    c_left.width = Cm(8.0)
    c_right.width = Cm(8.0)

    p_sl = c_left.paragraphs[0]
    p_sl.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sl = p_sl.add_run("NGƯỜI LẬP TÀI LIỆU\n")
    r_sl.bold = True
    r_sl.font.size = Pt(11)
    r_sl2 = p_sl.add_run("Tổ Công Nghệ & Tác Chiến C4ISR\n\n\n\n")
    r_sl2.font.size = Pt(10)
    r_sl3 = p_sl.add_run("Kỹ Sư Trưởng Hệ Thống")
    r_sl3.bold = True
    r_sl3.font.size = Pt(11)

    p_sr = c_right.paragraphs[0]
    p_sr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sr = p_sr.add_run("TRƯỞNG TRUNG TÂM CHỈ HUY TÁC CHIẾN\n")
    r_sr.bold = True
    r_sr.font.size = Pt(11)
    r_sr2 = p_sr.add_run("Bộ Công An • Phê Duyệt Lưu Hành\n\n\n\n")
    r_sr2.font.size = Pt(10)
    r_sr3 = p_sr.add_run("CÁN BỘ TRỰC BAN QUỐC GIA")
    r_sr3.bold = True
    r_sr3.font.size = Pt(11)

    # Lưu file
    output_dir = os.path.join(os.getcwd(), 'docs')
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, 'Tai_Lieu_Tong_Quan_Va_Huong_Dan_Van_Hanh_SOS_Viet_Nam_2026.docx')
    doc.save(out_file)
    print(f"SUCCESS: Saved document to {out_file} (Size: {os.path.getsize(out_file)} bytes)")

if __name__ == '__main__':
    create_dossier()
