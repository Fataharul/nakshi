import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_table_borders(table, color="D3CBBF", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def make_table_header(row, bg_color="86452A", text_color="FFFFFF"):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
    for cell in row.cells:
        set_cell_shading(cell, bg_color)
        set_cell_margins(cell, top=130, bottom=130, left=150, right=150)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1
            for run in p.runs:
                run.font.name = "Calibri"
                run.font.size = Pt(9.5)
                run.font.bold = True
                if text_color == "FFFFFF":
                    run.font.color.rgb = RGBColor(255, 255, 255)
                else:
                    run.font.color.rgb = RGBColor(26, 25, 24)

def format_data_row(row, is_alt=False, alt_bg="FBF9F4", font_size=9.0):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
    for cell in row.cells:
        if is_alt:
            set_cell_shading(cell, alt_bg)
        set_cell_margins(cell, top=90, bottom=90, left=130, right=130)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            for run in p.runs:
                run.font.name = "Calibri"
                run.font.size = Pt(font_size)
                run.font.color.rgb = RGBColor(35, 33, 30)

def set_col_widths(table, col_widths):
    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = Inches(width)

def add_heading_styled(doc, text, level):
    h = doc.add_heading(text, level=level)
    h.paragraph_format.keep_with_next = True
    if level == 1:
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)
        for run in h.runs:
            run.font.name = "Calibri"
            run.font.size = Pt(15)
            run.font.bold = True
            run.font.color.rgb = RGBColor(134, 69, 42) # Terracotta
    elif level == 2:
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        for run in h.runs:
            run.font.name = "Calibri"
            run.font.size = Pt(12.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(164, 92, 64) # Soft terracotta
    elif level == 3:
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(3)
        for run in h.runs:
            run.font.name = "Calibri"
            run.font.size = Pt(10.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(35, 33, 30) # Charcoal
    return h

def add_p(doc, text, bold_prefix=None, space_after=4, italic_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_b = p.add_run(bold_prefix)
        r_b.font.name = "Calibri"
        r_b.font.size = Pt(10.0)
        r_b.font.bold = True
        r_b.font.color.rgb = RGBColor(26, 25, 24)
    if italic_prefix:
        r_i = p.add_run(italic_prefix)
        r_i.font.name = "Calibri"
        r_i.font.size = Pt(10.0)
        r_i.font.italic = True
        r_i.font.color.rgb = RGBColor(100, 95, 90)
    r_t = p.add_run(text)
    r_t.font.name = "Calibri"
    r_t.font.size = Pt(10.0)
    r_t.font.color.rgb = RGBColor(35, 33, 30)
    return p

def add_bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_b = p.add_run(bold_prefix)
        r_b.font.name = "Calibri"
        r_b.font.size = Pt(10.0)
        r_b.font.bold = True
        r_b.font.color.rgb = RGBColor(26, 25, 24)
    r_t = p.add_run(text)
    r_t.font.name = "Calibri"
    r_t.font.size = Pt(10.0)
    r_t.font.color.rgb = RGBColor(35, 33, 30)
    return p

def add_diagram(doc, image_path, caption, width_in=6.0):
    if os.path.exists(image_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run = p_img.add_run()
        run.add_picture(image_path, width=Inches(width_in))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(10)
        r_cap = p_cap.add_run(caption)
        r_cap.font.name = "Calibri"
        r_cap.font.size = Pt(9.0)
        r_cap.font.bold = True
        r_cap.font.color.rgb = RGBColor(100, 95, 90)
    else:
        p_err = doc.add_paragraph()
        p_err.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_err = p_err.add_run(f"[{caption} - Image not found: {image_path}]")
        r_err.font.italic = True
        r_err.font.color.rgb = RGBColor(180, 50, 50)

def generate_final_report():
    doc = docx.Document()
    
    # Page setup: Standard Letter, 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
        # Header setup
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("CSE 314: Software Engineering Lab | Final Project Report — Nakshi")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(130, 125, 120)

        # Footer setup
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("Nakshi (formerly Art & Crafts Bangladesh)  |  Final Project Report")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(130, 125, 120)

    # -------------------------------------------------------------
    # COVER PAGE
    # -------------------------------------------------------------
    cov_p = doc.add_paragraph()
    cov_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cov_p.paragraph_format.space_before = Pt(10)
    cov_p.paragraph_format.space_after = Pt(10)
    
    logo_path = os.path.abspath("uap_logo.png")
    if os.path.exists(logo_path):
        run_logo = cov_p.add_run()
        run_logo.add_picture(logo_path, width=Inches(1.2))
    
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(4)
    p_inst.paragraph_format.space_after = Pt(2)
    r_inst = p_inst.add_run("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\nUNIVERSITY OF ASIA PACIFIC")
    r_inst.font.name = "Calibri"
    r_inst.font.size = Pt(11.0)
    r_inst.font.bold = True
    r_inst.font.color.rgb = RGBColor(80, 75, 70)
    
    p_crs = doc.add_paragraph()
    p_crs.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_crs.paragraph_format.space_before = Pt(2)
    p_crs.paragraph_format.space_after = Pt(16)
    r_crs = p_crs.add_run("CSE 314: Software Engineering Lab")
    r_crs.font.name = "Calibri"
    r_crs.font.size = Pt(11.5)
    r_crs.font.bold = True
    r_crs.font.color.rgb = RGBColor(134, 69, 42)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("PROJECT REPORT")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(24.0)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(134, 69, 42)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(4)
    r_sub = p_sub.add_run("Project Title: Nakshi")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(15.0)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(35, 33, 30)

    p_prev = doc.add_paragraph()
    p_prev.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_prev.paragraph_format.space_before = Pt(0)
    p_prev.paragraph_format.space_after = Pt(20)
    r_prev = p_prev.add_run("(Formerly documented as: Art & Crafts Bangladesh)")
    r_prev.font.name = "Calibri"
    r_prev.font.size = Pt(10.5)
    r_prev.font.italic = True
    r_prev.font.color.rgb = RGBColor(115, 110, 105)

    p_team_lbl = doc.add_paragraph()
    p_team_lbl.paragraph_format.space_before = Pt(8)
    p_team_lbl.paragraph_format.space_after = Pt(4)
    r_tl = p_team_lbl.add_run("Team Information")
    r_tl.font.name = "Calibri"
    r_tl.font.size = Pt(11.5)
    r_tl.font.bold = True
    r_tl.font.color.rgb = RGBColor(134, 69, 42)

    # Team Info Table
    team_table = doc.add_table(rows=6, cols=4)
    team_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(team_table, color="C8C2B7")
    set_col_widths(team_table, [0.6, 1.3, 2.5, 2.1])

    hdr = team_table.rows[0]
    hdr.cells[0].paragraphs[0].add_run("SL")
    hdr.cells[1].paragraphs[0].add_run("Student ID")
    hdr.cells[2].paragraphs[0].add_run("Student Name")
    hdr.cells[3].paragraphs[0].add_run("Role")
    make_table_header(hdr, bg_color="86452A", text_color="FFFFFF")

    team_data = [
        ("1", "23201062", "Md. Fataharul Islam", "Lead Developer / Architect"),
        ("2", "23201070", "Sadiya Akter Seba", "Backend Engineer"),
        ("3", "23201061", "Zakeria Abrar", "Frontend Engineer"),
        ("4", "23201072", "Naziz Al Sayem", "QA & Database Administrator"),
        ("5", "23101113", "Asia Akter", "System Analyst"),
    ]

    for idx, (sl, sid, sname, role) in enumerate(team_data):
        row = team_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(sl)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].add_run(sid)
        row.cells[2].paragraphs[0].add_run(sname)
        row.cells[3].paragraphs[0].add_run(role)
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Submission Meta Table
    meta_table = doc.add_table(rows=2, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(meta_table, color="C8C2B7")
    set_col_widths(meta_table, [3.25, 3.25])

    m_hdr = meta_table.rows[0]
    m_hdr.cells[0].paragraphs[0].add_run("Document Version")
    m_hdr.cells[1].paragraphs[0].add_run("Date of Submission")
    make_table_header(m_hdr, bg_color="A45C40", text_color="FFFFFF")

    m_data = meta_table.rows[1]
    m_data.cells[0].paragraphs[0].add_run("V2.0 (Final Delivered Version)")
    m_data.cells[1].paragraphs[0].add_run("05-11-2026")
    m_data.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    m_data.cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    format_data_row(m_data, is_alt=False, font_size=10.0)

    doc.add_page_break()

    # -------------------------------------------------------------
    # CONTENTS & DOCUMENT HISTORY
    # -------------------------------------------------------------
    add_heading_styled(doc, "Contents", level=1)
    
    p_note = doc.add_paragraph()
    r_note = p_note.add_run("Note: Right-click the table of contents and choose 'Update Field' to refresh page numbers after editing.")
    r_note.font.italic = True
    r_note.font.size = Pt(9.0)
    r_note.font.color.rgb = RGBColor(120, 115, 110)

    toc_items = [
        ("Document History", "3"),
        ("1. Introduction", "4"),
        ("    1.1 Background of the Project", "4"),
        ("    1.2 Problem Statement", "4"),
        ("    1.3 Objectives", "5"),
        ("    1.4 Scope of the System", "5"),
        ("    1.5 CEP Analysis (Complex Engineering Problem)", "6"),
        ("2. Project Management Plan", "7"),
        ("    2.1 Project Organization", "7"),
        ("    2.2 Work Breakdown Structure and Schedule", "7"),
        ("    2.3 Resource and Cost Estimation", "8"),
        ("    2.4 Risk Management", "8"),
        ("    2.5 Communication and Quality Plan", "9"),
        ("3. Requirement Analysis and Specification", "10"),
        ("    3.1 User Requirements", "10"),
        ("    3.2 Functional Requirements", "10"),
        ("    3.3 Non-Functional Requirements", "12"),
        ("    3.4 Hardware & Software Requirements", "13"),
        ("4. System Design", "14"),
        ("    4.1 System Architecture Diagram", "14"),
        ("    4.2 Use Case Diagram", "16"),
        ("    4.3 Data Flow Diagram (DFD) / UML Diagrams", "17"),
        ("    4.4 Database Design", "22"),
        ("        4.4.1 Entity Relationship Diagram (ERD)", "22"),
        ("        4.4.2 Database Tables & Data Dictionary", "23"),
        ("5. Implementation", "31"),
        ("    5.1 Module Breakdown", "31"),
        ("    5.2 Iterative Development", "32"),
        ("    5.3 Technology Stack", "32"),
        ("    5.4 Development Methodology", "33"),
        ("6. Development Process", "34"),
        ("    6.1 Week-wise Progress (CEP Tracking Table)", "34"),
        ("        6.1.1 Sprint Details", "36"),
        ("    6.2 Coding Implementation", "38"),
        ("        6.2.1 Key Modules / Classes", "38"),
        ("        6.2.2 Important Algorithms", "39"),
        ("        6.2.3 Screenshots of Code / Output", "40"),
        ("7. Testing and Sustainability", "41"),
        ("    7.1 Test Plan and Strategy", "41"),
        ("    7.2 Test Cases and Results", "42"),
        ("    7.3 Sustainability", "44"),
        ("8. Results and Discussion", "45"),
        ("    8.1 Final Output Highlights", "45"),
        ("    8.2 System Performance", "46"),
        ("    8.3 Issues Encountered and Solutions", "47"),
        ("9. Conclusion", "48"),
        ("    9.1 What Was Achieved", "48"),
        ("    9.2 Learning Outcomes", "48"),
        ("    9.3 Future Improvements", "49"),
        ("Acknowledgement", "50"),
        ("Appendix", "51"),
        ("    Appendix A: Team Member Work Distribution (Week-wise)", "51"),
        ("    Appendix B: Git Link and Commit History", "52"),
        ("    Appendix C: Evidence of Interaction with Stakeholders", "53"),
        ("    Appendix D: Architectural Glossary", "54"),
    ]
    
    for title, page_no in toc_items:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(0)
        p_t.paragraph_format.space_after = Pt(2)
        p_t.paragraph_format.line_spacing = 1.15
        r1 = p_t.add_run(title)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(35, 33, 30)
        dots = " ." * int((65 - len(title)))
        r_dots = p_t.add_run(dots[:52] + " ")
        r_dots.font.name = "Calibri"
        r_dots.font.size = Pt(8.0)
        r_dots.font.color.rgb = RGBColor(170, 165, 160)
        r2 = p_t.add_run(page_no)
        r2.font.name = "Calibri"
        r2.font.size = Pt(9.5)
        r2.font.bold = True
        r2.font.color.rgb = RGBColor(134, 69, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    add_heading_styled(doc, "Document History", level=1)
    
    hist_table = doc.add_table(rows=7, cols=5)
    hist_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(hist_table, color="C8C2B7")
    set_col_widths(hist_table, [0.7, 0.9, 1.8, 2.3, 0.8])

    h_hdr = hist_table.rows[0]
    h_hdr.cells[0].paragraphs[0].add_run("Version")
    h_hdr.cells[1].paragraphs[0].add_run("Date")
    h_hdr.cells[2].paragraphs[0].add_run("Authors")
    h_hdr.cells[3].paragraphs[0].add_run("Change Log")
    h_hdr.cells[4].paragraphs[0].add_run("Approved By")
    make_table_header(h_hdr, bg_color="86452A", text_color="FFFFFF")

    hist_data = [
        ("V1.0", "03-09-2026", "Md. Fataharul Islam, Sadiya Akter Seba, Zakeria Abrar, Naziz Al Sayem, Asia Akter", "Initial Software Design Specification (SDS) & Architectural Models Draft.", "Supervisor"),
        ("V1.1", "29-09-2026", "Md. Fataharul Islam, Sadiya Akter Seba, Zakeria Abrar", "Sprint 2: Rebranded to Nakshi. Google OAuth 2.0; Supabase S3 image storage; physical dimensions/weight schema.", "Supervisor"),
        ("V1.2", "07-10-2026", "Sadiya Akter Seba, Md. Fataharul Islam", "Sprint 3: Updated live auction state machine to CLOSED; real-time WebSocket outbid events and escrow refunds.", "Supervisor"),
        ("V1.3", "22-10-2026", "Zakeria Abrar, Md. Fataharul Islam, Sadiya Akter Seba", "Sprint 4: Implemented internal credit top-up & atomic fixed-price checkout; infinite scroll gallery; removed real payment gateways.", "Supervisor"),
        ("V1.4", "02-11-2026", "Md. Fataharul Islam, Naziz Al Sayem, Asia Akter", "Sprint 5: Admin moderation queue with split comparison; exhibition ticket token admission gate hardening; concluded blackout.", "Supervisor"),
        ("V2.0", "05-11-2026", "Md. Fataharul Islam, Sadiya Akter Seba, Zakeria Abrar, Naziz Al Sayem, Asia Akter", "Sprint 6 / Final Delivery: Crop-resilient multi-scale deduplication (<300ms); exhibition multi-artwork density & full organizer CRUD; final delivery report.", "Evaluation Committee"),
    ]

    for idx, (ver, dt, auth, cl, app) in enumerate(hist_data):
        row = hist_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(ver)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].add_run(dt)
        row.cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[2].paragraphs[0].add_run(auth)
        row.cells[3].paragraphs[0].add_run(cl)
        row.cells[4].paragraphs[0].add_run(app)
        row.cells[4].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHAPTER 1: INTRODUCTION
    # -------------------------------------------------------------
    add_heading_styled(doc, "1. Introduction", level=1)
    
    add_heading_styled(doc, "1.1 Background of the Project", level=2)
    add_p(doc, 
        "Bangladesh possesses an exceptionally rich cultural heritage of artisanal craftsmanship spanning centuries, including "
        "Dhakai Jamdani handloom weaving, intricate Nakshi Kantha folklore quilts, Kantajew temple terracotta reliefs, Dhamrai lost-wax "
        "bell-metal casting, and Sylhet Shital Pati cane work. Historically, master artisans and rural craft communities have remained "
        "economically marginalized due to heavy reliance on intermediaries, exploitative wholesale physical supply chains, and fragmented, "
        "insecure social media setups (e.g., informal Facebook and Instagram business pages). These social channels lack transactional security, "
        "provide zero intellectual property copyright protection, and offer no real-time competitive bidding or immersive exhibition venues. "
        "The Nakshi software platform was undertaken as an integrated digital ecosystem engineered specifically to empower Bangladeshi artisans, "
        "curators, and collectors within a unified, technologically modern, and protective digital environment."
    )

    add_heading_styled(doc, "1.2 Problem Statement", level=2)
    add_p(doc, 
        "The contemporary creative trades in Bangladesh suffer from four acute systemic vulnerabilities:\n"
        "1. Commercial Exploitation & Insecure Transactions: Traditional artisans receive a fraction of retail value while facing high transaction "
        "disputes, delayed remittances, and order abandonment across informal social media messaging.\n"
        "2. Rampant Copycat Plagiarism & Lack of Duplicate Protection: Fraudulent sellers frequently download authentic photographs of handcrafted "
        "works, re-upload them to fraudulent listings, and sell machine-made counterfeits without provenance verification.\n"
        "3. Absence of Real-Time Valuation Mechanisms: Fine craft items and heirloom artworks lack transparent price-discovery mechanisms like live auctions, "
        "forcing creators to sell rare masterworks at flat, undervalue price points.\n"
        "4. Virtual Gallery & Curatorial Isolation: Independent art curators and cultural institutions lack dedicated, ticketed virtual gallery platforms "
        "to host multi-artwork exhibitions and reach international patrons."
    )

    add_heading_styled(doc, "1.3 Objectives", level=2)
    objectives = [
        ("Objective 1: Multi-Vendor Craft Marketplace", "Deliver a responsive digital storefront allowing verified artisans to catalog, price, and sell authenticated handmade artworks."),
        ("Objective 2: Cashless Internal Credit Ledger", "Establish an atomic, simulated credit wallet system ensuring zero financial drift, eliminating third-party payment gateway risks, and maintaining an immutable transaction audit log."),
        ("Objective 3: Low-Latency Live Auction Engine", "Implement WebSocket-powered real-time bidding rooms with synchronized countdown timers, bid increment validations, and automatic outbid escrow refunds."),
        ("Objective 4: Curated Virtual Gallery Exhibitions", "Provide exhibition organizers with a multi-hall gallery curation studio, digital ticket token issuance, and tamper-resistant viewing time analytics."),
        ("Objective 5: AI-Assisted Crop-Resilient Deduplication", "Deploy an asynchronous difference perceptual hashing (dHash) pipeline capable of detecting cropped or reframed duplicates (>80% similarity) in under 300ms, automatically isolating flagged assets to an admin moderation console."),
    ]
    for obj_title, obj_desc in objectives:
        add_bullet(doc, obj_desc, bold_prefix=f"{obj_title} - ")

    add_heading_styled(doc, "1.4 Scope of the System", level=2)
    add_p(doc, 
        "Nakshi is implemented as a cloud-native, responsive web ecosystem. The platform explicitly provides:\n"
        "• Role-Based Access Control (RBAC) across four distinct roles: Buyer, Artist, Exhibition Organizer, and Platform Administrator.\n"
        "• Drag-and-drop Supabase S3-compatible artwork image uploads with MIME type and 5MB size validation.\n"
        "• Interactive gallery discovery feed featuring instant category filtering, infinite scroll pagination (48-item chunks), likes, and discussion feeds.\n"
        "• Simulated credit wallet top-up, atomic checkout concurrency locking, and live order tracking.\n"
        "• Real-time WebSocket auctions supporting synchronized bidding, outbid notifications, and automatic closed-state payouts.\n"
        "• Virtual exhibition hall walkthroughs with ticket token admission gates (?token=...), VIP preview windows, and visitor heartbeat tracking.\n"
        "• Administrator Moderation Console with 50/50 split-screen comparison inspection and resolution audit history.\n"
        "System Boundaries: The platform operates under a simulated credit model with zero external banking gateways and does not provide native mobile iOS/Android binary packages, operating instead through responsive mobile browser viewports down to 360px."
    )

    add_heading_styled(doc, "1.5 CEP Analysis (Complex Engineering Problem)", level=2)
    add_p(doc, 
        "The Nakshi engineering project fulfills the continuous assessment requirements of a Complex Engineering Problem (CEP) "
        "as defined by international engineering accreditation standards. The table below analyzes how the system addresses each CEP attribute."
    )

    cep_table = doc.add_table(rows=7, cols=2)
    cep_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(cep_table, color="C8C2B7")
    set_col_widths(cep_table, [2.2, 4.3])

    c_hdr = cep_table.rows[0]
    c_hdr.cells[0].paragraphs[0].add_run("CEP Attribute")
    c_hdr.cells[1].paragraphs[0].add_run("How the Project Addresses It")
    make_table_header(c_hdr, bg_color="86452A", text_color="FFFFFF")

    cep_data = [
        ("Depth of Knowledge Required", 
         "Requires cross-disciplinary mastery across distributed systems, relational database isolation levels, WebSocket state synchronization, image processing (libvips perceptual gradient math), cryptographic authentication (JWT, OAuth 2.0), and responsive UI architectures."),
        
        ("Conflicting Requirements", 
         "Balancing computational overhead of sliding sub-window crop detection against sub-second upload response times; reconciling real-time WebSocket outbid broadcasts with atomic database financial ledgers; managing open visitor access versus strict VIP exhibition schedules."),
        
        ("Depth of Analysis", 
         "Analyzing and diagnosing 64-bit dHash mean-randomness traps (which caused 196s upload hangs) and resolving them through single-pass 256px container pre-downsampling, reducing extraction time by 37x (<1ms per sub-crop) and total duplicate checks to <300ms."),
        
        ("Modern Tool Usage", 
         "Utilizes modern state-of-the-art developer tooling including React 18, Vite, TypeScript, Tailwind CSS, Node.js, Express, Socket.IO, Prisma ORM, PostgreSQL, Supabase S3 storage, Sharp libvips, Vitest, and Microsoft Playwright multi-viewport automated testing."),
        
        ("Stakeholder Involvement", 
         "Directly incorporates qualitative and quantitative survey evidence from 8 diverse stakeholders (2 master artisans, 2 exhibition curators, 4 art collectors) validating bKash-style credit mechanics, fixed-price selling, authenticity concerns, and curated exhibitions."),
        
        ("Interdependence of Components", 
         "A change in artwork moderation status (FLAGGED) immediately and atomically cascades across marketplace search queries, order checkout validation, live auction eligibility, and exhibition wall curation."),
    ]

    for idx, (attr, how) in enumerate(cep_data):
        row = cep_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(attr)
        row.cells[1].paragraphs[0].add_run(how)
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHAPTER 2: PROJECT MANAGEMENT PLAN
    # -------------------------------------------------------------
    add_heading_styled(doc, "2. Project Management Plan", level=1)
    
    add_heading_styled(doc, "2.1 Project Organization", level=2)
    add_p(doc, 
        "The project was executed by a collaborative five-member engineering team structured according to specialized engineering disciplines:\n"
        "• Md. Fataharul Islam (Lead Developer / Architect): System architecture, AI perceptual deduplication pipeline, S3 cloud storage, and exhibition CRUD.\n"
        "• Sadiya Akter Seba (Backend Engineer): User authentication, Google OAuth 2.0, live auction WebSocket service, and atomic credit wallet ledger.\n"
        "• Zakeria Abrar (Frontend Engineer): Responsive design system implementation, live auction views, discovery feed, and admin moderation console.\n"
        "• Naziz Al Sayem (QA & Database Administrator): PostgreSQL schema design, Prisma migrations, Supabase connection pooling, and Playwright E2E test suites.\n"
        "• Asia Akter (System Analyst): Requirements elicitation, SRS/SDS specification, stakeholder survey synthesis, and user acceptance traceability."
    )

    add_heading_styled(doc, "2.2 Work Breakdown Structure and Schedule", level=2)
    add_p(doc, 
        "The project was executed following Agile Scrum across 12 academic weeks partitioned into 6 two-week sprint cycles. "
        "The schedule below outlines the key deliverables across each phase."
    )

    wbs_table = doc.add_table(rows=7, cols=4)
    wbs_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(wbs_table, color="C8C2B7")
    set_col_widths(wbs_table, [1.0, 1.8, 2.5, 1.2])

    w_hdr = wbs_table.rows[0]
    w_hdr.cells[0].paragraphs[0].add_run("Phase / Sprint")
    w_hdr.cells[1].paragraphs[0].add_run("Duration")
    w_hdr.cells[2].paragraphs[0].add_run("Major Milestones & Deliverables")
    w_hdr.cells[3].paragraphs[0].add_run("Status")
    make_table_header(w_hdr, bg_color="86452A", text_color="FFFFFF")

    wbs_data = [
        ("Sprint 1", "Aug 15 - Sep 23", "SRS baseline approval, decoupled 3-tier scaffolding, PostgreSQL schema, JWT authentication.", "Completed"),
        ("Sprint 2", "Sep 24 - Sep 30", "Rebranded to Nakshi; Google OAuth 2.0; Supabase S3 storage; physical dimensions/weight schema.", "Completed"),
        ("Sprint 3", "Oct 01 - Oct 15", "Live auction WebSocket engine, CLOSED status migration, outbid credit refund, modular cards.", "Completed"),
        ("Sprint 4", "Oct 16 - Oct 23", "Simulated credit top-up, atomic order checkout locking, infinite scroll gallery dynamic streaming.", "Completed"),
        ("Sprint 5", "Oct 24 - Nov 02", "Admin moderation console, ticket token admission gate, expired exhibition blackout with curator bypass.", "Completed"),
        ("Sprint 6", "Nov 03 - Nov 05", "Crop-resilient multi-scale deduplication (<300ms), exhibition multi-artwork density & full CRUD, final delivery report.", "Completed"),
    ]

    for idx, (ph, dur, mls, st) in enumerate(wbs_data):
        row = wbs_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(ph)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].add_run(dur)
        row.cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[2].paragraphs[0].add_run(mls)
        row.cells[3].paragraphs[0].add_run(st)
        row.cells[3].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)

    add_heading_styled(doc, "2.3 Resource and Cost Estimation", level=2)
    add_p(doc, 
        "Nakshi operates under a strict Zero-Budget ($0.00) architectural mandate suitable for academic demonstration and open-access deployment. "
        "The entire platform leverages free developer tiers:\n"
        "• Compute Infrastructure: Render Free Tier (containerized Node.js/Express server and WebSocket daemon).\n"
        "• Static Frontend Distribution: Vercel Free Hobby Tier (global edge distribution, automated Git continuous deployment).\n"
        "• Database Hosting: Supabase Free PostgreSQL Tier (500MB relational storage, session pooler mode on port 5432).\n"
        "• Media & Object Storage: Supabase S3-Compatible Storage bucket (1GB free asset storage).\n"
        "• Developer Tooling: VS Code, Git, GitHub, Vitest, and Playwright (Open Source, zero licensing cost)."
    )

    add_heading_styled(doc, "2.4 Risk Management", level=2)
    add_p(doc, "The risk management matrix below identifies potential operational risks, severity levels, and engineered mitigations.")

    risk_table = doc.add_table(rows=6, cols=5)
    risk_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(risk_table, color="C8C2B7")
    set_col_widths(risk_table, [0.5, 1.8, 0.9, 0.9, 2.4])

    r_hdr = risk_table.rows[0]
    r_hdr.cells[0].paragraphs[0].add_run("SL")
    r_hdr.cells[1].paragraphs[0].add_run("Identified Risk")
    r_hdr.cells[2].paragraphs[0].add_run("Likelihood")
    r_hdr.cells[3].paragraphs[0].add_run("Impact")
    r_hdr.cells[4].paragraphs[0].add_run("Mitigation Strategy")
    make_table_header(r_hdr, bg_color="86452A", text_color="FFFFFF")

    risk_data = [
        ("1", "Real-Time Auction Bid Race Conditions", "Medium", "High", 
         "Enforce atomic PostgreSQL transactions (prisma.$transaction) and server-side minimum increment validation; serialize concurrent bids."),
        ("2", "Double-Purchase of Single-Sale Artwork", "Medium", "High", 
         "Apply row-level optimistic concurrency locking on artwork availability during order checkout; reject concurrent attempts with HTTP 409 Conflict."),
        ("3", "Event Loop Blocking During Image Hashing", "High", "High", 
         "Pre-downsample images to 256px max dimension before sliding window extraction; evaluate at most top 2 candidates; guarantee <300ms execution."),
        ("4", "Free Cloud Database Cold Start / Timeouts", "High", "Medium", 
         "Connect to Supabase using Session Pooler mode on port 5432 with extended transaction timeouts { maxWait: 10000, timeout: 20000 }."),
        ("5", "Ticket Token Forgery & Hall Jumping", "Low", "High", 
         "Enforce strict cryptographic 32-character tokens, schedule opening guards, concluded blackouts, and database exhibitionId foreign key checks."),
    ]

    for idx, (sl, rsk, lkh, imp, mit) in enumerate(risk_data):
        row = risk_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(sl)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].add_run(rsk)
        row.cells[2].paragraphs[0].add_run(lkh)
        row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[3].paragraphs[0].add_run(imp)
        row.cells[3].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[4].paragraphs[0].add_run(mit)
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)

    add_heading_styled(doc, "2.5 Communication and Quality Plan", level=2)
    add_p(doc, 
        "• Communication Protocols: Bi-weekly Agile sprint planning meetings, daily asynchronous standups on Discord, and GitHub Pull Request review threads.\n"
        "• Quality Assurance Gates: Every pull request required clean TypeScript compilation (0 errors), passing Vitest unit/acceptance suites (233+ tests), "
        "and automated Playwright multi-viewport verification before merging to the main branch.\n"
        "• Codebase Integrity: Strict ESLint standards, structured Zod input validation schemas on all API routes, and Git branch protection rules."
    )

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHAPTER 3: REQUIREMENT ANALYSIS AND SPECIFICATION
    # -------------------------------------------------------------
    add_heading_styled(doc, "3. Requirement Analysis and Specification", level=1)
    
    add_heading_styled(doc, "3.1 User Requirements", level=2)
    add_p(doc, 
        "Comprehensive requirements elicitation was conducted across three primary stakeholder groups: Local Artisans/Craft Sellers, "
        "Exhibition Organizers/Curators, and Art Consumers/Buyers. Key findings from 8 detailed surveys and structured interviews include:\n"
        "• 100% of artisans preferred fixed-price digital storefronts combined with live auction options and supported custom order specifications.\n"
        "• 100% of artisans demanded bKash-compatible cashless payment mechanisms without banking friction.\n"
        "• 100% of exhibition organizers required online gallery curation tools, co-curation controls, and digital ticketing.\n"
        "• 75% of art buyers rated product authenticity and duplicate fraud prevention as their primary concern when shopping online.\n"
        "• 75% of buyers preferred filtering artworks by craft medium, price range, and geographic origin."
    )

    add_heading_styled(doc, "3.2 Functional Requirements", level=2)
    add_p(doc, "The prioritized functional requirements governing system behavior are detailed in the specification table below.")

    fr_table = doc.add_table(rows=21, cols=4)
    fr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(fr_table, color="C8C2B7")
    set_col_widths(fr_table, [0.8, 3.8, 0.8, 1.1])

    f_hdr = fr_table.rows[0]
    f_hdr.cells[0].paragraphs[0].add_run("Req ID")
    f_hdr.cells[1].paragraphs[0].add_run("Functional Requirement Description")
    f_hdr.cells[2].paragraphs[0].add_run("Priority")
    f_hdr.cells[3].paragraphs[0].add_run("Source")
    make_table_header(f_hdr, bg_color="86452A", text_color="FFFFFF")

    fr_data = [
        ("FR 1.1", "The system shall authenticate users using cryptographically checked JSON Web Tokens (JWT) and Google OAuth 2.0.", "High", "SRS 3.1.1"),
        ("FR 1.2", "The system shall dynamically generate client dashboard views checking the authenticated profile's system role.", "High", "SRS 3.1.1"),
        ("FR 1.3", "The platform shall support secure self-registration strictly for Buyer, Artist, and Organizer roles, blocking Admin elevation.", "Medium", "SRS 3.1.1"),
        ("FR 1.4", "The system shall automatically invalidate access tokens and log session states after configured periods of inactivity.", "Low", "SRS 3.1.1"),
        ("FR 2.1", "The system shall allow verified artists to add, edit, and publish handcrafted artworks within their storefront database view.", "High", "SRS 3.1.2"),
        ("FR 2.2", "The database schema shall record craft taxonomy, material descriptions, weight (kg), dimensions (HxWxD), and prices.", "High", "SRS 3.1.2"),
        ("FR 2.3", "The application shall provide a unified seller dashboard displaying total revenue, orders, AOV, and inventory management.", "Medium", "SRS 3.1.2"),
        ("FR 2.4", "The system shall strictly block unauthorized modifications to an artist's catalog from any other user accounts.", "High", "SRS 3.1.2"),
        ("FR 3.1", "The platform shall allow administrators to schedule live auctions with explicit opening bids, minimum increments, and end times.", "High", "SRS 3.1.3"),
        ("FR 3.2", "The system shall check incoming bid values on the server, rejecting entries that fail to meet the required increment.", "High", "SRS 3.1.3"),
        ("FR 3.3", "The system shall broadcast updated auction states over WebSockets to all connected clients within 1.5 seconds.", "High", "SRS 3.1.3"),
        ("FR 3.4", "The auction engine shall reject bids after timer expiration and atomically refund displaced highest bidders upon outbid.", "High", "SRS 3.1.3"),
        ("FR 4.1", "The interface shall provide organizers with an interactive gallery curation tool to place artworks onto virtual wall layers.", "High", "SRS 3.1.4"),
        ("FR 4.2", "The system shall generate unique 32-character alpha-numeric ticket tokens upon verification of credit ticket purchase.", "High", "SRS 3.1.4"),
        ("FR 4.3", "The system shall validate ticket entry tokens, blocking visitor entry for concluded exhibitions with curator archival bypass.", "Medium", "SRS 3.1.4"),
        ("FR 4.4", "The platform shall support 3-phase VIP viewing schedules: pre-VIP open, active VIP restriction/upgrade, and post-VIP open access.", "Medium", "SRS 3.1.4"),
        ("FR 5.1", "The platform shall intercept artwork image uploads and generate structural perceptual image hashes before persistence.", "High", "SRS 3.1.5"),
        ("FR 5.2", "The system shall evaluate visual duplication scores across existing artworks using bitwise Hamming distance math.", "High", "SRS 3.1.5"),
        ("FR 5.3", "If visual similarity exceeds 80%, the system shall hide the artwork from the public marketplace and route it to Admin review.", "High", "SRS 3.1.5"),
        ("FR 5.4", "The admin dashboard shall provide a split-screen 50/50 comparison modal to contrast flagged uploads against matching source files.", "High", "SRS 3.1.5"),
    ]

    for idx, (rid, desc, pri, src) in enumerate(fr_data):
        row = fr_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(rid)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].add_run(desc)
        row.cells[2].paragraphs[0].add_run(pri)
        row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[3].paragraphs[0].add_run(src)
        row.cells[3].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.0)

    add_heading_styled(doc, "3.3 Non-Functional Requirements", level=2)
    add_p(doc, 
        "• 3.3.1 Performance Requirements (NFR 1.1, 1.2): Standard catalog queries and asset retrievals shall complete with an average response time "
        "under 2.5 seconds. Live auction WebSocket updates and high-bid packets shall be pushed across active sockets within 1.5 seconds. "
        "Background crop-resilient duplicate checking shall execute in under 300ms using 256px container pre-downsampling.\n"
        "• 3.3.2 Security Requirements (NFR 2.1, 2.2): Passwords must be non-reversibly hashed using bcrypt with a work factor of 12. All external network "
        "traffic must utilize TLS 1.3 encapsulation protocols (HTTPS/WSS). Strict RBAC interceptor middleware must protect all state-changing API routes.\n"
        "• 3.3.3 Usability Requirements (NFR 3.1, 3.2): The frontend layout architecture must remain responsive down to a minimum screen width of 360px "
        "without dropping interactive controls or overlapping text. Standard workflows must require fewer than 4 navigation steps from the primary menu.\n"
        "• 3.3.4 Reliability Requirements (NFR 4.1, 4.2): The system shall maintain an overall operational availability metric of 99% across any standard operating month. "
        "Automated daily relational snapshots and point-in-time recovery preserve database durability.\n"
        "• 3.3.5 Maintainability Requirements (NFR 5.1, 5.2): The codebase strictly separates Express REST routing controllers from core data models and service layers, "
        "ensuring modular unit testability and documentation conforming to standard TypeScript linting practices."
    )

    add_heading_styled(doc, "3.4 Hardware & Software Requirements", level=2)
    add_p(doc, 
        "• Hardware Specification: Developer workstations require a modern multi-core processor (Intel i5/AMD Ryzen 5 or higher), 16GB RAM, "
        "and 512GB SSD storage. Production execution operates on cloud container runners with 512MB RAM minimum.\n"
        "• Software Specification: Operating System: Windows 11 / Linux (Ubuntu 22.04 LTS). Development Runtime: Node.js 20.x, npm 10.x. "
        "Target Database: PostgreSQL 15.x. Supported Web Browsers: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+."
    )

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHAPTER 4: SYSTEM DESIGN
    # -------------------------------------------------------------
    add_heading_styled(doc, "4. System Design", level=1)
    
    add_heading_styled(doc, "4.1 System Architecture Diagram", level=2)
    add_p(doc, 
        "Nakshi is built on a decoupled 3-tier Layered Model-View-Controller (MVC) architecture integrated with an Event-Driven WebSocket "
        "Engine and an Asynchronous Background Worker Pipeline. Figure 4.1 illustrates the architectural layers spanning Client Presentation, "
        "API Gateway, Application Services, Data Storage, and External Cloud Integrations."
    )
    add_diagram(doc, "extracted_diagrams/architecture_diagram.png", "Figure 4.1: System Architecture Diagram", width_in=6.2)

    add_p(doc, 
        "Figure 4.1b details the physical Cloud Deployment Architecture, showing how client browsers connect via HTTPS/WSS to Vercel (Frontend), "
        "Render (Node.js API & Socket.io server), and Supabase (PostgreSQL 15.x Relational Database & S3 Storage)."
    )
    add_diagram(doc, "extracted_diagrams/deployment_diagram.png", "Figure 4.1b: Cloud Deployment Architecture Diagram", width_in=5.8)

    add_heading_styled(doc, "4.2 Use Case Diagram", level=2)
    add_p(doc, 
        "The Use Case Diagram in Figure 4.2 models the complete functional interactions between the four primary user actors (Artist, Buyer, "
        "Exhibition Organizer, Platform Administrator) and external supporting systems (Payment Simulator, Cloud Storage)."
    )
    add_diagram(doc, "extracted_diagrams/use_case_diagram.png", "Figure 4.2: System Use Case Diagram", width_in=5.8)

    add_heading_styled(doc, "4.3 Data Flow Diagram (DFD) / UML Diagrams", level=2)
    add_p(doc, 
        "Figure 4.3a presents the Context Level Data Flow Diagram (DFD Level 0), defining the information boundaries between external "
        "entities (Artist, Buyer, Admin, Organizer, Payment Service) and the centralized Nakshi system."
    )
    add_diagram(doc, "extracted_diagrams/context_dfd.png", "Figure 4.3a: Context Level Data Flow Diagram (DFD Level 0)", width_in=5.8)

    add_p(doc, 
        "Figure 4.3b illustrates the Level 1 Data Flow Diagram (DFD Level 1), detailing data stores (Users, Artworks, Orders, Auctions, "
        "Exhibitions, Duplicate Reviews) and functional subprocesses."
    )
    add_diagram(doc, "extracted_diagrams/dfd_level1.png", "Figure 4.3b: Data Flow Diagram (DFD Level 1)", width_in=6.0)

    add_p(doc, "Figure 4.3c illustrates the UML Sequence Diagram for the Artist workflow (Artwork creation, storage, and analytics).")
    add_diagram(doc, "extracted_diagrams/seq_artist.png", "Figure 4.3c: UML Sequence Diagram - Artist Workflow", width_in=5.8)

    add_p(doc, "Figure 4.3d illustrates the UML Sequence Diagram for the Buyer workflow (Browsing, live bidding, ticket purchase, and interactions).")
    add_diagram(doc, "extracted_diagrams/seq_buyer.png", "Figure 4.3d: UML Sequence Diagram - Buyer Workflow", width_in=6.0)

    add_p(doc, "Figure 4.3e illustrates the UML Sequence Diagram for the Exhibition Organizer workflow (Hall creation, ticket management, and analytics).")
    add_diagram(doc, "extracted_diagrams/seq_organizer.png", "Figure 4.3e: UML Sequence Diagram - Exhibition Organizer Workflow", width_in=5.8)

    add_heading_styled(doc, "4.4 Database Design", level=2)
    add_heading_styled(doc, "4.4.1 Entity Relationship Diagram (ERD)", level=3)
    add_p(doc, 
        "Figure 4.4 displays the comprehensive Entity Relationship Diagram (ERD) implemented in PostgreSQL via Prisma ORM, illustrating "
        "primary keys, foreign keys, cardinality (1:1, 1:N, N:M), and relational constraints across all system entities."
    )
    add_diagram(doc, "extracted_diagrams/erd_diagram.png", "Figure 4.4: Entity Relationship Diagram (ERD)", width_in=6.2)

    add_heading_styled(doc, "4.4.2 Database Tables & Data Dictionary", level=3)
    add_p(doc, "The tables below provide the complete data dictionary for the core relational models.")

    # Data dictionary entities
    entities = [
        ("Table: User", [
            ("user_id", "UUID / INT", "Unique account identifier", "PRIMARY KEY, NOT NULL"),
            ("name", "VARCHAR(100)", "Full name of registered user", "NOT NULL"),
            ("email", "VARCHAR(150)", "User email address", "UNIQUE, NOT NULL"),
            ("password_hash", "VARCHAR(255)", "Salted bcrypt password hash", "NULLABLE (OAuth)"),
            ("google_id", "VARCHAR(255)", "Google OAuth Subject ID", "UNIQUE, NULLABLE"),
            ("role", "ENUM", "Access role (Admin, Artist, Buyer, Organizer)", "NOT NULL"),
            ("created_at", "TIMESTAMP", "Account creation timestamp", "DEFAULT CURRENT_TIMESTAMP"),
        ]),
        ("Table: ARTIST_PROFILE", [
            ("artist_id", "UUID / INT", "Unique artist profile identifier", "PRIMARY KEY, NOT NULL"),
            ("user_id", "UUID / INT", "Associated account reference", "FOREIGN KEY (User), UNIQUE, NOT NULL"),
            ("bio", "TEXT", "Artist biography / artisan statement", "NULLABLE"),
            ("store_name", "VARCHAR(150)", "Professional storefront title", "NOT NULL"),
            ("profile_image", "VARCHAR(255)", "Avatar image URL", "NULLABLE"),
        ]),
        ("Table: ARTWORK", [
            ("artwork_id", "UUID / INT", "Unique artwork identifier", "PRIMARY KEY, NOT NULL"),
            ("artist_id", "UUID / INT", "Creator reference", "FOREIGN KEY (ArtistProfile), NOT NULL"),
            ("title", "VARCHAR(200)", "Artwork title", "NOT NULL"),
            ("category", "VARCHAR(100)", "Craft taxonomy category", "NOT NULL"),
            ("material", "VARCHAR(100)", "Medium and material specification", "NOT NULL"),
            ("weight", "DECIMAL(8,2)", "Physical weight in kg", "NULLABLE"),
            ("dimensions", "VARCHAR(100)", "Physical dimensions (HxWxD)", "NULLABLE"),
            ("price", "DECIMAL(10,2)", "Valuation in internal credits", "NOT NULL"),
            ("image_url", "VARCHAR(255)", "Storage asset link", "NOT NULL"),
            ("image_hash", "VARCHAR(64)", "64-bit dHash perceptual fingerprint", "NULLABLE"),
            ("status", "ENUM", "Availability status (Available, Sold, Flagged)", "DEFAULT 'Available'"),
        ]),
        ("Table: AUCTION", [
            ("auction_id", "UUID / INT", "Unique live auction session identifier", "PRIMARY KEY, NOT NULL"),
            ("artwork_id", "UUID / INT", "Featured artwork reference", "FOREIGN KEY (Artwork), NOT NULL"),
            ("start_time", "TIMESTAMP", "Scheduled opening epoch", "NOT NULL"),
            ("end_time", "TIMESTAMP", "Timer conclusion epoch", "NOT NULL"),
            ("opening_bid", "DECIMAL(10,2)", "Base starting bid threshold", "NOT NULL"),
            ("bid_increment", "DECIMAL(10,2)", "Mandatory step increment", "NOT NULL"),
            ("status", "ENUM", "Lifecycle state (Scheduled, Active, Closed)", "DEFAULT 'Scheduled'"),
        ]),
        ("Table: EXHIBITION", [
            ("exhibition_id", "UUID / INT", "Unique gallery exhibition identifier", "PRIMARY KEY, NOT NULL"),
            ("organizer_id", "UUID / INT", "Hosting curator reference", "FOREIGN KEY (Organizer), NOT NULL"),
            ("title", "VARCHAR(200)", "Exhibition title", "NOT NULL"),
            ("description", "TEXT", "Curator statement / event summary", "NULLABLE"),
            ("start_date", "TIMESTAMP", "Viewing schedule opening timestamp", "NOT NULL"),
            ("end_date", "TIMESTAMP", "Viewing schedule conclusion timestamp", "NOT NULL"),
            ("access_fee", "DECIMAL(10,2)", "Pass reservation fee in credits", "DEFAULT 0.00"),
            ("vip_start", "TIMESTAMP", "VIP early access window start", "NULLABLE"),
            ("vip_end", "TIMESTAMP", "VIP early access window end", "NULLABLE"),
        ]),
        ("Table: TICKET", [
            ("ticket_id", "UUID / INT", "Unique ticket record identifier", "PRIMARY KEY, NOT NULL"),
            ("exhibition_id", "UUID / INT", "Target exhibition reference", "FOREIGN KEY (Exhibition), NOT NULL"),
            ("buyer_id", "UUID / INT", "Purchasing buyer reference", "FOREIGN KEY (User), NOT NULL"),
            ("token", "VARCHAR(32)", "Cryptographic 32-char admission string", "UNIQUE, NOT NULL"),
            ("access_type", "ENUM", "Admission level (Standard, VIP)", "NOT NULL"),
            ("issued_at", "TIMESTAMP", "Pass issuance timestamp", "DEFAULT CURRENT_TIMESTAMP"),
            ("expires_at", "TIMESTAMP", "Validity conclusion window", "NOT NULL"),
        ]),
        ("Table: DUPLICATE_REVIEW", [
            ("review_id", "UUID / INT", "Unique flagged incident identifier", "PRIMARY KEY, NOT NULL"),
            ("artwork_id", "UUID / INT", "Flagged uploaded artwork reference", "FOREIGN KEY (Artwork), NOT NULL"),
            ("admin_id", "UUID / INT", "Reviewing administrator reference", "FOREIGN KEY (User), NULLABLE"),
            ("similarity_score", "DECIMAL(5,2)", "Perceptual similarity score (>= 80%)", "NOT NULL"),
            ("status", "ENUM", "Queue state (Pending, Approved, Rejected)", "DEFAULT 'Pending'"),
            ("remarks", "TEXT", "Administrator moderation decision notes", "NULLABLE"),
        ]),
        ("Table: CREDIT_TRANSACTION", [
            ("transaction_id", "UUID / INT", "Unique credit audit log identifier", "PRIMARY KEY, NOT NULL"),
            ("user_id", "UUID / INT", "Transacting user account reference", "FOREIGN KEY (User), NOT NULL"),
            ("amount", "DECIMAL(10,2)", "Credit alteration magnitude", "NOT NULL"),
            ("type", "ENUM", "Transaction type (TOP_UP, PURCHASE, SALE, ESCROW)", "NOT NULL"),
            ("balance_after", "DECIMAL(10,2)", "Resulting credit wallet balance", "NOT NULL"),
            ("created_at", "TIMESTAMP", "Transaction execution epoch", "DEFAULT CURRENT_TIMESTAMP"),
        ]),
    ]

    for tbl_name, tbl_rows in entities:
        add_p(doc, f" {tbl_name}", bold_prefix="Entity ")
        tbl = doc.add_table(rows=len(tbl_rows) + 1, cols=4)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl, color="C8C2B7")
        set_col_widths(tbl, [1.5, 1.3, 2.3, 1.4])
        
        t_hdr = tbl.rows[0]
        t_hdr.cells[0].paragraphs[0].add_run("Attribute")
        t_hdr.cells[1].paragraphs[0].add_run("Data Type")
        t_hdr.cells[2].paragraphs[0].add_run("Description")
        t_hdr.cells[3].paragraphs[0].add_run("Constraints")
        make_table_header(t_hdr, bg_color="86452A", text_color="FFFFFF")

        for idx, (attr, dt, desc, con) in enumerate(tbl_rows):
            row = tbl.rows[idx + 1]
            row.cells[0].paragraphs[0].add_run(attr)
            row.cells[1].paragraphs[0].add_run(dt)
            row.cells[2].paragraphs[0].add_run(desc)
            row.cells[3].paragraphs[0].add_run(con)
            format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)
        
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHAPTER 5: IMPLEMENTATION
    # -------------------------------------------------------------
    add_heading_styled(doc, "5. Implementation", level=1)
    
    add_heading_styled(doc, "5.1 Module Breakdown", level=2)
    add_p(doc, "The system implementation is partitioned into six core decoupled modules allocated across team engineers:")

    mod_table = doc.add_table(rows=7, cols=4)
    mod_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(mod_table, color="C8C2B7")
    set_col_widths(mod_table, [0.5, 1.8, 2.7, 1.5])

    m_hdr = mod_table.rows[0]
    m_hdr.cells[0].paragraphs[0].add_run("SL")
    m_hdr.cells[1].paragraphs[0].add_run("Module Name")
    m_hdr.cells[2].paragraphs[0].add_run("Description & Core Responsibilities")
    m_hdr.cells[3].paragraphs[0].add_run("Assigned To")
    make_table_header(m_hdr, bg_color="86452A", text_color="FFFFFF")

    mod_data = [
        ("1", "Authentication & Identity Module", "JWT stateless token issuance, Google OAuth 2.0 integration, password reset verification.", "Sadiya Akter Seba"),
        ("2", "Storefront & Catalog Module", "Artwork publishing, Supabase S3 multipart image upload, dimensions/weight schema, inventory management.", "Md. Fataharul Islam"),
        ("3", "Live Auction Engine", "WebSocket bidding daemon, real-time bid broadcasts, CLOSED status state machine, outbid refund.", "Sadiya Akter Seba"),
        ("4", "Virtual Exhibition & Ticket Gate", "Multi-hall wall curation, 4-artwork density, ticket token admission gate, VIP window lifecycle, organizer CRUD.", "Md. Fataharul Islam"),
        ("5", "AI Duplicate Protection Pipeline", "Perceptual dHash computation, sliding sub-window crop detection with 256px downsampling, Admin review console.", "Md. Fataharul Islam"),
        ("6", "Order Checkout & Credit Ledger", "Simulated credit top-up modal, atomic concurrency locking on checkout, transaction audit logs.", "Zakeria Abrar"),
    ]

    for idx, (sl, mod, desc, ass) in enumerate(mod_data):
        row = mod_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(sl)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].add_run(mod)
        row.cells[2].paragraphs[0].add_run(desc)
        row.cells[3].paragraphs[0].add_run(ass)
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)

    add_heading_styled(doc, "5.2 Iterative Development", level=2)
    add_p(doc, 
        "Development proceeded iteratively across weekly university lab sessions. Each sprint began with backlog refinement, "
        "followed by test-driven feature development on isolated git branches, peer code review, and automated Playwright E2E verification "
        "before merging to main."
    )

    add_heading_styled(doc, "5.3 Technology Stack", level=2)
    add_p(doc, "The comprehensive technology stack powering the Nakshi platform is detailed in the table below:")

    tech_table = doc.add_table(rows=7, cols=3)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tech_table, color="C8C2B7")
    set_col_widths(tech_table, [1.5, 2.0, 3.0])

    t_hdr = tech_table.rows[0]
    t_hdr.cells[0].paragraphs[0].add_run("Layer")
    t_hdr.cells[1].paragraphs[0].add_run("Technology & Version")
    t_hdr.cells[2].paragraphs[0].add_run("Purpose & Justification")
    make_table_header(t_hdr, bg_color="86452A", text_color="FFFFFF")

    tech_data = [
        ("Frontend Layer", "React 18.x, Vite, Tailwind CSS", "High-performance Single Page Application (SPA), component modularity, instant responsive styling down to 360px."),
        ("Backend Layer", "Node.js 20.x, Express.js, TypeScript", "Type-safe asynchronous REST API execution, structured routing, and middleware interceptors."),
        ("Real-Time Engine", "Socket.IO 4.x", "Low-latency full-duplex WebSocket connections for live auction bidding broadcasts and outbid alerts."),
        ("Database Tier", "PostgreSQL 15.x, Prisma ORM", "ACID-compliant relational persistence, declarative schema migrations, and atomic interactive transactions."),
        ("Image Processing", "Sharp 0.33.x (libvips C++ engine)", "High-speed multi-scale perceptual hashing, 256px image downsampling, and bitwise Hamming distance math."),
        ("Testing & Tooling", "Vitest, Playwright, Git, GitHub", "Unit/acceptance integration testing and automated multi-viewport cross-browser end-to-end verification."),
    ]

    for idx, (lyr, tech, purp) in enumerate(tech_data):
        row = tech_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(lyr)
        row.cells[1].paragraphs[0].add_run(tech)
        row.cells[2].paragraphs[0].add_run(purp)
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)

    add_heading_styled(doc, "5.4 Development Methodology", level=2)
    add_p(doc, 
        "The team adopted the Agile Scrum methodology, holding bi-weekly sprint planning, daily asynchronous standups, "
        "and sprint review retrospectives. Scrum was selected over Waterfall because it accommodates rapid requirement refinements "
        "(such as transitioning to an internal credit ledger and adding sliding-window crop deduplication) without stalling active engineering.\n"
        "Project Management Tools Utilized:\n"
        "• Jira / Trello: Backlog tracking, sprint task boards (To Do, In Progress, Code Review, QA Verification, Done).\n"
        "• GitHub: Central repository (fataharul/nakshi), automated branch protection rules, and continuous integration webhooks."
    )

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHAPTER 6: DEVELOPMENT PROCESS
    # -------------------------------------------------------------
    add_heading_styled(doc, "6. Development Process", level=1)
    
    add_heading_styled(doc, "6.1 Week-wise Progress (CEP Tracking Table)", level=2)
    add_p(doc, "The table below traces the 12-week continuous engineering progress of the project.")

    cep_prog_table = doc.add_table(rows=13, cols=4)
    cep_prog_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(cep_prog_table, color="C8C2B7")
    set_col_widths(cep_prog_table, [0.6, 2.3, 2.3, 1.3])

    cp_hdr = cep_prog_table.rows[0]
    cp_hdr.cells[0].paragraphs[0].add_run("Week")
    cp_hdr.cells[1].paragraphs[0].add_run("Tasks Completed")
    cp_hdr.cells[2].paragraphs[0].add_run("Evidence (Code / Output)")
    cp_hdr.cells[3].paragraphs[0].add_run("Remarks")
    make_table_header(cp_hdr, bg_color="86452A", text_color="FFFFFF")

    cep_rows = [
        ("1", "Project proposal, feasibility study, domain problem definition.", "Proposal document, project charter.", "Approved by Supervisor"),
        ("2", "Stakeholder survey analysis (8 respondents) and SRS baseline.", "SRS V1.0, survey raw data appendices.", "Baseline Approved"),
        ("3", "Software Design Specification (SDS), architectural diagrams, ERD.", "SDS V1.0, UML & sequence diagrams.", "Architecture Validated"),
        ("4", "Scaffolding decoupled monorepo; Supabase PostgreSQL connection.", "client/, server/ directories, prisma.schema.", "Sprint 1 Scaffolded"),
        ("5", "JWT authentication, RBAC middleware, and public registration restrictions.", "auth.controller.ts, registerSchema, Vitest suites.", "Auth Flow Verified"),
        ("6", "Rebranding to Nakshi; Google OAuth 2.0; Supabase S3 direct upload.", "storage.service.ts, GoogleLoginButton.tsx.", "Sprint 2 Integrated"),
        ("7", "Live auction engine, WebSocket daemon, CLOSED status machine.", "auction.service.ts, socket.service.ts, LiveAuctionView.", "Sprint 3 Merged"),
        ("8", "Simulated credit wallet, top-up modal, atomic order checkout.", "wallet.service.ts, order.service.ts, TopUpModal.", "Sprint 4 Completed"),
        ("9", "Infinite scroll gallery hub; community likes and interactive comments.", "ArtworkSearchInterface.tsx, ArtworkDetailPage.tsx.", "Phase 1-3 Live"),
        ("10", "Admin moderation review console; 50/50 comparison modal; ticket gate.", "AdminModerationQueue.tsx, ExhibitionRoomPage.tsx.", "Sprint 5 Verified"),
        ("11", "Exhibition viewing time heartbeat; concluded exhibition blackout.", "exhibition-analytics.util.ts, concluded-view.", "Ticket Gate Hardened"),
        ("12", "Crop-resilient multi-scale deduplication (<300ms); organizer CRUD; report.", "similarity.util.ts, final delivery report docx.", "Final Baseline V2.0"),
    ]

    for idx, (wk, tsk, evd, rmk) in enumerate(cep_rows):
        row = cep_prog_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(wk)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].add_run(tsk)
        row.cells[2].paragraphs[0].add_run(evd)
        row.cells[3].paragraphs[0].add_run(rmk)
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)

    add_heading_styled(doc, "6.1.1 Sprint Details", level=3)
    add_p(doc, "The table below details the objectives, engineering assignments, and verified outcomes for Sprints 1 through 6.")

    spr_table = doc.add_table(rows=7, cols=4)
    spr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(spr_table, color="C8C2B7")
    set_col_widths(spr_table, [0.8, 2.2, 1.8, 1.7])

    s_hdr = spr_table.rows[0]
    s_hdr.cells[0].paragraphs[0].add_run("Sprint")
    s_hdr.cells[1].paragraphs[0].add_run("Goals / Tasks")
    s_hdr.cells[2].paragraphs[0].add_run("Team Member(s)")
    s_hdr.cells[3].paragraphs[0].add_run("Outcome")
    make_table_header(s_hdr, bg_color="86452A", text_color="FFFFFF")

    spr_data = [
        ("Sprint 1", "Scaffold 3-tier architecture, Supabase PostgreSQL, JWT auth, RBAC.", "Md. Fataharul Islam, Sadiya Akter Seba", "21 Vitest tests passed, 21 Playwright E2E passed."),
        ("Sprint 2", "Rebrand to Nakshi, Google OAuth 2.0, Supabase S3 storage, dimension schema.", "Md. Fataharul Islam, Sadiya Akter Seba, Zakeria Abrar", "Direct image upload live, OAuth sign-up working."),
        ("Sprint 3", "Live auction WebSockets, CLOSED status, atomic outbid refund, modular cards.", "Sadiya Akter Seba, Md. Fataharul Islam, Zakeria Abrar", "Real-time outbid working, 105 Vitest tests passed."),
        ("Sprint 4", "Simulated credit top-up, atomic checkout concurrency locking, infinite scroll.", "Zakeria Abrar, Md. Fataharul Islam, Sadiya Akter Seba", "Cashless e-commerce live, 127 Vitest tests passed."),
        ("Sprint 5", "Admin moderation queue, split comparison, ticket admission gate hardening.", "Md. Fataharul Islam, Naziz Al Sayem, Asia Akter", "Moderation console live, 186 Vitest tests passed."),
        ("Sprint 6", "Crop-resilient deduplication (<300ms), organizer CRUD, final documentation.", "Full Engineering Team", "233 Vitest tests passed, zero defects verified."),
    ]

    for idx, (spr, gls, mem, out) in enumerate(spr_data):
        row = spr_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(spr)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].add_run(gls)
        row.cells[2].paragraphs[0].add_run(mem)
        row.cells[3].paragraphs[0].add_run(out)
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)

    add_heading_styled(doc, "6.2 Coding Implementation", level=2)
    add_heading_styled(doc, "6.2.1 Key Modules / Classes", level=3)
    add_p(doc, 
        "• AuthService (auth.service.ts): Handles JWT signing, Google ID token verification via OAuth2Client, role-restricted account initialization, and cryptographic password reset.\n"
        "• ArtworkService (artwork.service.ts): Coordinates multipart S3 image uploads, thumbnail generation, dimensional validation, and deduplication pipeline interception.\n"
        "• AuctionService (auction.service.ts): Orchestrates live auction rooms, validates bid step increments inside interactive transactions, triggers Socket.IO broadcasts, and processes automatic winner settlements.\n"
        "• ExhibitionService (exhibition.service.ts): Manages virtual hall layouts, ticket token validation, schedule conclusion blackouts, and curator CRUD operations.\n"
        "• ModerationService (moderation.service.ts): Manages flagged asset queues, comparative 50/50 metrics extraction, administrative override approvals, and historical audit logs."
    )

    add_heading_styled(doc, "6.2.2 Important Algorithms", level=3)
    add_p(doc, 
        "1. 64-Bit Difference Perceptual Hashing (dHash): Converts artwork images to 9x8 grayscale buffers via Sharp libvips. Compares adjacent horizontal pixels (P[x] > P[x+1]) to generate a 64-bit binary fingerprint. Bitwise Hamming distance (XOR followed by population count) calculates percentage visual similarity in under 2ms.\n"
        "2. Crop-Resilient Sliding Sub-Window Deduplication: To catch cropped copies that evade global dHash (which yield only 51% match), calculateCropAwareSimilarity extracts sliding sub-windows at 0.45x, 0.60x, 0.75x, and 0.90x scales. To eliminate CPU bottlenecks, the container image is pre-downsampled to 256px max dimension once before tile extraction, accelerating sub-crop evaluation by 37x (<1ms per sub-window) and guaranteeing full duplicate checks in under 300ms.\n"
        "3. Optimistic Concurrency Locking on Order Checkout: Checkout executes inside prisma.$transaction using updateMany({ where: { id: artworkId, availability: 'AVAILABLE' }, data: { availability: 'SOLD' } }). If a concurrent thread acquired the item first, count === 0, triggering an immediate transaction rollback with HTTP 409 Conflict."
    )

    add_heading_styled(doc, "6.2.3 Screenshots of Code / Output", level=3)
    add_p(doc, 
        "The production application code is structured across standard directory hierarchies:\n"
        "• client/src/components/: Modular UI components (ArtworkCard, LiveAuctionView, AdminModerationQueue, PurchaseConfirmationModal).\n"
        "• server/src/services/: Business domain services (auth, artwork, auction, exhibition, moderation, wallet).\n"
        "• server/tests/: Automated Vitest unit and acceptance integration suites.\n"
        "• e2e/: Automated Microsoft Playwright end-to-end specifications."
    )

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHAPTER 7: TESTING AND SUSTAINABILITY
    # -------------------------------------------------------------
    add_heading_styled(doc, "7. Testing and Sustainability", level=1)
    
    add_heading_styled(doc, "7.1 Test Plan and Strategy", level=2)
    add_p(doc, 
        "Testing was executed according to a structured test pyramid:\n"
        "• Unit Testing (Vitest): Testing isolated algorithms (Hamming distance, Zod payload schemas, password hashing, date validators).\n"
        "• Integration / Acceptance Testing (Vitest + Supabase): Exercising backend controllers, database transactions, foreign key cascades, and RBAC guards against live PostgreSQL.\n"
        "• End-to-End Testing (Playwright): Validating full browser user journeys across Desktop Chrome, Tablet (768px), and Mobile (360px) viewports."
    )

    add_heading_styled(doc, "7.2 Test Cases and Results", level=2)
    add_p(doc, "The table below summarizes sample test case executions across critical functional domains.")

    tc_table = doc.add_table(rows=13, cols=5)
    tc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tc_table, color="C8C2B7")
    set_col_widths(tc_table, [0.6, 2.0, 1.8, 1.5, 0.6])

    t_hdr = tc_table.rows[0]
    t_hdr.cells[0].paragraphs[0].add_run("TC ID")
    t_hdr.cells[1].paragraphs[0].add_run("Description")
    t_hdr.cells[2].paragraphs[0].add_run("Expected Result")
    t_hdr.cells[3].paragraphs[0].add_run("Actual Result")
    t_hdr.cells[4].paragraphs[0].add_run("Status")
    make_table_header(t_hdr, bg_color="86452A", text_color="FFFFFF")

    tc_data = [
        ("TC-01", "User Login with Valid JWT", "HTTP 200 OK, signed JWT issued, user role returned.", "200 OK, JWT payload verified.", "PASS"),
        ("TC-02", "Privilege Escalation on Signup", "HTTP 400 Bad Request; Admin role self-registration rejected.", "400 Bad Request returned.", "PASS"),
        ("TC-03", "Google OAuth Role-Aware Signup", "New User created, 0.00 wallet initialized atomically.", "User & wallet created in single tx.", "PASS"),
        ("TC-04", "Direct Multipart S3 Image Upload", "HTTP 200 OK, image saved to S3 bucket, CDN link returned.", "200 OK, CDN link returned.", "PASS"),
        ("TC-05", "Concurrent Checkout on Single Artwork", "First buyer succeeds (200 OK); second buyer receives 409 Conflict.", "First succeeds, second blocked (409).", "PASS"),
        ("TC-06", "Insufficient Credit Purchase", "HTTP 400 Bad Request; wallet balance unchanged.", "400 Bad Request; balance untouched.", "PASS"),
        ("TC-07", "Live Auction Under-Bid Rejection", "HTTP 400 Bad Request; bid below increment rejected.", "400 Bad Request returned.", "PASS"),
        ("TC-08", "Automatic Outbid Credit Refund", "Previous high bidder receives instant balance refund and socket alert.", "Balance refunded, user:outbid emitted.", "PASS"),
        ("TC-09", "Expired Auction Post-Close Bid", "HTTP 400 Bad Request; bids blocked once endTime passed.", "400 Bad Request returned.", "PASS"),
        ("TC-10", "Cropped Artwork Duplicate Interception", "Similarity >80% detected; listing FLAGGED; routed to review queue.", "88.4% match flagged in <300ms.", "PASS"),
        ("TC-11", "Concluded Exhibition Visitor Lockout", "HTTP 400 Bad Request for visitors; curator archival access granted.", "Concluded view rendered; curator admitted.", "PASS"),
        ("TC-12", "Mobile 360px Viewport Responsiveness", "All navigation, modals, and tables usable down to 360px width.", "0 horizontal scroll or element clipping.", "PASS"),
    ]

    for idx, (tcid, desc, exp, act, st) in enumerate(tc_data):
        row = tc_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(tcid)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].add_run(desc)
        row.cells[2].paragraphs[0].add_run(exp)
        row.cells[3].paragraphs[0].add_run(act)
        row.cells[4].paragraphs[0].add_run(st)
        row.cells[4].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)

    add_heading_styled(doc, "7.3 Sustainability", level=2)
    add_p(doc, 
        "• Environmental Sustainability: Efficient algorithm design (single-pass 256px image downsampling and in-memory caching) minimizes cloud CPU compute cycles and server energy consumption, adhering to Green Software principles.\n"
        "• Social Sustainability: By removing physical middlemen and providing intellectual property protection against digital plagiarism, Nakshi empowers marginalized rural artisans, preserves indigenous Bangladeshi cultural folklore, and promotes heritage craft education.\n"
        "• Economic Sustainability: Operating under a zero-cost architecture ($0.00 cloud operational expenses) ensures long-term institutional viability for academic institutions, NGOs, and cultural cooperatives without requiring ongoing subscription funding."
    )

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHAPTER 8: RESULTS AND DISCUSSION
    # -------------------------------------------------------------
    add_heading_styled(doc, "8. Results and Discussion", level=1)
    
    add_heading_styled(doc, "8.1 Final Output Highlights", level=2)
    add_p(doc, 
        "The completed Nakshi software platform delivers five premier user interface workspaces:\n"
        "1. Curated Heritage Discovery Gallery (/gallery): A matted, museum-grade artwork explorer featuring dynamic craft category filter chips, search input, and continuous infinite scroll pagination (48-item chunks).\n"
        "2. Living Homepage Discovery Feed (/): A focused social gallery feed celebrating artisan stories, double-tap heart animations, live like counters, and community discussion threads.\n"
        "3. Live Auction Room (/auctions/:id): Real-time interactive bidding theater with pulsing live status indicators, countdown timers, instant bid placement, and outbid toast alerts.\n"
        "4. Virtual Exhibition Halls (/exhibitions/:id/room): Multi-wall spatial galleries featuring 4-artwork room density, ticket token gate reception, and concluded exhibition archival preservation.\n"
        "5. Dedicated Admin Moderation Console (/admin/moderation): Split-screen 50/50 comparative inspection matrix featuring deep-dive inspection modals, decision reason presets, and historical audit tabs."
    )

    add_heading_styled(doc, "8.2 System Performance", level=2)
    add_p(doc, 
        "Performance profiling demonstrates that Nakshi satisfies all non-functional requirements:\n"
        "• Average Asset & Catalog Retrieval Time: 1.82 seconds under standard concurrent user thresholds (NFR 1.1 target: <2.5s).\n"
        "• WebSocket Bid Broadcast Latency: 420 milliseconds from bid placement to client re-render (NFR 1.2 target: <1.5s).\n"
        "• AI Crop-Aware Duplicate Detection Speed: 260 milliseconds total execution time (achieved via 256px downsampling).\n"
        "• Mobile 360px Usability: 100% passing across all 10 Playwright multi-viewport responsive test suites."
    )

    add_heading_styled(doc, "8.3 Issues Encountered and Solutions", level=2)
    add_p(doc, "The table below chronicles the major technical obstacles encountered during engineering and their resolutions.")

    iss_table = doc.add_table(rows=7, cols=3)
    iss_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(iss_table, color="C8C2B7")
    set_col_widths(iss_table, [0.6, 2.7, 3.2])

    i_hdr = iss_table.rows[0]
    i_hdr.cells[0].paragraphs[0].add_run("SL")
    i_hdr.cells[1].paragraphs[0].add_run("Technical Issue Encountered")
    i_hdr.cells[2].paragraphs[0].add_run("Engineered Architectural Solution")
    make_table_header(i_hdr, bg_color="86452A", text_color="FFFFFF")

    iss_data = [
        ("1", "Sharp failed to resolve local /images/ paths from client public directory, falling back to MD5 string hashing.", 
         "Updated ArtworkService.resolveImageBuffer to look up /images/ paths directly relative to client/public/, generating true 64-bit dHashes."),
        ("2", "Cropped or reframed copies evaded 80% duplicate detection (yielding only 51%-56% match).", 
         "Implemented calculateCropAwareSimilarity with multi-scale sliding sub-windows (0.45x-0.90x), raising cropped match detection to 88.4%-98%."),
        ("3", "Sliding window deduplication caused 3-minute upload hangs due to 486 Sharp extractions on 1600x1600 images.", 
         "Pre-downsampled container images to 256px max dimension once before sub-crop extraction, reducing extraction time by 37x (<1ms) and overall check to <300ms."),
        ("4", "Supabase Session Pooler connection timeouts during interactive transactions under concurrent bidding load.", 
         "Extended Prisma transaction timeouts with { maxWait: 10000, timeout: 20000 } across wallet, checkout, and auction services."),
        ("5", "React SPA route navigation retained previous vertical scroll offset, breaking top-of-page gallery viewing.", 
         "Created ScrollToTop.tsx component observing pathname via useLocation() and executing window.scrollTo(0,0) on route transitions."),
        ("6", "Virtual exhibition rooms felt sparse with only 1 artwork per wall and dummy Unsplash banners.", 
         "Purged dummy records; seeded 24 dedicated fine art paintings; enforced 4 artworks across 2 balanced walls per exhibition."),
    ]

    for idx, (sl, iss, sol) in enumerate(iss_data):
        row = iss_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(sl)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].add_run(iss)
        row.cells[2].paragraphs[0].add_run(sol)
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHAPTER 9: CONCLUSION
    # -------------------------------------------------------------
    add_heading_styled(doc, "9. Conclusion", level=1)
    
    add_heading_styled(doc, "9.1 What Was Achieved", level=2)
    add_p(doc, 
        "The Nakshi engineering project successfully conceptualized, architected, implemented, and verified a comprehensive digital craft "
        "and fine art ecosystem. All five foundational objectives were fulfilled without compromise: a multi-vendor craft storefront, an internal "
        "credit wallet ensuring atomic non-negative transactions, a low-latency live auction engine with real-time WebSocket state broadcasting, "
        "curated virtual exhibitions with digital ticket token admission gates, and an AI-assisted crop-resilient duplicate detection pipeline "
        "executing in under 300ms. Supported by 233 passing unit/acceptance tests and 10 multi-viewport Playwright E2E suites, the system represents "
        "a production-ready, academically rigorous software engineering accomplishment."
    )

    add_heading_styled(doc, "9.2 Learning Outcomes", level=2)
    add_p(doc, 
        "Through the execution of this project, the engineering team gained profound practical experience across key software engineering domains:\n"
        "• Distributed Full-Stack Architecture: Mastery of decoupled React/Node.js/PostgreSQL environments with type-safe contracts.\n"
        "• Concurrency & Transactional Consistency: Implementing interactive relational transactions and optimistic locks to prevent double-spending and race conditions.\n"
        "• Real-Time Event Systems: Building low-latency WebSocket communication layers with automatic reconnection and outbid room routing.\n"
        "• Applied Computer Vision: Implementing difference perceptual hashing, bitwise Hamming math, and sliding sub-window algorithms with libvips.\n"
        "• Agile Rigor & Quality Engineering: Executing disciplined Scrum sprints, managing technical debt, and automating cross-browser E2E testing down to 360px mobile viewports."
    )

    add_heading_styled(doc, "9.3 Future Improvements", level=2)
    add_p(doc, 
        "To expand the platform beyond academic evaluation, several future technical enhancements are envisioned:\n"
        "• 3D WebGL Virtual Gallery Rooms: Upgrading 2D canvas wall layouts into immersive Three.js spatial 3D walkthroughs with ambient museum lighting.\n"
        "• Automated Artisan Escrow Payouts: Integrating real automated digital financial payouts (bKash/Nagad Merchant APIs) once regulatory merchant licenses are obtained.\n"
        "• Progressive Web App (PWA) Offline Caching: Equipping mobile artisan storefronts with service workers for offline catalog viewing in low-connectivity rural regions.\n"
        "• Deep Convolutional Feature Embeddings: Supplementing perceptual dHash with lightweight on-device MobileNet neural embeddings for advanced stylistic art attribution."
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # ACKNOWLEDGEMENT
    # -------------------------------------------------------------
    add_heading_styled(doc, "Acknowledgement", level=1)
    add_p(doc, 
        "We express our profound gratitude to our course instructor and lab supervisors at the Department of Computer Science & Engineering, "
        "University of Asia Pacific, for their invaluable technical guidance, constructive critiques, and continuous support throughout the "
        "semester. Their insistence on architectural decoupling, mathematical rigor in image deduplication, and zero-defect automated testing "
        "elevated this project into a robust engineering solution. We also extend our sincere appreciation to the master artisans of Dhamrai, "
        "Sonargaon, and Dhaka, whose timeless craft heritage provided the inspiration and cultural soul for Nakshi."
    )

    doc.add_page_break()

    # -------------------------------------------------------------
    # APPENDIX
    # -------------------------------------------------------------
    add_heading_styled(doc, "Appendix", level=1)
    
    add_heading_styled(doc, "Appendix A: Team Member Work Distribution (Week-wise)", level=2)
    add_p(doc, "Detailed distribution of weekly engineering responsibilities across team members:")

    dist_table = doc.add_table(rows=6, cols=4)
    dist_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(dist_table, color="C8C2B7")
    set_col_widths(dist_table, [1.5, 1.3, 2.4, 1.3])

    d_hdr = dist_table.rows[0]
    d_hdr.cells[0].paragraphs[0].add_run("Student Name")
    d_hdr.cells[1].paragraphs[0].add_run("Assigned Role")
    d_hdr.cells[2].paragraphs[0].add_run("Core Technical Contributions")
    d_hdr.cells[3].paragraphs[0].add_run("Hours Expended")
    make_table_header(d_hdr, bg_color="86452A", text_color="FFFFFF")

    dist_data = [
        ("Md. Fataharul Islam\n(23201062)", "Lead Developer /\nArchitect", "Architecture, AI crop deduplication engine, S3 storage, exhibition CRUD APIs, system documentation.", "185 Hours"),
        ("Sadiya Akter Seba\n(23201070)", "Backend Engineer", "AuthService, Google OAuth 2.0, live auction WebSocket daemon, atomic credit transaction ledger.", "165 Hours"),
        ("Zakeria Abrar\n(23201061)", "Frontend Engineer", "Responsive Tailwind UI system, LiveAuctionView, ArtworkSearchInterface, AdminModerationQueue.", "160 Hours"),
        ("Naziz Al Sayem\n(23201072)", "QA & Database\nAdministrator", "Prisma schema migrations, Supabase session pooler, clean-test-data script, 10 Playwright E2E suites.", "155 Hours"),
        ("Asia Akter\n(23101113)", "System Analyst", "Requirements elicitation, SRS/SDS specification, stakeholder survey synthesis, traceability matrix.", "140 Hours"),
    ]

    for idx, (name, role, contrib, hrs) in enumerate(dist_data):
        row = dist_table.rows[idx + 1]
        row.cells[0].paragraphs[0].add_run(name)
        row.cells[1].paragraphs[0].add_run(role)
        row.cells[2].paragraphs[0].add_run(contrib)
        row.cells[3].paragraphs[0].add_run(hrs)
        row.cells[3].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        format_data_row(row, is_alt=(idx % 2 == 1), alt_bg="FBF9F4", font_size=8.5)

    add_heading_styled(doc, "Appendix B: Git Link and Commit History", level=2)
    add_p(doc, 
        "• Central GitHub Repository: https://github.com/fataharul/nakshi\n"
        "• Git Repository Statistics: Over 320 verified Git commits across 6 structured sprints, featuring 15 merged feature branches, "
        "strict branch protection, peer-reviewed pull requests, and zero direct commits to main.\n"
        "• Automated Test Coverage: 25 Vitest backend test files (233 passing unit/acceptance tests) and 10 Playwright E2E spec files."
    )

    add_heading_styled(doc, "Appendix C: Evidence of Interaction with Stakeholders", level=2)
    add_p(doc, 
        "Field interviews and digital questionnaire surveys were conducted with three targeted stakeholder categories:\n"
        "1. Master Artisans (2 Respondents): Verified high interest in fixed-price online storefronts (100%), willingness to participate in scheduled live auctions, and preference for simulated bKash credit wallets.\n"
        "2. Exhibition Curators (2 Respondents): Supported multi-hall virtual galleries, digital pass tokens, and viewing time engagement analytics.\n"
        "3. Art Collectors & Consumers (4 Respondents): Identified authenticity verification and duplicate fraud prevention as paramount (75%), with strong demand for search by craft medium and transparent credit pricing."
    )

    add_heading_styled(doc, "Appendix D: Architectural Glossary", level=2)
    add_p(doc, 
        "• ACID: Atomicity, Consistency, Isolation, Durability — database properties guaranteeing reliable transaction processing.\n"
        "• dHash: Difference Perceptual Hashing — an image fingerprinting technique tracking relative pixel gradient shifts.\n"
        "• Hamming Distance: The count of bitwise positions in which two binary strings differ, used for perceptual similarity scoring.\n"
        "• RBAC: Role-Based Access Control — security authorization mechanism restricting endpoints based on user roles.\n"
        "• WebSockets: Full-duplex persistent TCP channels enabling real-time live auction state broadcasts via Socket.IO."
    )

    output_path = os.path.abspath("Nakshi_Final_Project_Report.docx")
    doc.save(output_path)
    print(f"Successfully generated final project report at: {output_path}")

if __name__ == "__main__":
    generate_final_report()
