import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os
import re

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    for child in list(tcPr):
        if child.tag.endswith('shd'):
            tcPr.remove(child)
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    for child in list(tblPr):
        if child.tag.endswith('tblBorders'):
            tblPr.remove(child)
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>\n'
        f'  <w:top w:w="{top}" w:type="dxa"/>\n'
        f'  <w:bottom w:w="{bottom}" w:type="dxa"/>\n'
        f'  <w:left w:w="{left}" w:type="dxa"/>\n'
        f'  <w:right w:w="{right}" w:type="dxa"/>\n'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def add_formatted_runs(paragraph, text, default_font_size=12.5, default_color=RGBColor(15, 23, 42)):
    text = text.replace('`', '')
    tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*)', text)
    for token in tokens:
        if not token:
            continue
        if token.startswith('**') and token.endswith('**') and len(token) >= 4:
            clean_token = token[2:-2].strip('*')
            r = paragraph.add_run(clean_token)
            r.bold = True
            r.font.name = 'Times New Roman'
            r.font.size = Pt(default_font_size)
            r.font.color.rgb = default_color
        elif token.startswith('*') and token.endswith('*') and len(token) >= 2:
            clean_token = token[1:-1].strip('*')
            r = paragraph.add_run(clean_token)
            r.italic = True
            r.font.name = 'Times New Roman'
            r.font.size = Pt(default_font_size)
            r.font.color.rgb = default_color
        else:
            clean_token = token.replace('**', '').replace('*', '')
            r = paragraph.add_run(clean_token)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(default_font_size)
            r.font.color.rgb = default_color

