"""Convert the complete ClimateSense Odisha Markdown report to a readable PDF."""
from html import escape
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Preformatted, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/ClimateSense_Odisha_Complete_Project_Report.md"
OUTPUT = ROOT / "docs/ClimateSense_Odisha_Complete_Project_Report.pdf"


def inline_markup(text: str) -> str:
    value = escape(text, quote=False)
    value = re.sub(r"`([^`]+)`", r'<font name="ClimateMono">\1</font>', value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", value)
    return value


def table_from_lines(lines: list[str], styles: dict[str, ParagraphStyle]) -> Table:
    rows = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(set(cell) <= {"-", ":", " "} for cell in cells):
            continue
        rows.append([Paragraph(inline_markup(cell), styles["table"]) for cell in cells])
    table = Table(rows, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f4e79")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#9aa7b2")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#eef4f8")]),
    ]))
    return table


def build_story(text: str, styles: dict[str, ParagraphStyle]) -> list:
    story = []
    paragraph_lines: list[str] = []
    code_lines: list[str] = []
    table_lines: list[str] = []
    in_code = False

    def flush_paragraph() -> None:
        if paragraph_lines:
            story.append(Paragraph(inline_markup(" ".join(paragraph_lines)), styles["body"]))
            story.append(Spacer(1, 3 * mm))
            paragraph_lines.clear()

    def flush_table() -> None:
        if table_lines:
            story.append(table_from_lines(table_lines, styles))
            story.append(Spacer(1, 4 * mm))
            table_lines.clear()

    def flush_code() -> None:
        if code_lines:
            story.append(Preformatted("\n".join(code_lines), styles["code"]))
            story.append(Spacer(1, 3 * mm))
            code_lines.clear()

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if line.startswith("```"):
            flush_paragraph(); flush_table()
            if in_code:
                flush_code()
            in_code = not in_code
            continue
        if in_code:
            code_lines.append(line)
            continue
        if line.startswith("|"):
            flush_paragraph()
            table_lines.append(line)
            continue
        if table_lines:
            flush_table()
        if not line.strip():
            flush_paragraph()
            continue
        if line.startswith("### "):
            flush_paragraph(); story.append(Paragraph(inline_markup(line[4:]), styles["h3"])); story.append(Spacer(1, 2 * mm)); continue
        if line.startswith("## "):
            flush_paragraph(); story.append(Paragraph(inline_markup(line[3:]), styles["h2"])); story.append(Spacer(1, 2 * mm)); continue
        if line.startswith("# "):
            flush_paragraph(); story.append(Paragraph(inline_markup(line[2:]), styles["title"])); story.append(Spacer(1, 4 * mm)); continue
        if line.startswith("- "):
            flush_paragraph(); story.append(Paragraph("• " + inline_markup(line[2:]), styles["body"])); continue
        if re.match(r"^\d+\. ", line):
            flush_paragraph(); story.append(Paragraph(inline_markup(line), styles["body"])); continue
        paragraph_lines.append(line)
    flush_paragraph(); flush_table(); flush_code()
    return story


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Report source not found: {SOURCE}")
    font_dir = Path("C:/Windows/Fonts")
    if (font_dir / "arial.ttf").exists():
        pdfmetrics.registerFont(TTFont("ClimateSans", str(font_dir / "arial.ttf")))
        pdfmetrics.registerFont(TTFont("ClimateSansBold", str(font_dir / "arialbd.ttf")))
        pdfmetrics.registerFont(TTFont("ClimateMono", str(font_dir / "cour.ttf")))
        font = "ClimateSans"; bold = "ClimateSansBold"; mono = "ClimateMono"
    else:
        font = "Helvetica"; bold = "Helvetica-Bold"; mono = "Courier"
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle("ClimateTitle", parent=base["Title"], fontName=bold, fontSize=20, leading=25, alignment=TA_CENTER, textColor=colors.HexColor("#163a5f"), spaceAfter=8),
        "h2": ParagraphStyle("ClimateH2", parent=base["Heading2"], fontName=bold, fontSize=14, leading=18, textColor=colors.HexColor("#1f4e79"), keepWithNext=True),
        "h3": ParagraphStyle("ClimateH3", parent=base["Heading3"], fontName=bold, fontSize=11, leading=14, textColor=colors.HexColor("#2f5597"), keepWithNext=True),
        "body": ParagraphStyle("ClimateBody", parent=base["BodyText"], fontName=font, fontSize=9.5, leading=13, spaceAfter=2),
        "table": ParagraphStyle("ClimateTable", parent=base["BodyText"], fontName=font, fontSize=7.5, leading=9),
        "code": ParagraphStyle("ClimateCode", parent=base["Code"], fontName=mono, fontSize=7.5, leading=9, backColor=colors.HexColor("#f1f3f5"), borderPadding=5),
    }
    document = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=16 * mm, leftMargin=16 * mm, topMargin=15 * mm, bottomMargin=15 * mm, title="ClimateSense Odisha Complete Project Report", author="ClimateSense Odisha")
    document.build(build_story(SOURCE.read_text(encoding="utf-8"), styles))
    print(f"Created PDF: {OUTPUT}")


if __name__ == "__main__":
    main()