def create_full_nckh_docx():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    doc = docx.Document()

    # Section 0: Cover Page
    sec_cover = doc.sections[0]
    sec_cover.top_margin = Inches(0.8)
    sec_cover.bottom_margin = Inches(0.8)
    sec_cover.left_margin = Inches(1.1)
    sec_cover.right_margin = Inches(0.9)
    
    # Elegant double border for Cover Page
    cover_borders = parse_xml(
        f'<w:pgBorders {nsdecls("w")} w:offsetFrom="page">\n'
        f'  <w:top w:val="double" w:sz="12" w:space="24" w:color="0284C7"/>\n'
        f'  <w:left w:val="double" w:sz="12" w:space="24" w:color="0284C7"/>\n'
        f'  <w:bottom w:val="double" w:sz="12" w:space="24" w:color="0284C7"/>\n'
        f'  <w:right w:val="double" w:sz="12" w:space="24" w:color="0284C7"/>\n'
        f'</w:pgBorders>'
    )
    sec_cover._sectPr.append(cover_borders)

    # Base style
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12.5)
    font.color.rgb = RGBColor(15, 23, 42)
    style.paragraph_format.line_spacing = 1.35
    style.paragraph_format.space_after = Pt(6)

    # ==================== TRANG BÌA CHÍNH ====================
    p_gov = doc.add_paragraph()
    p_gov.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_gov = p_gov.add_run("BỘ CÔNG AN — BỘ THÔNG TIN VÀ TRUYỀN THÔNG\nỦY BAN NHÂN DÂN THÀNH PHỐ CẦN THƠ\nSỞ KHOA HỌC VÀ CÔNG NGHỆ\n")
    r_gov.bold = True
    r_gov.font.size = Pt(12)
    r_gov.font.color.rgb = RGBColor(71, 85, 105)
    p_gov.paragraph_format.space_after = Pt(10)

    p_star = doc.add_paragraph()
    p_star.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_star = p_star.add_run("-------------------- *** --------------------\n\n")
    r_star.font.size = Pt(11)
    r_star.font.color.rgb = RGBColor(148, 163, 184)
    p_star.paragraph_format.space_after = Pt(14)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("BÁO CÁO TỔNG KẾT\nĐỀ TÀI NGHIÊN CỨU KHOA HỌC VÀ PHÁT TRIỂN CÔNG NGHỆ\n")
    r_sub.bold = True
    r_sub.font.size = Pt(14)
    r_sub.font.color.rgb = RGBColor(30, 41, 59)
    p_sub.paragraph_format.space_after = Pt(16)

    p_maintitle = doc.add_paragraph()
    p_maintitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_maintitle = p_maintitle.add_run(
        "NGHIÊN CỨU THIẾT KẾ VÀ TRIỂN KHAI HỆ THỐNG ĐIỀU PHỐI CỨU HỘ KHẨN CẤP "
        "ĐA NỀN TẢNG THỜI GIAN THỰC HỢP NHẤT BA LỰC LƯỢNG\n(CÔNG AN — Y TẾ — CỨU NẠN)\n"
        "TÍCH HỢP ĐỊNH VỊ VỆ TINH, GIAO TIẾP ĐA PHƯƠNG TIỆN VÀ BẢO VỆ DỮ LIỆU CÁ NHÂN:\n"
        "THỰC THI THÍ ĐIỂM TẠI ĐỊA BÀN THÀNH PHỐ CẦN THƠ\n"
        "(SOS VIỆT NAM 2026)"
    )
    r_maintitle.bold = True
    r_maintitle.font.size = Pt(16)
    r_maintitle.font.color.rgb = RGBColor(2, 132, 199)
    p_maintitle.paragraph_format.space_after = Pt(24)

    p_code = doc.add_paragraph()
    p_code.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_code = p_code.add_run("Mã số đề tài: NCKH-BCA-CT2026-SOS-VN\n\n")
    r_code.bold = True
    r_code.font.size = Pt(12)
    r_code.font.color.rgb = RGBColor(100, 116, 139)

    # Info Box Table on Cover
    cov_table = doc.add_table(rows=4, cols=2)
    cov_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(cov_table, color="CBD5E1", sz="4")
    
    info_data = [
        ("Chủ nhiệm đề tài:", "Điền Trần Vĩnh An"),
        ("Đơn vị chủ trì thực hiện:", "Trung tâm Thông tin Chỉ huy & Tác chiến Khẩn cấp Số"),
        ("Cơ quan phối hợp thực hiện:", "Công an TP. Cần Thơ — Sở Y tế Cần Thơ — PC07 Cần Thơ"),
        ("Thời gian thực hiện thí điểm:", "Năm 2025 — 2026")
    ]
    for row_idx, (k, v) in enumerate(info_data):
        c0 = cov_table.cell(row_idx, 0)
        c1 = cov_table.cell(row_idx, 1)
        c0.width = Inches(2.2)
        c1.width = Inches(4.0)
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.bold = True
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(11.5)
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(11.5)
        set_cell_margins(c0, 70, 70, 120, 120)
        set_cell_margins(c1, 70, 70, 120, 120)

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_after = Pt(36)

    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_foot = p_foot.add_run("CẦN THƠ, THÁNG 09 NĂM 2026")
    r_foot.bold = True
    r_foot.font.size = Pt(12)
    r_foot.font.color.rgb = RGBColor(71, 85, 105)

    # ==================== SECTION 1: NỘI DUNG CHÍNH ====================
    sec_body = doc.add_section()
    sec_body.top_margin = Inches(0.79)
    sec_body.bottom_margin = Inches(0.79)
    sec_body.left_margin = Inches(1.18)
    sec_body.right_margin = Inches(0.79)
    
    # Clear borders for body section
    body_borders = parse_xml(
        f'<w:pgBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="none"/>\n'
        f'  <w:left w:val="none"/>\n'
        f'  <w:bottom w:val="none"/>\n'
        f'  <w:right w:val="none"/>\n'
        f'</w:pgBorders>'
    )
    sec_body._sectPr.append(body_borders)

    # Header and footer for body section
    footer = sec_body.footer
    p_ft = footer.paragraphs[0]
    p_ft.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_ft = p_ft.add_run("SOS Việt Nam 2026 — Đề tài NCKH Thí điểm TP. Cần Thơ")
    r_ft.font.name = 'Times New Roman'
    r_ft.font.size = Pt(9.5)
    r_ft.font.color.rgb = RGBColor(148, 163, 184)

    # Read markdown
    md_path = os.path.join(repo_root, 'docs', 'DE_TAI_NGHIEN_CUU_KHOA_HOC_SOS_VIETNAM_2026.md')
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    idx = 0
    total_lines = len(lines)
    in_cover_header = True

    while idx < total_lines:
        line = lines[idx]
        stripped = line.strip()

        # Skip banner lines handled on cover page
        if in_cover_header:
            if stripped.startswith('## DANH MỤC CÁC CHỮ VIẾT TẮT'):
                in_cover_header = False
            else:
                idx += 1
                continue

        if not stripped:
            idx += 1
            continue

        if stripped in ['---', '***', '___']:
            idx += 1
            continue

        # Check for images: ![Alt Text](image_path)
        img_match = re.match(r'^!\[(.*?)\]\((.*?)\)$', stripped)
        if img_match:
            alt_text = img_match.group(1).strip()
            img_rel_path = img_match.group(2).strip()
            full_img_path = os.path.normpath(os.path.join(repo_root, img_rel_path))

            if os.path.exists(full_img_path):
                p_img = doc.add_paragraph()
                p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_img.paragraph_format.space_before = Pt(12)
                p_img.paragraph_format.space_after = Pt(4)
                
                run_pic = p_img.add_run()
                run_pic.add_picture(full_img_path, width=Inches(5.8))

                p_cap = doc.add_paragraph()
                p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_cap.paragraph_format.space_after = Pt(12)
                r_cap = p_cap.add_run(alt_text)
                r_cap.font.name = 'Times New Roman'
                r_cap.font.size = Pt(10.5)
                r_cap.italic = True
                r_cap.font.color.rgb = RGBColor(71, 85, 105)
            else:
                print(f"Warning: Image not found: {full_img_path}")
            idx += 1
            continue

        # Check for Tables
        if stripped.startswith('|') and '|' in stripped[1:]:
            table_lines = []
            while idx < total_lines and lines[idx].strip().startswith('|'):
                table_lines.append(lines[idx].strip())
                idx += 1

            parsed_rows = []
            for t_line in table_lines:
                cells = [c.strip() for c in t_line.strip('|').split('|')]
                if all(re.match(r'^:?-+:?$', c) for c in cells):
                    continue
                parsed_rows.append(cells)

            if parsed_rows:
                num_rows = len(parsed_rows)
                num_cols = max(len(r) for r in parsed_rows)

                tbl = doc.add_table(rows=num_rows, cols=num_cols)
                tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                set_table_borders(tbl, color="CBD5E1", sz="4")

                for r_idx, row_data in enumerate(parsed_rows):
                    for c_idx in range(num_cols):
                        cell_val = row_data[c_idx] if c_idx < len(row_data) else ""
                        cell = tbl.cell(r_idx, c_idx)
                        p_cell = cell.paragraphs[0]
                        p_cell.paragraph_format.space_after = Pt(2)
                        p_cell.paragraph_format.space_before = Pt(2)
                        p_cell.paragraph_format.line_spacing = 1.15

                        if r_idx == 0:
                            # Header
                            set_cell_background(cell, "0284C7")
                            p_cell.alignment = WD_ALIGN_PARAGRAPH.CENTER
                            add_formatted_runs(p_cell, cell_val, default_font_size=11, default_color=RGBColor(255, 255, 255))
                            for run in p_cell.runs:
                                run.bold = True
                            set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
                        else:
                            # Data rows
                            bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                            set_cell_background(cell, bg_color)
                            
                            is_center = (c_idx == 0 and len(cell_val) <= 12) or cell_val in ['PASS', 'Đạt xuất sắc'] or 'Dưới' in cell_val or cell_val.endswith('KB')
                            if is_center:
                                p_cell.alignment = WD_ALIGN_PARAGRAPH.CENTER
                            else:
                                p_cell.alignment = WD_ALIGN_PARAGRAPH.LEFT

                            color = RGBColor(16, 185, 129) if cell_val == 'PASS' or cell_val == 'Đạt xuất sắc' else RGBColor(30, 41, 59)
                            add_formatted_runs(p_cell, cell_val, default_font_size=10.5, default_color=color)
                            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)

                p_spacer = doc.add_paragraph()
                p_spacer.paragraph_format.space_after = Pt(8)
            continue

        # Heading 1 (# ...)
        if stripped.startswith('# '):
            h1_text = stripped[2:].strip().replace('**', '').replace('*', '')
            p_h = doc.add_paragraph()
            p_h.paragraph_format.space_before = Pt(18)
            p_h.paragraph_format.space_after = Pt(8)
            p_h.paragraph_format.keep_with_next = True
            
            p_h.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r_h = p_h.add_run(h1_text)
            r_h.bold = True
            r_h.font.name = 'Times New Roman'
            r_h.font.size = Pt(14.5)
            r_h.font.color.rgb = RGBColor(2, 132, 199)
            idx += 1
            continue

        # Heading 2 (## ...)
        if stripped.startswith('## '):
            h2_text = stripped[3:].strip().replace('**', '').replace('*', '')
            p_h = doc.add_paragraph()
            p_h.paragraph_format.space_before = Pt(14)
            p_h.paragraph_format.space_after = Pt(6)
            p_h.paragraph_format.keep_with_next = True
            p_h.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r_h = p_h.add_run(h2_text)
            r_h.bold = True
            r_h.font.name = 'Times New Roman'
            r_h.font.size = Pt(13.5)
            r_h.font.color.rgb = RGBColor(30, 41, 59)
            idx += 1
            continue

        # Heading 3 (### ...)
        if stripped.startswith('### '):
            h3_text = stripped[4:].strip().replace('**', '').replace('*', '')
            p_h = doc.add_paragraph()
            p_h.paragraph_format.space_before = Pt(10)
            p_h.paragraph_format.space_after = Pt(4)
            p_h.paragraph_format.keep_with_next = True
            p_h.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r_h = p_h.add_run(h3_text)
            r_h.bold = True
            r_h.font.name = 'Times New Roman'
            r_h.font.size = Pt(13)
            r_h.font.color.rgb = RGBColor(51, 65, 85)
            idx += 1
            continue

        # Heading 4 (#### ...)
        if stripped.startswith('#### '):
            h4_text = stripped[5:].strip().replace('**', '').replace('*', '')
            p_h = doc.add_paragraph()
            p_h.paragraph_format.space_before = Pt(8)
            p_h.paragraph_format.space_after = Pt(3)
            p_h.paragraph_format.keep_with_next = True
            p_h.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r_h = p_h.add_run(h4_text)
            r_h.bold = True
            r_h.italic = True
            r_h.font.name = 'Times New Roman'
            r_h.font.size = Pt(12.5)
            r_h.font.color.rgb = RGBColor(2, 132, 199)
            idx += 1
            continue

        # Bullet List Items
        if stripped.startswith('- ') or stripped.startswith('* '):
            item_text = stripped[2:].strip()
            p_item = doc.add_paragraph(style='List Bullet')
            p_item.paragraph_format.space_after = Pt(3)
            p_item.paragraph_format.line_spacing = 1.3
            p_item.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            add_formatted_runs(p_item, item_text, default_font_size=12.5)
            idx += 1
            continue

        # Numbered List Items
        num_match = re.match(r'^(\d+)\.\s+(.*)', stripped)
        if num_match:
            item_num = num_match.group(1)
            item_text = num_match.group(2).strip()
            p_item = doc.add_paragraph(style='List Number')
            p_item.paragraph_format.space_after = Pt(3)
            p_item.paragraph_format.line_spacing = 1.3
            p_item.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            add_formatted_runs(p_item, item_text, default_font_size=12.5)
            idx += 1
            continue

        # Normal Body Paragraphs
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.first_line_indent = Inches(0.45)
        p.paragraph_format.line_spacing = 1.35
        p.paragraph_format.space_after = Pt(6)
        add_formatted_runs(p, stripped, default_font_size=12.5)
        idx += 1

    # Save to Webapp Docs folder
    out_docs = os.path.join(repo_root, 'docs', 'DE_TAI_NGHIEN_CUU_KHOA_HOC_SOS_VIETNAM_2026.docx')
    doc.save(out_docs)
    print(f"Successfully generated DOCX at: {out_docs}")

    # Copy to Desktop
    desktop_docx = r'C:\Users\dienv\Desktop\DE_TAI_NGHIEN_CUU_KHOA_HOC_SOS_VIETNAM_2026.docx'
    try:
        doc.save(desktop_docx)
        print(f"Successfully copied DOCX to Desktop: {desktop_docx}")
    except PermissionError:
        alt_desktop_docx = r'C:\Users\dienv\Desktop\DE_TAI_NGHIEN_CUU_KHOA_HOC_SOS_VIETNAM_2026_MOI.docx'
        doc.save(alt_desktop_docx)
        print(f"Desktop file is locked by Word. Saved updated copy to: {alt_desktop_docx}")

    desktop_md = r'C:\Users\dienv\Desktop\DE_TAI_NGHIEN_CUU_KHOA_HOC_SOS_VIETNAM_2026.md'
    try:
        with open(md_path, 'r', encoding='utf-8') as f_src, open(desktop_md, 'w', encoding='utf-8') as f_dst:
            f_dst.write(f_src.read())
        print(f"Successfully copied MD to Desktop: {desktop_md}")
    except Exception as e:
        print(f"Note on Desktop MD: {e}")

if __name__ == '__main__':
    create_full_nckh_docx()
