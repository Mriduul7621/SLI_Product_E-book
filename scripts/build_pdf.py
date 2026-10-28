#!/usr/bin/env python3
"""
Build the branded PDF edition of
"গল্পে গল্পে শিখি — শান্তা লাইফের বিমা প্রোডাক্ট".

Design follows the Shanta Life brand guidelines:
  Charcoal Grey #3C3C3B · Olive Green #978C21 · Sunset Orange #F37021
  Secondary: Blue #026A8B · Brown #7F2D23 · Green #254525 · Plum #583382 · Seashell #FCF4EB

Requirements:  pip install fpdf2 uharfbuzz
Usage:         python3 scripts/build_pdf.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from fpdf import FPDF
from fpdf.enums import MethodReturnValue, RenderStyle, XPos, YPos
from fpdf.fonts import FontFace

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "src/data/ebookContent.json").read_text(encoding="utf-8"))
FONTS = Path(__file__).resolve().parent / "fonts"
IMG = ROOT / "public/assets/img"
OUT = ROOT / "public/shanta-life-ebook.pdf"

SALES_DIR = ROOT / "src/data/sales"
STORIES = {
    entry["chapterId"]: entry
    for entry in json.loads((SALES_DIR / "stories.json").read_text(encoding="utf-8"))["chapters"]
}
MASTERY = json.loads((SALES_DIR / "mastery.json").read_text(encoding="utf-8"))
SALES = {
    cid: json.loads((SALES_DIR / f"{cid}.json").read_text(encoding="utf-8"))
    for cid in ("endowment", "s4pp", "scep", "sspe", "sdpp", "riders")
}

# ----------------------------------------------------------------- brand ---
CHARCOAL = (60, 60, 59)
CHARCOAL_DEEP = (38, 38, 37)
CHARCOAL_SOFT = (110, 110, 108)
INK = (43, 43, 42)
OLIVE = (151, 140, 33)
OLIVE_DEEP = (111, 102, 20)
OLIVE_TINT = (243, 240, 217)
OLIVE_WASH = (250, 248, 236)
SUNSET = (243, 112, 33)
SUNSET_DEEP = (200, 84, 15)
SUNSET_SOFT = (253, 238, 227)
SHELL = (252, 244, 235)
SHELL_DEEP = (243, 231, 214)
CLAY = (127, 45, 35)
CLAY_SOFT = (251, 241, 236)
FOREST = (37, 69, 37)
FOREST_SOFT = (238, 245, 236)
PLUM = (88, 51, 130)
PLUM_SOFT = (241, 236, 247)
STEEL = (2, 106, 139)
WHITE = (255, 255, 255)

PAGE_W, PAGE_H = 210, 297
ML, MR, MT, MB = 17, 17, 20, 19
CW = PAGE_W - ML - MR

BN_DIGITS = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")


def bn(value) -> str:
    return str(value).translate(BN_DIGITS)


def chapter_visual_map() -> dict:
    return {
        "endowment": IMG / "scene-endowment.jpg",
        "s4pp": IMG / "scene-s4pp.jpg",
        "scep": IMG / "scene-scep.jpg",
        "sspe": IMG / "scene-sspe.jpg",
        "sdpp": IMG / "scene-sdpp.jpg",
        "riders": IMG / "scene-riders.jpg",
    }


VISUAL_CAPTIONS = {
    "endowment": "মেয়াদ শেষে নিশ্চিত মূলধন, মেয়াদজুড়ে পরিবারের নিরাপত্তা",
    "s4pp": "মেয়াদের মাঝেই তারল্য — চার ধাপে বীমাঙ্কের অর্থ",
    "scep": "পিতামাতার অবর্তমানেও থেমে থাকে না সন্তানের পড়াশোনা",
    "sspe": "একবারের বিনিয়োগে দীর্ঘমেয়াদি নিশ্চিন্ততা",
    "sdpp": "নমনীয় সঞ্চয় আর স্বাস্থ্য সুরক্ষা — একই পলিসিতে",
    "riders": "সঠিক রাইডার যুক্ত করলেই ৩৬০-ডিগ্রি সুরক্ষা বলয়",
}


def prepare_cover_bg() -> Path:
    """Composite a smooth brand gradient over the cover artwork (cached)."""
    src = IMG / "cover-art.jpg"
    dst = IMG / "cover-bg.jpg"
    if dst.exists() and dst.stat().st_mtime > src.stat().st_mtime:
        return dst
    from PIL import Image, ImageDraw, ImageFilter

    art = Image.open(src).convert("RGB")
    W, H = 1240, 1754
    art = art.resize((W, H), Image.LANCZOS)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for y in range(H):
        t = min(1.0, y / (H * 0.74))
        alpha = int(255 * (0.955 - 0.80 * (abs(t) ** 1.35)))
        d.line([(0, y), (W, y)], fill=(30, 30, 29, max(0, alpha)))
    for y in range(int(H * 0.80), H):
        t = (y - H * 0.80) / (H * 0.20)
        d.line([(0, y), (W, y)], fill=(30, 30, 29, int(255 * (0.10 + 0.62 * abs(t) ** 1.6))))
    overlay = overlay.filter(ImageFilter.GaussianBlur(0.6))

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse([W - 430, -190, W + 120, 260], fill=(243, 112, 33, 34))
    g.ellipse([-260, 30, 250, 430], fill=(151, 140, 33, 30))
    glow = glow.filter(ImageFilter.GaussianBlur(90))

    out = Image.alpha_composite(art.convert("RGBA"), glow)
    out = Image.alpha_composite(out, overlay).convert("RGB")
    out.save(dst, quality=91, optimize=True, progressive=True)
    return dst


def prepare_back_cover_bg() -> Path:
    """Charcoal back cover with soft brand glows (no PDF transparency needed)."""
    dst = IMG / "back-cover-bg.jpg"
    if dst.exists():
        return dst
    from PIL import Image, ImageDraw, ImageFilter

    W, H = 1240, 1754
    base = Image.new("RGB", (W, H), (38, 38, 37))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse([W - 520, H - 640, W + 320, H + 240], fill=(243, 112, 33, 46))
    g.ellipse([-360, -420, 420, 320], fill=(151, 140, 33, 40))
    glow = glow.filter(ImageFilter.GaussianBlur(150))
    out = Image.alpha_composite(base.convert("RGBA"), glow).convert("RGB")
    out.save(dst, quality=90, optimize=True, progressive=True)
    return dst



# --------------------------------------------------------------------------
# Bengali-safe text layout
#
# fpdf2's word-wrapping path re-shapes fragments and can corrupt conjuncts
# (e.g. "মোট" -> "মোট" with stray dotted circles). Bengali clusters never span
# a space, so we wrap at spaces ourselves and paint every word with cell().
# --------------------------------------------------------------------------
def wrap_words(pdf: "Book", text: str, width: float, size: float) -> list[list[str]]:
    """Greedy word wrap based on rendered word widths."""
    pdf.set_font("bn", "", size)
    space_w = pdf.get_string_width(" ")
    lines: list[list[str]] = []
    current: list[str] = []
    current_w = 0.0
    for word in str(text).replace("\u00a0", " ").split(" "):
        if not word:
            continue
        w = pdf.get_string_width(word)
        if w > width and not current:
            # extremely long token: hard-split on characters as a fallback
            chunk = ""
            for ch in word:
                if pdf.get_string_width(chunk + ch) > width and chunk:
                    lines.append([chunk])
                    chunk = ch
                else:
                    chunk += ch
            if chunk:
                current = [chunk]
                current_w = pdf.get_string_width(chunk)
            continue
        needed = w if not current else current_w + space_w + w
        if needed > width and current:
            lines.append(current)
            current = [word]
            current_w = w
        else:
            current.append(word)
            current_w = needed
    if current:
        lines.append(current)
    return lines or [[]]


def paint_paragraph(
    pdf: "Book",
    text: str,
    width: float,
    line_h: float,
    size: float,
    color,
    align: str = "L",
    dry_run: bool = False,
) -> tuple[int, float]:
    """Draw (or measure) a wrapped paragraph word by word. Returns (lines, height)."""
    pdf.set_font("bn", "", size)
    pdf.text_color = color
    lines = wrap_words(pdf, text, width, size)
    space_w = pdf.get_string_width(" ")
    x0 = pdf.l_margin if abs(pdf.x - pdf.l_margin) < 0.01 else pdf.x
    y0 = pdf.y
    if dry_run:
        return len(lines), len(lines) * line_h

    x = x0
    y = y0
    for idx, words in enumerate(lines):
        widths = [pdf.get_string_width(w) for w in words]
        natural = sum(widths) + space_w * (len(words) - 1 if len(words) > 1 else 0)
        gap = space_w
        if align in ("J", "F") and idx < len(lines) - 1 and len(words) > 1:
            slack = width - natural
            if slack > 0:
                gap = space_w + slack / (len(words) - 1)
        line_w = sum(widths) + gap * (len(words) - 1 if len(words) > 1 else 0)
        if align in ("C", "Q"):
            cx = x0 + max(0.0, (width - line_w) / 2)
        elif align in ("R", "W"):
            cx = x0 + max(0.0, width - line_w)
        else:
            cx = x
        for w, word in zip(widths, words):
            pdf.set_xy(cx, y)
            pdf.cell(w + 0.4, line_h, word, align="L")
            cx += w + gap
        y += line_h
    pdf.set_xy(x0, y)
    return len(lines), y - y0


class Book(FPDF):
    def __init__(self) -> None:
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(True, margin=MB)
        self.set_margins(ML, MT, MR)
        self.set_text_shaping(True)
        for style, filename in (
            ("", "NotoSansBengali-Regular.ttf"),
            ("B", "NotoSansBengali-Bold.ttf"),
        ):
            self.add_font("bn", style, str(FONTS / filename))
            self.add_font("bns", style, str(FONTS / filename))
        self.c_margin = 1.6
        self._no_wrap_override = False
        self.running_label = ""
        self.cover_mode = False
        self.no_chrome: set[int] = set()

    # --------------------------------------------------------------- text --
    def multi_cell(
        self,
        w,
        h=None,
        text="",
        border=0,
        align="J",
        fill=False,
        split_only=False,
        link="",
        ln="DEPRECATED",
        max_line_height=None,
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
        dry_run=False,
        output=MethodReturnValue.HEIGHT,
        align_text=None,
        **_kwargs,
    ):
        """Word-safe replacement for multi_cell (Bengali shaping safe)."""
        if self._no_wrap_override:
            return super().multi_cell(
                w, h, text, border, align, fill, split_only, link, ln,
                max_line_height, new_x, new_y, dry_run, output, **_kwargs,
            )
        width = w if w and w > 0 else (self.w - self.r_margin - self.x)
        line_h = h if h else None
        if line_h is None:
            line_h = self.get_string_width("x") and 5.4
        text = "" if text is None else str(text)
        size = self.font_size_pt
        color = self.text_color

        def measure(txt: str) -> tuple[int, float]:
            return paint_paragraph(self, txt, width, line_h, size, color, align, dry_run=True)

        if dry_run or split_only:
            n_lines, height = measure(text)
            if split_only:
                return [
                    " ".join(words)
                    for words in wrap_words(self, text, width, size)
                ]
            if output == MethodReturnValue.LINES:
                return wrap_words(self, text, width, size)
            return height

        # paint, handling page breaks paragraph by paragraph
        remaining = text
        n_lines, height = measure(remaining)
        if self.get_y() + height > self.page_break_trigger and self.get_y() + line_h <= self.page_break_trigger:
            pass
        lines_drawn, used = paint_paragraph(self, remaining, width, line_h, size, color, align)
        if new_y == YPos.NEXT:
            pass  # paint_paragraph already advanced y
        if new_x == XPos.RIGHT:
            self.set_x(self.x)
        elif new_x == XPos.LMARGIN:
            self.set_x(self.l_margin)
        # emulate fpdf's returned value
        if output == MethodReturnValue.LINES:
            return wrap_words(self, text, width, size)
        return used if output == MethodReturnValue.HEIGHT else None

    def ln(self, h=None):
        super().ln(h)
        return self

    # ------------------------------------------------------------ chrome --
    def header(self) -> None:
        if self.cover_mode or self.page_no() in self.no_chrome:
            return
        self.set_y(9)
        self.set_font("bn", "", 7.6)
        self.set_text_color(*CHARCOAL_SOFT)
        self.cell(120, 5, "গল্পে গল্পে শিখি · শান্তা লাইফ ইনস্যুরেন্স পিএলসি", align="L")
        self.set_font("bns", "", 6.4)
        label = self.running_label
        self.cell(CW - 120, 5, label, align="R")
        self.set_draw_color(*CHARCOAL)
        self.set_line_width(0.12)
        with self.local_context(stroke_opacity=0.22):
            self.line(ML, 15.5, PAGE_W - MR, 15.5)
        self.set_y(MT)

    def footer(self) -> None:
        if self.cover_mode or self.page_no() in self.no_chrome:
            return
        y = PAGE_H - 14
        with self.local_context(stroke_opacity=0.2):
            self.set_draw_color(*CHARCOAL)
            self.set_line_width(0.12)
            self.line(ML, y, PAGE_W - MR, y)
        self.set_y(y + 1.6)
        self.set_font("bns", "", 6.6)
        self.set_text_color(*CHARCOAL_SOFT)
        self.cell(90, 4, "SHANTA LIFE INSURANCE PLC", align="L")
        self.set_font("bn", "", 7.2)
        self.cell(CW - 90, 4, f"{bn(self.page_no())}", align="R")
        # tri-colour brand foot-rule
        self.set_fill_color(*OLIVE)
        self.rect(ML, PAGE_H - 8, 26, 1.1, RenderStyle.F)
        self.set_fill_color(*SUNSET)
        self.rect(ML + 26, PAGE_H - 8, 13, 1.1, RenderStyle.F)
        self.set_fill_color(*CHARCOAL)
        self.rect(ML + 39, PAGE_H - 8, 8, 1.1, RenderStyle.F)

    # ----------------------------------------------------------- helpers --
    def heading(self, text: str, size: float = 13, space_before: float = 5.4) -> None:
        self.ln(space_before)
        self.will_page_break(18)
        self.set_font("bn", "B", size)
        self.set_text_color(*CHARCOAL_DEEP)
        self.multi_cell(CW, size * 0.62, text, align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def sub_heading(self, text: str, color=CHARCOAL_DEEP) -> None:
        self.will_page_break(16)
        self.ln(2.4)
        y = self.get_y()
        self.set_fill_color(*OLIVE)
        self.rect(ML, y + 0.6, 1.1, 4.6, RenderStyle.F)
        self.set_x(ML + 3.4)
        self.set_font("bn", "B", 10.6)
        self.set_text_color(*color)
        self.multi_cell(CW - 3.4, 5.6, text, align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1.2)

    def body(self, text: str, size: float = 9.4, color=INK, align: str = "J") -> None:
        if self.get_y() > PAGE_H - MB - 10:
            self.add_page()
        self.set_font("bn", "", size)
        self.set_text_color(*color)
        self.multi_cell(CW, size * 0.60, text, align=align, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1.2)

    def bullet(self, text: str, size: float = 9.2, color=INK, indent: float = 5.0) -> None:
        self.will_page_break(12)
        if self.get_y() > PAGE_H - MB - 10:
            self.add_page()
        y = self.get_y()
        self.set_fill_color(*OLIVE)
        self.rect(ML + 1.4, y + 2.1, 1.5, 1.5, RenderStyle.F)
        self.set_xy(ML + indent, y)
        self.set_font("bn", "", size)
        self.set_text_color(*color)
        self.multi_cell(CW - indent, size * 0.60, text, align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(0.6)

    def panel(self, x: float, y: float, w: float, h: float, fill, bar=None, radius: float = 2.0) -> None:
        self.set_fill_color(*fill)
        self.rect(x, y, w, h, style=RenderStyle.F, round_corners=True, corner_radius=radius)
        if bar:
            self.set_fill_color(*bar)
            self.rect(x, y, 1.6, h, style=RenderStyle.F, round_corners=True, corner_radius=0.6)

    def callout(
        self,
        title: str,
        items: list[str],
        *,
        accent,
        fill,
        text_color,
        numbered: bool = False,
        icon: str = "",
    ) -> None:
        pad = 5.2
        inner_w = CW - pad * 2
        self.will_page_break(30)
        # measure
        heights = []
        self.set_font("bn", "", 9.0)
        for item in items:
            heights.append(
                self.multi_cell(
                    inner_w - 4,
                    5.6,
                    item,
                    dry_run=True,
                    output="HEIGHT",
                    align="L",
                )
            )
        block_h = 10.5 + sum(heights) + 3.4 * len(items) + pad
        block_h -= 5.7 + 2.3 * len(items)
        y0 = self.get_y()
        if y0 + block_h > PAGE_H - MB:
            self.add_page()
            y0 = self.get_y()
        self.panel(ML, y0, CW, block_h, fill, bar=accent)

        self.set_xy(ML + pad, y0 + pad - 1.6)
        self.set_font("bn", "B", 10.2)
        self.set_text_color(*accent)
        self.cell(inner_w, 5.6, (icon + " " if icon else "") + title, align="L")
        self.ln(6.4)

        self.set_font("bn", "", 9.0)
        self.set_text_color(*text_color)
        for i, item in enumerate(items):
            marker = f"{bn(i + 1)}. " if numbered else "• "
            self.set_x(ML + pad)
            self.set_text_color(*accent)
            self.cell(4.6, 5.6, marker, align="L")
            self.set_x(ML + pad + 4.4)
            self.set_text_color(*text_color)
            self.multi_cell(inner_w - 4.4, 5.6, item, align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.ln(1.1)
        if os.environ.get("SLI_DEBUG"):
            print(f"[callout] n={len(items)} allocated={block_h:.1f} used={self.get_y()-y0:.1f}")
        self.set_y(y0 + block_h + 5.0)

    def image_block(self, path: Path, caption: str, height: float = 74.0) -> None:
        self.will_page_break(height + 12)
        y = self.get_y()
        if self.get_y() + height + 9 > PAGE_H - MB:
            self.add_page()
            y = self.get_y()
        self.image(str(path), x=ML, y=y, w=CW, h=height)
        self.set_draw_color(*CHARCOAL)
        self.set_line_width(0.2)
        with self.local_context(stroke_opacity=0.15):
            self.rect(ML, y, CW, height, RenderStyle.D)
        # sunset corner accent
        self.set_draw_color(*SUNSET)
        self.set_line_width(0.9)
        self.line(ML, y, ML + 14, y)
        self.line(ML, y, ML, y + 14)
        self.set_xy(ML, y + height + 1.8)
        self.set_font("bn", "", 7.8)
        self.set_text_color(*CHARCOAL_SOFT)
        self.multi_cell(CW, 4.4, caption, align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(3.4)

    def stacked_panel(self, rows: list[dict], fill, bar=None, pad: float = 5.0) -> None:
        """Panel made of label/text blocks, measured exactly before drawing."""
        inner = CW - pad * 2
        measured = []
        for row in rows:
            size = row.get("size", 8.6)
            label = row.get("label") or ""
            label_h = 0.0
            if label:
                self.set_font("bn", "B", size - 0.2)
                label_h = self.multi_cell(inner, 4.6, label, dry_run=True, output="HEIGHT", align="L")
            self.set_font("bn", "B" if row.get("bold") else "", size)
            text_h = self.multi_cell(inner, row.get("line", 4.9), row.get("text", ""),
                                     dry_run=True, output="HEIGHT", align="L")
            measured.append((label_h, text_h))
        total = pad * 2 + sum(lh + th + 1.3 for lh, th in measured) + 1.2
        self.will_page_break(total + 2)
        y0 = self.get_y()
        if y0 + total > PAGE_H - MB:
            self.add_page()
            y0 = self.get_y()
        self.panel(ML, y0, CW, total, fill, bar=bar)
        y = y0 + pad - 1.0
        for row, (label_h, text_h) in zip(rows, measured):
            size = row.get("size", 8.6)
            label = row.get("label") or ""
            if label:
                self.set_xy(ML + pad, y)
                self.set_font("bn", "B", size - 0.2)
                self.set_text_color(*row.get("lcolor", CHARCOAL_SOFT))
                self.multi_cell(inner, 4.6, label, align="L")
                y += label_h + 0.5
            self.set_xy(ML + pad, y)
            self.set_font("bn", "B" if row.get("bold") else "", size)
            self.set_text_color(*row.get("tcolor", INK))
            self.multi_cell(inner, row.get("line", 4.9), row.get("text", ""), align="L")
            y += text_h + 1.3
        self.set_y(y0 + total + 3.0)

    def table(self, headers: list[str], rows: list[list[str]], widths: list[float] | None = None,
              font_size: float = 8.0) -> None:
        n = len(headers)
        if widths is None:
            first = 1.35
            rest = (CW - CW * first / (first + n - 1)) / max(1, n - 1)
            widths = [CW * first / (first + n - 1)] + [rest] * (n - 1)
        scale = CW / sum(widths)
        widths = [w * scale for w in widths]
        line_h = font_size * 0.58

        def row_height(cells: list[str], style: str) -> float:
            self.set_font("bn", style, font_size)
            h = line_h
            for w, cell in zip(widths, cells):
                h = max(
                    h,
                    self.multi_cell(
                        w - 3.2, line_h, str(cell), dry_run=True, output="HEIGHT", align="L"
                    ),
                )
            return h + 2.6

        def draw_row(cells: list[str], style: str, fill, text_color, bold_all=False) -> None:
            y = self.get_y()
            h = row_height(cells, style)
            self.set_fill_color(*fill)
            self.rect(ML, y, CW, h, RenderStyle.F)
            x = ML
            for i, (w, cell) in enumerate(zip(widths, cells)):
                self.set_xy(x + 1.6, y + 1.3)
                self.set_font("bn", "B" if (bold_all or i == 0) else "", font_size)
                self.set_text_color(*text_color)
                self.multi_cell(w - 3.2, line_h, str(cell), align="L", new_x=XPos.RIGHT, new_y=YPos.TOP)
                x += w
            self.set_y(y + h)
            with self.local_context(stroke_opacity=0.16):
                self.set_draw_color(*CHARCOAL)
                self.set_line_width(0.1)
                self.line(ML, y + h, PAGE_W - MR, y + h)

        self.will_page_break(34)
        # header
        hy = self.get_y()
        hh = row_height(headers, "B")
        self.set_fill_color(*CHARCOAL)
        self.rect(ML, hy, CW, hh, RenderStyle.F)
        x = ML
        for w, cell in zip(widths, headers):
            self.set_xy(x + 1.6, hy + 1.3)
            self.set_font("bn", "B", font_size)
            self.set_text_color(*WHITE)
            self.multi_cell(w - 3.2, line_h, str(cell), align="L", new_x=XPos.RIGHT, new_y=YPos.TOP)
            x += w
        self.set_y(hy + hh)

        for idx, row in enumerate(rows):
            needed = row_height(row, "")
            if self.get_y() + needed > PAGE_H - MB:
                self.add_page()
                hy = self.get_y()
                hh = row_height(headers, "B")
                self.set_fill_color(*CHARCOAL)
                self.rect(ML, hy, CW, hh, RenderStyle.F)
                x = ML
                for w, cell in zip(widths, headers):
                    self.set_xy(x + 1.6, hy + 1.3)
                    self.set_font("bn", "B", font_size)
                    self.set_text_color(*WHITE)
                    self.multi_cell(w - 3.2, line_h, str(cell), align="L", new_x=XPos.RIGHT, new_y=YPos.TOP)
                    x += w
                self.set_y(hy + hh)
            draw_row(row, "", WHITE if idx % 2 == 0 else SHELL, CHARCOAL)

        self.set_draw_color(*CHARCOAL)
        self.set_line_width(0.12)
        with self.local_context(stroke_opacity=0.25):
            self.rect(ML, hy if not rows else hy, CW, self.get_y() - hy, RenderStyle.D)
        self.ln(4.2)


# ------------------------------------------------------------------ cover ---
def draw_cover(pdf: Book) -> None:
    pdf.cover_mode = True
    pdf.set_auto_page_break(False)
    pdf.add_page()
    pdf.no_chrome.add(pdf.page_no())
    pdf.image(str(IMG / "cover-bg.jpg"), x=0, y=0, w=PAGE_W, h=PAGE_H)
    # spine
    pdf.set_fill_color(*OLIVE)
    pdf.rect(0, 0, 4.6, PAGE_H, RenderStyle.F)
    pdf.set_fill_color(*SUNSET)
    pdf.rect(0, PAGE_H * 0.62, 4.6, PAGE_H * 0.38, RenderStyle.F)

    # hairline frame
    with pdf.local_context(stroke_opacity=0.32):
        pdf.set_draw_color(*WHITE)
        pdf.set_line_width(0.25)
        pdf.rect(11.5, 11.5, PAGE_W - 23, PAGE_H - 23, RenderStyle.D)

    # logo
    pdf.image(str(IMG / "logo-white.png"), x=17, y=20, w=48)
    pdf.set_font("bns", "B", 6.4)
    pdf.set_text_color(*WHITE)
    pdf.set_text_color(168, 168, 164)
    pdf.set_xy(PAGE_W - 62, 22)
    pdf.multi_cell(45, 3.4, "FIELD FORCE\nTRAINING", align="R")

    # eyebrow
    pdf.set_fill_color(*SUNSET)
    pdf.rect(17, 58, 16, 1.1, RenderStyle.F)
    pdf.set_font("bn", "B", 9.4)
    pdf.set_text_color(*SUNSET)
    pdf.set_xy(36, 55.4)
    pdf.cell(80, 6, "শান্তা লাইফ · ই-বুক")

    # title
    pdf.set_font("bn", "B", 37)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(16.6, 66)
    pdf.multi_cell(PAGE_W - 33, 15.4, "গল্পে গল্পে শিখি", align="L")

    pdf.set_font("bn", "B", 17.6)
    pdf.set_text_color(246, 246, 244)
    pdf.set_xy(17, 100)
    pdf.multi_cell(PAGE_W - 44, 9.4, "শান্তা লাইফের বিমা প্রোডাক্ট", align="L")

    pdf.set_font("bn", "", 10.4)
    pdf.set_text_color(228, 228, 224)
    pdf.set_xy(17, 114)
    pdf.multi_cell(PAGE_W - 60, 6.0, "বাস্তব গল্প, সহজ ব্যাখ্যা ও একচ্যুয়ারিয়াল নির্ভুলতায়\nসাজানো ফিল্ড ফোর্স প্রশিক্ষণ নির্দেশিকা")

    # colophon
    with pdf.local_context(stroke_opacity=0.35):
        pdf.set_draw_color(*WHITE)
        pdf.set_line_width(0.2)
        pdf.line(17, PAGE_H - 32, PAGE_W - 17, PAGE_H - 32)
    pdf.set_font("bn", "B", 9.6)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(17, PAGE_H - 28)
    pdf.cell(110, 5.4, "শান্তা লাইফ ইনস্যুরেন্স পিএলসি", align="L")
    pdf.set_font("bns", "", 6.6)
    pdf.set_text_color(214, 214, 210)
    pdf.set_xy(17, PAGE_H - 22.4)
    pdf.cell(110, 4.4, "সংস্করণ ১.০  ·  ২০২৬", align="L")
    pdf.set_font("bns", "", 6.2)
    pdf.set_text_color(170, 170, 166)
    pdf.set_xy(PAGE_W - 62, PAGE_H - 28)
    pdf.multi_cell(45, 3.4, "SETTING\nSTANDARDS", align="R")
    pdf.cover_mode = False


# ------------------------------------------------------------- title page ---
def draw_title_page(pdf: Book) -> None:
    pdf.running_label = "FRONT MATTER"
    pdf.add_page()
    pdf.image(str(IMG / "logo-color.png"), x=ML, y=MT, w=42)
    pdf.set_font("bns", "", 7.2)
    pdf.set_text_color(*OLIVE_DEEP)
    pdf.set_xy(ML, MT + 29)
    pdf.cell(90, 4.4, "FIELD FORCE TRAINING SERIES", align="L")

    pdf.set_font("bn", "B", 25)
    pdf.set_text_color(*CHARCOAL_DEEP)
    pdf.set_xy(ML, 68)
    pdf.multi_cell(CW - 10, 11.4, DATA["meta"]["titleBn"], align="L")
    pdf.ln(2)
    pdf.set_font("bn", "", 11.4)
    pdf.set_text_color(*CHARCOAL_SOFT)
    pdf.multi_cell(CW - 20, 6.4, DATA["meta"]["subtitleBn"], align="L")

    pdf.ln(3)
    pdf.set_fill_color(*OLIVE)
    pdf.rect(ML, pdf.get_y(), 26, 1.3, RenderStyle.F)
    pdf.set_fill_color(*SUNSET)
    pdf.rect(ML + 26, pdf.get_y(), 13, 1.3, RenderStyle.F)

    pdf.ln(10)
    pdf.set_font("bn", "B", 10.4)
    pdf.set_text_color(*CHARCOAL)
    pdf.multi_cell(CW, 6.0, DATA["meta"]["company"], align="L")

    pdf.ln(6)
    facts = [
        ("প্রোডাক্ট মডিউল", bn(len(DATA["chapters"]))),
        ("মাস্টার কুইজ", bn(len(DATA["masterAssessment"]["questions"]))),
        ("সংস্করণ", "১.০"),
        ("প্রকাশকাল", "২০২৬"),
    ]
    y = pdf.get_y()
    col_w = CW / len(facts)
    for i, (label, value) in enumerate(facts):
        x = ML + i * col_w
        with pdf.local_context(stroke_opacity=0.18):
            pdf.set_draw_color(*CHARCOAL)
            pdf.line(x, y, x, y + 13)
        pdf.set_xy(x + 3, y + 1.4)
        pdf.set_font("bn", "", 7.6)
        pdf.set_text_color(*CHARCOAL_SOFT)
        pdf.cell(col_w - 6, 4.4, label, align="L")
        pdf.set_xy(x + 3, y + 6.2)
        pdf.set_font("bn", "B", 12.6)
        pdf.set_text_color(*OLIVE_DEEP)
        pdf.cell(col_w - 6, 6, value, align="L")
    pdf.set_y(y + 20)

    # highlights
    hl = [
        ("গল্প-ভিত্তিক শেখা", "বাস্তব ফিল্ড কথোপকথন ও আপত্তি নিষ্পত্তি"),
        ("একচ্যুয়ারিয়াল নির্ভুলতা", "প্রিমিয়াম, বেনিফিট ও শর্তের স্পষ্ট হিসাব"),
        ("কমপ্লায়েন্স সুরক্ষা", "রেড অ্যালার্ট ও এথিক্স চেকলিস্ট"),
    ]
    hy = pdf.get_y() + 6
    col = (CW - 2 * 4) / 3
    for i, (t, d) in enumerate(hl):
        x = ML + i * (col + 4)
        pdf.set_fill_color(*WHITE)
        pdf.rect(x, hy, col, 26, RenderStyle.F, round_corners=True, corner_radius=1.6)
        pdf.set_draw_color(*CHARCOAL)
        with pdf.local_context(stroke_opacity=0.16):
            pdf.set_line_width(0.14)
            pdf.rect(x, hy, col, 26, RenderStyle.D, round_corners=True, corner_radius=1.6)
        pdf.set_fill_color(*OLIVE)
        pdf.rect(x, hy, col, 1.4, RenderStyle.F, round_corners=True, corner_radius=0.4)
        pdf.set_xy(x + 3, hy + 4.4)
        pdf.set_font("bn", "B", 8.4)
        pdf.set_text_color(*CHARCOAL_DEEP)
        pdf.cell(col - 6, 4.6, t, align="L")
        pdf.set_xy(x + 3, hy + 10.4)
        pdf.set_font("bn", "", 7.2)
        pdf.set_text_color(*CHARCOAL_SOFT)
        pdf.multi_cell(col - 6, 3.8, d, align="L")
    pdf.set_y(hy + 26)

    # imprint
    box_h = 54
    y = PAGE_H - MB - box_h
    pdf.panel(ML, y, CW, box_h, OLIVE_WASH, bar=OLIVE)
    pdf.set_xy(ML + 6, y + 5)
    pdf.set_font("bn", "B", 8.6)
    pdf.set_text_color(*OLIVE_DEEP)
    pdf.cell(80, 5, "প্রকাশনা তথ্য")
    pdf.set_xy(ML + 6, y + 11)
    pdf.set_font("bn", "", 8.2)
    pdf.set_text_color(*CHARCOAL)
    pdf.multi_cell(
        CW - 12,
        4.8,
        "প্রস্তুতকৃত: লার্নিং অ্যান্ড ডেভেলপমেন্ট বিভাগ, শান্তা লাইফ ইনস্যুরেন্স পিএলসি।\n"
        "ব্র্যান্ড রেফারেন্স: Shanta Life Brand Guidelines।\n"
        "ব্যবহার: অভ্যন্তরীণ প্রশিক্ষণ সামগ্রী — কেবল প্রাতিষ্ঠানিক ব্যবহারের জন্য।\n"
        "সতর্কতা: প্রোডাক্টের শর্তাবলি ও প্রিমিয়াম হারের চূড়ান্ত সূত্র অনুমোদিত প্রোডাক্ট ফাইল।",
        align="L",
    )


# --------------------------------------------------------------------- toc ---
def draw_toc(pdf: Book, entries: list[tuple[str, str, str]], pages: list[int] | None) -> None:
    pdf.running_label = "CONTENTS"
    pdf.add_page()
    pdf.set_font("bns", "", 7.4)
    pdf.set_text_color(*OLIVE_DEEP)
    pdf.cell(80, 5, "CONTENTS", align="L")
    pdf.ln(7)
    pdf.set_font("bn", "B", 22)
    pdf.set_text_color(*CHARCOAL_DEEP)
    pdf.cell(120, 11, "সূচিপত্র", align="L")
    pdf.ln(13)
    pdf.set_font("bn", "", 9.2)
    pdf.set_text_color(*CHARCOAL_SOFT)
    pdf.multi_cell(CW - 30, 5.2, "প্রতিটি অধ্যায় একই কাঠামোয় সাজানো — গল্প, সহজ ব্যাখ্যা, রেড অ্যালার্ট, কুইজ ও গোল্ডেন রুল।", align="L")
    pdf.ln(6)

    for i, (num, title, kind) in enumerate(entries):
        y = pdf.get_y()
        if y > PAGE_H - MB - 16:
            pdf.add_page()
            y = pdf.get_y()
        page_no = pages[i] if pages else 0
        # number chip
        pdf.set_fill_color(*(OLIVE if kind != "appendix" else CHARCOAL))
        pdf.rect(ML, y + 0.6, 11, 6.2, RenderStyle.F, round_corners=True, corner_radius=1.2)
        pdf.set_font("bn", "B", 8.4)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(ML, y + 1.2)
        pdf.cell(11, 5, num, align="C")

        pdf.set_xy(ML + 15, y + 1.1)
        pdf.set_font("bn", "B" if kind != "appendix" else "", 9.6)
        pdf.set_text_color(*(CHARCOAL_DEEP if kind != "appendix" else CHARCOAL_SOFT))
        pdf.cell(CW - 15 - 12, 5, title, align="L")

        if pages:
            pdf.set_xy(PAGE_W - MR - 12, y + 1.1)
            pdf.set_font("bns", "B", 8.4)
            pdf.set_text_color(*OLIVE_DEEP)
            pdf.cell(12, 5, bn(page_no), align="R")

        pdf.set_draw_color(*CHARCOAL)
        with pdf.local_context(stroke_opacity=0.14):
            pdf.set_line_width(0.12)
            pdf.line(ML + 15, y + 8.4, PAGE_W - MR, y + 8.4)
        pdf.set_y(y + 10.4)

    pdf.ln(4)
    y = pdf.get_y()
    if y < PAGE_H - MB - 34:
        pdf.panel(ML, y, CW, 30, SHELL, bar=SUNSET)
        pdf.set_xy(ML + 6, y + 4.4)
        pdf.set_font("bn", "B", 9)
        pdf.set_text_color(*SUNSET_DEEP)
        pdf.cell(80, 5, "বইটি যেভাবে পড়বেন")
        pdf.set_xy(ML + 6, y + 10)
        pdf.set_font("bn", "", 8.4)
        pdf.set_text_color(*CHARCOAL)
        pdf.multi_cell(
            CW - 12,
            4.9,
            "গল্পটি পড়ে প্রেক্ষাপট বুঝুন → ব্যাখ্যায় সংখ্যা ও নিয়ম যাচাই করুন → রেড অ্যালার্টে ঝুঁকি এড়ান → কুইজে নিজেকে যাচাই করুন → গোল্ডেন রুল মুখস্থ রাখুন।",
            align="L",
        )


# ----------------------------------------------------------------- section ---
def draw_chapter(pdf: Book, chapter: dict) -> int:
    visuals = chapter_visual_map()
    cid = chapter["id"]
    pdf.running_label = f"CHAPTER {chapter['number']} · {chapter['titleEn'].upper()[:34]}"
    pdf.add_page()
    start_page = pdf.page_no()

    # opener
    y = pdf.get_y()
    pdf.set_fill_color(*OLIVE)
    pdf.rect(ML, y, 13, 13, RenderStyle.F, round_corners=True, corner_radius=2)
    pdf.set_font("bn", "B", 11.4)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(ML, y + 3.2)
    pdf.cell(13, 6, chapter["number"], align="C")

    pdf.set_xy(ML + 17, y + 1.4)
    pdf.set_font("bns", "B", 6.8)
    pdf.set_text_color(*OLIVE_DEEP)
    pdf.cell(120, 4, f"CHAPTER {chapter['number']}  ·  {chapter['titleEn'].upper()}", align="L")
    pdf.set_xy(ML + 17, y + 5.8)
    pdf.set_font("bns", "", 6.6)
    pdf.set_text_color(*CHARCOAL_SOFT)
    pdf.cell(120, 4, "PRODUCT MODULE  ·  FIELD TRAINING", align="L")

    pdf.set_xy(ML, y + 17)
    pdf.set_font("bn", "B", 19.5)
    pdf.set_text_color(*CHARCOAL_DEEP)
    pdf.multi_cell(CW - 4, 9.8, chapter["titleBn"], align="L")
    pdf.ln(0.6)
    pdf.set_fill_color(*OLIVE)
    pdf.rect(ML, pdf.get_y(), 22, 1.2, RenderStyle.F)
    pdf.set_fill_color(*SUNSET)
    pdf.rect(ML + 22, pdf.get_y(), 11, 1.2, RenderStyle.F)
    pdf.ln(4.4)

    pdf.set_font("bn", "B", 9.8)
    pdf.set_text_color(*SUNSET_DEEP)
    pdf.multi_cell(CW - 6, 5.6, chapter["tagline"], align="L")
    pdf.ln(4.4)

    if cid in visuals:
        pdf.image_block(visuals[cid], VISUAL_CAPTIONS.get(cid, ""), height=70)

    pdf.body(chapter["intro"])

    # story
    pdf.ln(2)
    story = chapter.get("story") or {}
    ext = STORIES.get(cid, {})
    dialogue = ext.get("dialogue") or story.get("dialogue", [])
    if ext.get("setting"):
        pdf.will_page_break(18)
        pdf.ln(1.2)
        pdf.set_x(ML)
        pdf.set_font("bn", "B", 8.4)
        pdf.set_text_color(*OLIVE_DEEP)
        pdf.write(4.9, "দৃশ্য: ")
        pdf.set_font("bn", "", 8.6)
        pdf.set_text_color(*CHARCOAL_SOFT)
        pdf.multi_cell(CW, 4.9, ext["setting"], align="L")
        pdf.ln(2.2)
    if dialogue:
        pad = 5.0
        inner = CW - pad * 2
        pdf.will_page_break(40)
        y0 = pdf.get_y()

        # ---- measure exactly the way we draw -------------------------------
        pdf.set_font("bn", "", 8.2)
        chars_h = pdf.multi_cell(inner, 4.6, "চরিত্র: " + story.get("characters", ""),
                                 dry_run=True, output="HEIGHT", align="L")
        head_h = pad + 5.0 + chars_h + 1.6 + 1.0
        heights = []
        for d in dialogue:
            if d["speaker"] in ("বর্ণনা", "ফলাফল"):
                heights.append(
                    pdf.multi_cell(inner, 5.2, d["speaker"] + ": " + d["text"],
                                   dry_run=True, output="HEIGHT", align="L") + 1.3
                )
            else:
                pdf.set_font("bn", "", 8.9)
                heights.append(
                    5.06
                    + pdf.multi_cell(inner - 3, 5.4, d["text"], dry_run=True, output="HEIGHT", align="L") * 1.02
                    + 1.8
                )
        total = head_h + sum(heights) + pad - 8.0
        if y0 + total > PAGE_H - MB:
            pdf.add_page()
            y0 = pdf.get_y()
            total = min(total, PAGE_H - MB - y0)
        pdf.panel(ML, y0, CW, total, SHELL, bar=OLIVE)
        pdf.set_xy(ML + pad, y0 + pad - 1.2)
        pdf.set_font("bn", "B", 10.4)
        pdf.set_text_color(*OLIVE_DEEP)
        pdf.cell(inner, 5.4, "০১ · গল্প (Story)", align="L")
        pdf.set_xy(ML + pad, y0 + pad + 4.4)
        pdf.set_font("bn", "", 8.2)
        pdf.set_text_color(*CHARCOAL_SOFT)
        pdf.multi_cell(inner, 4.6, "চরিত্র: " + story.get("characters", ""), align="L")
        pdf.ln(1.6)

        for d in dialogue:
            speaker = d["speaker"]
            is_note = speaker in ("বর্ণনা", "ফলাফল")
            if is_note:
                pdf.set_x(ML + pad)
                pdf.set_font("bn", "B", 8.6)
                pdf.set_text_color(*SUNSET_DEEP)
                pdf.write(5.2, speaker + ": ")
                pdf.set_font("bn", "", 8.8)
                pdf.set_text_color(*INK)
                pdf.write(5.2, d["text"])
                pdf.ln(6.5)
            else:
                pdf.set_x(ML + pad)
                pdf.set_font("bn", "B", 8.6)
                pdf.set_text_color(*(OLIVE_DEEP if speaker != dialogue[0]["speaker"] else CHARCOAL))
                pdf.cell(inner, 4.8, speaker, align="L")
                pdf.ln(5.0)
                pdf.set_x(ML + pad + 3)
                pdf.set_font("bn", "", 8.9)
                pdf.set_text_color(*INK)
                pdf.multi_cell(inner - 3, 5.4, d["text"], align="L")
                pdf.ln(1.8)
        if os.environ.get("SLI_DEBUG"):
            print(f"[story] allocated={total:.1f} used={pdf.get_y()-y0:.1f}")
        pdf.set_y(y0 + min(total, PAGE_H - MB - y0) + 2.4)

    if ext.get("aside"):
        pdf.stacked_panel(
            [{"label": "🎯 কোচিং নোট", "text": ext["aside"], "lcolor": OLIVE_DEEP,
              "tcolor": OLIVE_DEEP, "size": 8.4, "line": 4.8}],
            OLIVE_WASH,
            bar=OLIVE,
        )
        pdf.ln(1.0)
    if ext.get("aftermath"):
        pdf.stacked_panel(
            [{"label": ext["aftermath"]["title"], "text": ext["aftermath"]["text"],
              "lcolor": FOREST, "tcolor": INK, "size": 8.6}],
            FOREST_SOFT,
            bar=FOREST,
        )
        pdf.ln(1.0)

    # explanation
    exp = chapter.get("explanation", {})
    if PAGE_H - MB - pdf.get_y() < 118:
        pdf.add_page()
    else:
        pdf.ln(6)
    pdf.set_font("bn", "B", 12.6)
    pdf.set_text_color(*CHARCOAL_DEEP)
    pdf.multi_cell(CW, 7.2, "০২ · সহজ ব্যাখ্যা (Simple Explanation)", align="L")
    pdf.ln(1.4)

    if exp.get("paramTable"):
        pdf.sub_heading("প্রোডাক্টের মূল বৈশিষ্ট্যসমূহ")
        pdf.table(exp["paramTable"]["headers"], exp["paramTable"]["rows"], widths=[34, 66])

    for key in ("sections", "sections2"):
        for sec in exp.get(key, []) or []:
            if sec.get("heading"):
                pdf.sub_heading(sec["heading"])
            for p in sec.get("paragraphs", []) or []:
                pdf.body(p)
            for b in sec.get("bullets", []) or []:
                pdf.bullet(b)
            for p in sec.get("paragraphs2", []) or []:
                pdf.body(p)
            for f in sec.get("formulas", []) or []:
                steps = f.get("steps", [])
                pad = 5.0
                inner = CW - pad * 2
                pdf.will_page_break(26)
                pdf.set_font("bn", "", 8.6)
                h = 9.0 + sum(
                    pdf.multi_cell(inner - 8, 5.2, s, dry_run=True, output="HEIGHT", align="L") + 1.2
                    for s in steps
                ) + pad
                y0 = pdf.get_y()
                if y0 + h > PAGE_H - MB:
                    pdf.add_page()
                    y0 = pdf.get_y()
                pdf.panel(ML, y0, CW, h, OLIVE_WASH, bar=OLIVE)
                pdf.set_xy(ML + pad, y0 + pad - 1.6)
                pdf.set_font("bn", "B", 8.6)
                pdf.set_text_color(*OLIVE_DEEP)
                pdf.multi_cell(inner, 4.8, "🧮 " + f["label"], align="L")
                pdf.ln(0.8)
                for i, s in enumerate(steps):
                    pdf.set_x(ML + pad)
                    pdf.set_font("bn", "B", 8.2)
                    pdf.set_text_color(*OLIVE_DEEP)
                    pdf.cell(5, 5.2, bn(i + 1) + ".")
                    pdf.set_font("bn", "", 8.6)
                    pdf.set_text_color(*INK)
                    pdf.multi_cell(inner - 8, 5.2, s, align="L")
                    pdf.ln(0.9)
                pdf.set_y(y0 + h + 4.2)
            if sec.get("note"):
                pdf.set_font("bn", "", 8.4)
                pdf.set_text_color(*CHARCOAL_SOFT)
                pdf.multi_cell(CW - 8, 5.0, "📝 " + sec["note"], align="L")
                pdf.ln(2.4)

    for table_key, label in (
        ("tierTable", "SDPP টায়ার-ভিত্তিক তুলনা (পূর্ণ পৃষ্ঠা)"),
        ("riderTable", "শান্তা লাইফের রাইডার ম্যাট্রিক্স (পূর্ণ পৃষ্ঠা)"),
    ):
        if exp.get(table_key):
            # Charge / tier tables are isolated so no row is ever split across pages.
            pdf.add_page()
            pdf.sub_heading(label)
            pdf.set_font("bn", "", 8.2)
            pdf.set_text_color(*CHARCOAL_SOFT)
            pdf.multi_cell(CW, 4.8, "টেবিলটি এক পৃষ্ঠায় সম্পূর্ণ রাখা হয়েছে — প্রশিক্ষণে হাতে ধরিয়ে দেওয়ার জন্য।", align="L")
            pdf.ln(2.0)
            pdf.table(
                exp[table_key]["headers"],
                exp[table_key]["rows"],
                font_size=7.8,
            )

    # red alerts
    if chapter.get("redAlerts"):
        pdf.ln(1.4)
        pdf.callout(
            "০৩ · রেড অ্যালার্ট (Red Alert)",
            chapter["redAlerts"],
            accent=CLAY,
            fill=CLAY_SOFT,
            text_color=(92, 42, 34),
            icon="🚨",
        )

    # quiz
    if chapter.get("quiz"):
        quiz = chapter["quiz"]
        pad = 5.4
        inner = CW - pad * 2
        pdf.will_page_break(40)
        y0 = pdf.get_y()
        pdf.set_font("bn", "", 8.7)
        opt_h = [
            pdf.multi_cell(inner - 10, 5.2, o["text"], dry_run=True, output="HEIGHT", align="L") + 2.4
            for o in quiz["options"]
        ]
        pdf.set_font("bn", "B", 9.2)
        q_h = pdf.multi_cell(inner, 5.4, quiz["question"], dry_run=True, output="HEIGHT", align="L")
        pdf.set_font("bn", "", 8.7)
        exp_h = pdf.multi_cell(inner, 5.2, quiz["explanation"], dry_run=True, output="HEIGHT", align="L")
        total = pad + 8.6 + q_h + 3.0 + sum(opt_h) + 4.0 + 5.6 + exp_h + pad + 1.0 - 19.8
        if y0 + total > PAGE_H - MB:
            pdf.add_page()
            y0 = pdf.get_y()
            total = min(total, PAGE_H - MB - y0)
        pdf.panel(ML, y0, CW, total, PLUM_SOFT, bar=PLUM)
        pdf.set_xy(ML + pad, y0 + pad - 1.4)
        pdf.set_font("bn", "B", 10.0)
        pdf.set_text_color(*PLUM)
        pdf.cell(inner, 5.2, "০৪ · কুইজ — নিজেকে যাচাই করুন", align="L")
        pdf.ln(6.4)
        pdf.set_x(ML + pad)
        pdf.set_font("bn", "B", 9.2)
        pdf.set_text_color(*CHARCOAL_DEEP)
        pdf.multi_cell(inner, 5.4, quiz["question"], align="L")
        pdf.ln(2.2)
        for o, h in zip(quiz["options"], opt_h):
            correct = o["key"] == quiz["correct"]
            y = pdf.get_y()
            pdf.set_fill_color(*(FOREST_SOFT if correct else WHITE))
            pdf.rect(ML + pad, y, inner, h, RenderStyle.F, round_corners=True, corner_radius=1.2)
            pdf.set_x(ML + pad + 2.4)
            pdf.set_font("bn", "B", 8.6)
            pdf.set_text_color(*(FOREST if correct else PLUM))
            pdf.cell(7, 5.2, o["key"])
            pdf.set_font("bn", "B" if correct else "", 8.7)
            pdf.set_text_color(*(FOREST if correct else INK))
            pdf.multi_cell(inner - 10, 5.2, o["text"], align="L")
            pdf.ln(0.8)
        pdf.ln(1.4)
        pdf.set_x(ML + pad)
        pdf.set_font("bn", "B", 8.8)
        pdf.set_text_color(*FOREST)
        pdf.cell(inner, 5.0, "✔ সঠিক উত্তর: " + quiz["correct"], align="L")
        pdf.ln(5.6)
        pdf.set_x(ML + pad)
        pdf.set_font("bn", "", 8.7)
        pdf.set_text_color(43, 74, 43)
        pdf.multi_cell(inner, 5.2, quiz["explanation"], align="L")
        if os.environ.get("SLI_DEBUG"):
            print(f"[quiz] allocated={total:.1f} used={pdf.get_y()-y0:.1f}")
        pdf.set_y(y0 + total + 4.6)

    # golden rule
    if chapter.get("goldenRule"):
        pdf.will_page_break(26)
        pad = 5.4
        y0 = pdf.get_y()
        pdf.set_font("bn", "B", 9.6)
        h = pdf.multi_cell(CW - pad * 2, 6.0, chapter["goldenRule"], dry_run=True, output="HEIGHT", align="C")
        box_h = h + 16 - 6.6
        if y0 + box_h > PAGE_H - MB:
            pdf.add_page()
            y0 = pdf.get_y()
        pdf.panel(ML, y0, CW, box_h, OLIVE_TINT, bar=OLIVE)
        pdf.set_xy(ML, y0 + 4.4)
        pdf.set_font("bns", "B", 6.8)
        pdf.set_text_color(*OLIVE_DEEP)
        pdf.cell(CW, 4.2, "★  GOLDEN RULE", align="C")
        pdf.set_xy(ML + pad, y0 + 9.4)
        pdf.set_font("bn", "B", 9.6)
        pdf.set_text_color(*CHARCOAL_DEEP)
        pdf.multi_cell(CW - pad * 2, 6.0, chapter["goldenRule"], align="C")
        if os.environ.get("SLI_DEBUG"):
            print(f"[golden] allocated={box_h:.1f} used={pdf.get_y()-y0:.1f}")
        pdf.set_y(y0 + box_h + 4.4)

    # bridge
    if chapter.get("bridge"):
        pdf.will_page_break(24)
        pad = 5.0
        y0 = pdf.get_y()
        pdf.set_font("bn", "", 8.8)
        h = pdf.multi_cell(CW - pad * 2, 5.2, chapter["bridge"], dry_run=True, output="HEIGHT", align="L") + 12
        if y0 + h > PAGE_H - MB:
            pdf.add_page()
            y0 = pdf.get_y()
        pdf.panel(ML, y0, CW, h, SUNSET_SOFT, bar=SUNSET)
        pdf.set_xy(ML + pad, y0 + 3.2)
        pdf.set_font("bns", "B", 6.6)
        pdf.set_text_color(*SUNSET_DEEP)
        pdf.cell(120, 4.2, "NEXT CHAPTER", align="L")
        pdf.set_xy(ML + pad, y0 + 7.4)
        pdf.set_font("bn", "", 8.8)
        pdf.set_text_color(*CHARCOAL)
        pdf.multi_cell(CW - pad * 2, 5.2, chapter["bridge"], align="L")
        pdf.set_y(y0 + h + 3.4)

    draw_sales_pack(pdf, SALES.get(cid))
    return start_page


# ---------------------------------------------------------- sales playbook ---
def section_banner(pdf: Book, kicker: str, title: str, tagline: str = "", accent=CLAY) -> None:
    pdf.will_page_break(30)
    pdf.ln(2.0)
    pdf.set_font("bns", "B", 6.6)
    pdf.set_text_color(*accent)
    pdf.cell(120, 4.2, kicker.upper(), align="L")
    pdf.ln(5.0)
    pdf.set_font("bn", "B", 13.4)
    pdf.set_text_color(*CHARCOAL_DEEP)
    pdf.multi_cell(CW, 7.2, title, align="L")
    if tagline:
        pdf.set_x(ML)
        pdf.set_font("bn", "B", 8.6)
        pdf.set_text_color(*SUNSET_DEEP)
        pdf.multi_cell(CW, 5.0, tagline, align="L")
    pdf.ln(1.0)
    pdf.set_fill_color(*OLIVE)
    pdf.rect(ML, pdf.get_y(), 22, 1.2, RenderStyle.F)
    pdf.set_fill_color(*SUNSET)
    pdf.rect(ML + 22, pdf.get_y(), 11, 1.2, RenderStyle.F)
    pdf.ln(5.0)


def draw_sales_pack(pdf: Book, pack: dict) -> None:
    if not pack:
        return
    objections = pack.get("objections") or []
    if objections:
        pdf.running_label = "SALES PLAYBOOK · OBJECTION HANDLING"
        pdf.add_page()
        section_banner(
            pdf,
            "Sales Mastery · Field Playbook",
            pack.get("objectionTitle", "আপত্তি মোকাবেলা প্লেবুক"),
            "প্রতিটি আপত্তির পেছনে একটি অকথিত ভয় থাকে — আগে ভয়টিকে চিহ্নিত করুন, তারপর স্বীকৃতি ও প্রমাণ দিন।",
        )
        for i, item in enumerate(objections, start=1):
            rows = [{
                "label": "",
                "text": f"{bn(i)}. “{item['objection']}”",
                "lcolor": CLAY,
                "tcolor": CLAY,
                "bold": True,
                "size": 9.0,
                "line": 5.2,
            }]
            for key, label, color in (
                ("realFear", "আসল ভয়", CHARCOAL_SOFT),
                ("acknowledge", "স্বীকৃতি", OLIVE_DEEP),
                ("clarify", "স্পষ্টীকরণ প্রশ্ন", OLIVE_DEEP),
                ("respond", "উত্তর", FOREST),
                ("proof", "প্রমাণ", CHARCOAL),
                ("close", "ক্লোজ", SUNSET_DEEP),
            ):
                if item.get(key):
                    rows.append({
                        "label": label,
                        "text": item[key],
                        "lcolor": color,
                        "tcolor": INK,
                        "size": 8.5,
                    })
            pdf.stacked_panel(rows, WHITE, bar=CLAY)
            pdf.ln(1.2)

    hard = pack.get("hardQuestions") or []
    if hard:
        section_banner(pdf, "Mock Test · Chapter Level", "কঠিন প্রশ্নের মক টেস্ট (এই অধ্যায়)", "", accent=SUNSET_DEEP)
        for i, q in enumerate(hard, start=1):
            rows = [{
                "label": f"{bn(i)} · {q.get('by', 'মক টেস্ট')}",
                "text": f"“{q['question']}”",
                "lcolor": SUNSET_DEEP,
                "tcolor": CHARCOAL_DEEP,
                "bold": True,
                "size": 9.0,
                "line": 5.2,
            }]
            if q.get("trap"):
                rows.append({"label": "⚠ ফাঁদ", "text": q["trap"], "lcolor": CLAY, "tcolor": INK, "size": 8.5})
            rows.append({"label": "✔ নিরাপদ উত্তর", "text": q["answer"], "lcolor": FOREST, "tcolor": INK, "size": 8.5})
            if q.get("data"):
                rows.append({"label": "📌 তথ্যসূত্র", "text": q["data"], "lcolor": CHARCOAL_SOFT,
                             "tcolor": CHARCOAL_SOFT, "size": 8.2})
            pdf.stacked_panel(rows, CLAY_SOFT, bar=CLAY)
            pdf.ln(1.2)

    myths = pack.get("misconceptions") or []
    if myths:
        section_banner(pdf, "Misconception → Truth", "ভুল ধারণা ভাঙা", "", accent=CLAY)
        pdf.table(
            ["প্রচলিত ভুল ধারণা", "সঠিক তথ্য"],
            [[m["myth"], m["truth"]] for m in myths],
            widths=[42, 58],
            font_size=7.6,
        )


# --------------------------------------------------------- mastery appendix ---
def draw_mastery_need_based(pdf: Book) -> int:
    data = MASTERY["needBased"]
    pdf.running_label = "APPENDIX A · NEED-BASED SELLING"
    pdf.add_page()
    page = pdf.page_no()
    section_banner(pdf, "Appendix A · Sales Mastery", data["heading"], data["tagline"], accent=OLIVE_DEEP)
    pdf.body(data["intro"], size=9.0)
    pdf.ln(1.0)
    for step in data["steps"]:
        pdf.stacked_panel(
            [
                {"label": f"ধাপ {step['step']}", "text": step["title"], "lcolor": OLIVE_DEEP,
                 "tcolor": CHARCOAL_DEEP, "bold": True, "size": 9.2, "line": 5.2},
                {"label": "", "text": step["text"], "tcolor": INK, "size": 8.7},
                {"label": "বলার ধরন", "text": f"“{step['script']}”", "lcolor": SUNSET_DEEP,
                 "tcolor": SUNSET_DEEP, "size": 8.5},
            ],
            WHITE,
            bar=OLIVE,
        )
        pdf.ln(1.2)
    pdf.sub_heading("প্রশ্ন-ব্যাংক: যা জিজ্ঞেস করলেই গ্রাহক খুলে যান", OLIVE_DEEP)
    pdf.table(
        ["বিষয়", "প্রশ্ন"],
        [[q["group"], q["question"]] for q in data["questions"]],
        widths=[24, 76],
        font_size=7.6,
    )
    return page


def draw_mastery_objection_method(pdf: Book) -> int:
    data = MASTERY["objectionMethod"]
    pdf.running_label = "APPENDIX B · OBJECTION HANDLING"
    pdf.add_page()
    page = pdf.page_no()
    section_banner(pdf, "Appendix B · Objection Handling", data["heading"], data["tagline"], accent=SUNSET_DEEP)
    pdf.body(data["intro"], size=9.0)
    pdf.ln(1.0)
    for step in data["steps"]:
        pdf.stacked_panel(
            [
                {"label": step["key"], "text": step["title"], "lcolor": CHARCOAL,
                 "tcolor": CHARCOAL_DEEP, "bold": True, "size": 9.2, "line": 5.2},
                {"label": "", "text": step["text"], "tcolor": INK, "size": 8.7},
                {"label": "বলার ধরন", "text": f"“{step['script']}”", "lcolor": SUNSET_DEEP,
                 "tcolor": SUNSET_DEEP, "size": 8.5},
            ],
            SHELL,
            bar=SUNSET,
        )
        pdf.ln(1.0)
    pdf.callout(
        "পাঁচটি অলঙ্ঘনীয় নিয়ম",
        data["rules"],
        accent=CLAY,
        fill=CLAY_SOFT,
        text_color=(92, 42, 34),
        numbered=False,
        icon="🚨",
    )
    return page


def draw_mastery_mock_tests(pdf: Book) -> int:
    data = MASTERY["mockTest"]
    pdf.running_label = "APPENDIX C · MOCK TEST BANK"
    pdf.add_page()
    page = pdf.page_no()
    section_banner(pdf, "Appendix C · Mock Test Bank", data["heading"], data["tagline"], accent=CLAY)
    pdf.body(data["intro"], size=9.0)
    pdf.ln(0.6)
    pdf.table(
        ["স্তর", "ধরন", "বিবরণ"],
        [[lvl["level"], lvl["title"], lvl["text"]] for lvl in data["levels"]],
        widths=[14, 28, 58],
        font_size=7.6,
    )
    for i, q in enumerate(data["questions"], start=1):
        rows = [{
            "label": f"{bn(i)} · {q.get('level', '')} · {q.get('by', '')}",
            "text": f"“{q['question']}”",
            "lcolor": SUNSET_DEEP,
            "tcolor": CHARCOAL_DEEP,
            "bold": True,
            "size": 9.0,
            "line": 5.2,
        }]
        if q.get("trap"):
            rows.append({"label": "⚠ ফাঁদ", "text": q["trap"], "lcolor": CLAY, "tcolor": INK, "size": 8.5})
        rows.append({"label": "✔ উত্তর", "text": q["answer"], "lcolor": FOREST, "tcolor": INK, "size": 8.5})
        if q.get("data"):
            rows.append({"label": "📌 তথ্যসূত্র", "text": q["data"], "lcolor": CHARCOAL_SOFT,
                         "tcolor": CHARCOAL_SOFT, "size": 8.2})
        pdf.stacked_panel(rows, CLAY_SOFT, bar=CLAY)
        pdf.ln(1.2)
    return page


def draw_mastery_no_need(pdf: Book) -> int:
    data = MASTERY["noNeed"]
    pdf.running_label = "APPENDIX D · NO-NEED ETHICS"
    pdf.add_page()
    page = pdf.page_no()
    section_banner(pdf, "Appendix D · No-Need Ethics", data["heading"], data["tagline"], accent=FOREST)
    pdf.body(data["intro"], size=9.0)
    pdf.ln(1.0)
    for step in data["steps"]:
        pdf.stacked_panel(
            [
                {"label": f"ধাপ {step['step']}", "text": step["title"], "lcolor": FOREST,
                 "tcolor": CHARCOAL_DEEP, "bold": True, "size": 9.2, "line": 5.2},
                {"label": "", "text": step["text"], "tcolor": INK, "size": 8.7},
                {"label": "বলার ধরন", "text": f"“{step['script']}”", "lcolor": FOREST,
                 "tcolor": FOREST, "size": 8.5},
            ],
            FOREST_SOFT,
            bar=FOREST,
        )
        pdf.ln(1.0)
    pdf.sub_heading("আগের ভুল ধারণা পরিষ্কার করা", FOREST)
    pdf.table(
        ["যা মানুষ ভাবেন", "আসলে কী"],
        [[m["myth"], m["truth"]] for m in data["misbeliefs"]],
        widths=[40, 60],
        font_size=7.6,
    )
    pdf.stacked_panel(
        [{"label": data["closing"]["title"], "text": "•  " + data["closing"]["lines"][0],
          "lcolor": OLIVE_DEEP, "tcolor": INK, "size": 8.7}]
        + [{"label": "", "text": "•  " + line, "tcolor": INK, "size": 8.7}
           for line in data["closing"]["lines"][1:]],
        OLIVE_TINT,
        bar=OLIVE,
    )
    return page


# ------------------------------------------------------------------ back ---
def draw_back_cover(pdf: Book) -> None:
    pdf.cover_mode = True
    pdf.set_auto_page_break(False)
    pdf.add_page()
    pdf.no_chrome.add(pdf.page_no())
    pdf.image(str(IMG / "back-cover-bg.jpg"), x=0, y=0, w=PAGE_W, h=PAGE_H)

    pdf.image(str(IMG / "logo-white.png"), x=(PAGE_W - 46) / 2, y=48, w=46)
    pdf.set_font("bn", "B", 17)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(20, 96)
    pdf.multi_cell(PAGE_W - 40, 9.4, "সঠিক পরামর্শই\nসবচেয়ে বড় সুরক্ষা", align="C")

    pdf.set_font("bn", "", 9.6)
    pdf.set_text_color(214, 214, 210)
    pdf.set_xy(26, 128)
    pdf.multi_cell(
        PAGE_W - 52,
        5.8,
        "শান্তা লাইফ ইনস্যুরেন্স পিএলসি-র ফিল্ড ফোর্সের জন্য তৈরি এই প্রশিক্ষণ ই-বুকটি গল্প, "
        "সংলাপ ও একচ্যুয়ারিয়াল নির্ভুলতার সমন্বয়ে সাজানো — যাতে প্রতিটি গ্রাহক সভায় সঠিক, "
        "স্বচ্ছ ও কমপ্লায়েন্ট পরামর্শ নিশ্চিত হয়।",
        align="C",
    )

    pdf.set_fill_color(*OLIVE)
    pdf.rect(PAGE_W / 2 - 26, 172, 26, 1.2, RenderStyle.F)
    pdf.set_fill_color(*SUNSET)
    pdf.rect(PAGE_W / 2, 172, 26, 1.2, RenderStyle.F)

    pdf.set_font("bn", "B", 9.4)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(20, 182)
    pdf.cell(PAGE_W - 40, 5.4, "শান্তা লাইফ ইনস্যুরেন্স পিএলসি", align="C")
    pdf.set_font("bn", "", 8.4)
    pdf.set_text_color(190, 190, 186)
    pdf.set_xy(20, 189)
    pdf.cell(PAGE_W - 40, 5.0, "লার্নিং অ্যান্ড ডেভেলপমেন্ট বিভাগ", align="C")

    with pdf.local_context(stroke_opacity=0.28):
        pdf.set_draw_color(*WHITE)
        pdf.set_line_width(0.2)
        pdf.line(30, PAGE_H - 40, PAGE_W - 30, PAGE_H - 40)
    pdf.set_font("bn", "", 7.4)
    pdf.set_text_color(170, 170, 166)
    pdf.set_xy(30, PAGE_H - 35)
    pdf.multi_cell(
        PAGE_W - 60,
        4.2,
        "অভ্যন্তরীণ প্রশিক্ষণ সামগ্রী · শুধুমাত্র প্রাতিষ্ঠানিক ব্যবহারের জন্য\nসংস্করণ ১.০ · ২০২৬",
        align="C",
    )
    pdf.cover_mode = False
    pdf.set_auto_page_break(True, margin=MB)


# ------------------------------------------------------------------ build ---
def build(toc_pages: list[int] | None, out: Path) -> list[int]:
    pdf = Book()
    pdf.set_creator("Shanta Life Insurance PLC — Learning & Development")
    pdf.set_title("গল্পে গল্পে শিখি — শান্তা লাইফের বিমা প্রোডাক্ট")
    pdf.set_subject("ফিল্ড ফোর্স ট্রেনিং ই-বুক")
    pdf.set_author("Shanta Life Insurance PLC")

    draw_cover(pdf)
    draw_title_page(pdf)

    entries: list[tuple[str, str, str]] = [("০১", DATA["introduction"]["heading"], "intro")]
    for ch in DATA["chapters"]:
        entries.append((ch["number"], ch["titleBn"], "chapter"))
    entries += [
        ("০৮", MASTERY["needBased"]["heading"], "appendix"),
        ("০৯", MASTERY["objectionMethod"]["heading"], "appendix"),
        ("১০", MASTERY["mockTest"]["heading"], "appendix"),
        ("১১", MASTERY["noNeed"]["heading"], "appendix"),
        ("১২", DATA["quickReference"]["heading"], "appendix"),
        ("১৩", DATA["masterAssessment"]["heading"], "appendix"),
        ("১৪", DATA["ethicsChecklist"]["heading"], "appendix"),
        ("১৫", "উপসংহার", "appendix"),
    ]

    draw_toc(pdf, entries, toc_pages)

    pages: list[int] = []

    # introduction
    pdf.running_label = "INTRODUCTION"
    pdf.add_page()
    pages.append(pdf.page_no())
    y = pdf.get_y()
    pdf.set_fill_color(*OLIVE)
    pdf.rect(ML, y, 13, 13, RenderStyle.F, round_corners=True, corner_radius=2)
    pdf.set_font("bn", "B", 11.4)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(ML, y + 3.2)
    pdf.cell(13, 6, "০১", align="C")
    pdf.set_xy(ML + 17, y + 1.4)
    pdf.set_font("bns", "B", 6.8)
    pdf.set_text_color(*OLIVE_DEEP)
    pdf.cell(120, 4, "INTRODUCTION  ·  LEARNING FRAMEWORK", align="L")
    pdf.set_xy(ML + 17, y + 5.8)
    pdf.set_font("bns", "", 6.6)
    pdf.set_text_color(*CHARCOAL_SOFT)
    pdf.cell(120, 4, "HOW TO USE THIS BOOK", align="L")

    pdf.set_xy(ML, y + 17)
    pdf.set_font("bn", "B", 19.5)
    pdf.set_text_color(*CHARCOAL_DEEP)
    pdf.multi_cell(CW - 4, 9.8, DATA["introduction"]["heading"], align="L")
    pdf.ln(2)
    pdf.set_fill_color(*OLIVE)
    pdf.rect(ML, pdf.get_y(), 22, 1.2, RenderStyle.F)
    pdf.set_fill_color(*SUNSET)
    pdf.rect(ML + 22, pdf.get_y(), 11, 1.2, RenderStyle.F)
    pdf.ln(5)
    pdf.image_block(IMG / "scene-intro.jpg", "মাঠ পর্যায়ের প্রশিক্ষণই তৈরি করে আত্মবিশ্বাসী কনসালট্যান্ট", height=62)

    for p in DATA["introduction"]["paragraphs"]:
        pdf.body(p)

    # framework
    pdf.sub_heading("পাঁচ ধাপের শেখার কাঠামো")
    fw = DATA["framework"]
    box_w = (CW - 4 * 3.4) / 5
    y0 = pdf.get_y()
    pdf.set_font("bn", "", 6.6)
    desc_max = max(
        pdf.multi_cell(box_w - 4.4, 3.4, item["desc"], dry_run=True, output="HEIGHT", align="L")
        for item in fw
    )
    pdf.set_font("bn", "B", 8.0)
    title_max = max(
        pdf.multi_cell(box_w - 4.4, 4.2, item["titleBn"], dry_run=True, output="HEIGHT", align="L")
        for item in fw
    )
    row_h = 13.4 + title_max + desc_max + 3.0
    if y0 + row_h + 12 > PAGE_H - MB:
        pdf.add_page()
        y0 = pdf.get_y()
    for i, item in enumerate(fw):
        x = ML + i * (box_w + 3.4)
        pdf.set_fill_color(*WHITE)
        pdf.rect(x, y0, box_w, row_h, RenderStyle.F, round_corners=True, corner_radius=1.6)
        pdf.set_draw_color(*CHARCOAL)
        with pdf.local_context(stroke_opacity=0.18):
            pdf.set_line_width(0.15)
            pdf.rect(x, y0, box_w, row_h, RenderStyle.D, round_corners=True, corner_radius=1.6)
        pdf.set_fill_color(*OLIVE)
        pdf.rect(x, y0, box_w, 1.6, RenderStyle.F, round_corners=True, corner_radius=0.4)
        pdf.set_xy(x + 2.2, y0 + 3.4)
        pdf.set_font("bns", "B", 6.0)
        pdf.set_text_color(*OLIVE_DEEP)
        pdf.cell(box_w - 4.4, 4, "0" + bn(i + 1), align="L")
        pdf.set_xy(x + 2.2, y0 + 7.4)
        pdf.set_font("bn", "B", 8.0)
        pdf.set_text_color(*CHARCOAL_DEEP)
        pdf.multi_cell(box_w - 4.4, 4.2, item["titleBn"], align="L")
        pdf.set_xy(x + 2.2, y0 + 12.4 + title_max)
        pdf.set_font("bn", "", 6.6)
        pdf.set_text_color(*CHARCOAL_SOFT)
        pdf.multi_cell(box_w - 4.4, 3.4, item["desc"], align="L")
    pdf.set_y(y0 + row_h + 5)
    pdf.body(DATA["introduction"]["frameworkIntro"], size=9.0)
    pdf.body(DATA["introduction"]["closing"], size=9.0)

    # chapters
    for ch in DATA["chapters"]:
        pages.append(draw_chapter(pdf, ch))

    # sales mastery appendices
    pages.append(draw_mastery_need_based(pdf))
    pages.append(draw_mastery_objection_method(pdf))
    pages.append(draw_mastery_mock_tests(pdf))
    pages.append(draw_mastery_no_need(pdf))

    # quick reference
    pdf.running_label = "APPENDIX E · QUICK REFERENCE"
    pdf.add_page()
    pages.append(pdf.page_no())
    pdf.set_font("bns", "B", 7.0)
    pdf.set_text_color(*OLIVE_DEEP)
    pdf.cell(80, 5, "APPENDIX E", align="L")
    pdf.ln(7)
    pdf.set_font("bn", "B", 17)
    pdf.set_text_color(*CHARCOAL_DEEP)
    pdf.multi_cell(CW, 9.0, DATA["quickReference"]["heading"], align="L")
    pdf.ln(2)
    pdf.set_fill_color(*OLIVE)
    pdf.rect(ML, pdf.get_y(), 22, 1.2, RenderStyle.F)
    pdf.set_fill_color(*SUNSET)
    pdf.rect(ML + 22, pdf.get_y(), 11, 1.2, RenderStyle.F)
    pdf.ln(5)
    pdf.body("ফিল্ডে দ্রুত উত্তর দেওয়ার জন্য এক পাতার সারসংক্ষেপ। যেকোনো চূড়ান্ত সিদ্ধান্তের আগে অনুমোদিত প্রোডাক্ট ফাইল যাচাই করুন।", size=9.0)
    pdf.table(
        DATA["quickReference"]["headers"],
        DATA["quickReference"]["rows"],
        font_size=6.7,
        widths=[26, 20, 22, 24, 30, 26, 18],
    )

    # master assessment
    pdf.running_label = "APPENDIX F · MASTER ASSESSMENT"
    pdf.add_page()
    pages.append(pdf.page_no())
    pdf.set_font("bns", "B", 7.0)
    pdf.set_text_color(*OLIVE_DEEP)
    pdf.cell(80, 5, "APPENDIX F", align="L")
    pdf.ln(7)
    pdf.set_font("bn", "B", 17)
    pdf.set_text_color(*CHARCOAL_DEEP)
    pdf.multi_cell(CW, 9.0, DATA["masterAssessment"]["heading"], align="L")
    pdf.ln(2)
    pdf.set_fill_color(*OLIVE)
    pdf.rect(ML, pdf.get_y(), 22, 1.2, RenderStyle.F)
    pdf.set_fill_color(*SUNSET)
    pdf.rect(ML + 22, pdf.get_y(), 11, 1.2, RenderStyle.F)
    pdf.ln(5)
    pdf.body(DATA["masterAssessment"]["intro"], size=9.0)

    for i, q in enumerate(DATA["masterAssessment"]["questions"]):
        pad = 5.2
        inner = CW - pad * 2
        pdf.will_page_break(60)
        y0 = pdf.get_y()
        pdf.set_font("bn", "", 8.6)
        q_h = pdf.multi_cell(inner, 5.3, q["question"], dry_run=True, output="HEIGHT", align="L")
        opt_h = [
            pdf.multi_cell(inner - 10, 5.1, f"{o['key']}) {o['text']}", dry_run=True, output="HEIGHT", align="L") + 1.8
            for o in q["options"]
        ]
        exp_h = pdf.multi_cell(inner, 5.1, q["explanation"], dry_run=True, output="HEIGHT", align="L")
        total = pad + 10 + q_h + 2.4 + sum(opt_h) + 10 + exp_h + pad + 4 - 20.6
        if y0 + total > PAGE_H - MB:
            pdf.add_page()
            y0 = pdf.get_y()
        pdf.panel(ML, y0, CW, total, PLUM_SOFT, bar=PLUM)
        pdf.set_xy(ML + pad, y0 + pad - 1.4)
        pdf.set_font("bn", "B", 8.8)
        pdf.set_text_color(*PLUM)
        pdf.cell(inner, 4.8, f"প্রশ্ন {bn(i + 1)} · {q.get('product', '')}", align="L")
        pdf.ln(5.8)
        pdf.set_x(ML + pad)
        pdf.set_font("bn", "B", 8.9)
        pdf.set_text_color(*CHARCOAL_DEEP)
        pdf.multi_cell(inner, 5.3, q["question"], align="L")
        pdf.ln(2.0)
        for o, h in zip(q["options"], opt_h):
            correct = o["key"] == q["correct"]
            y = pdf.get_y()
            pdf.set_fill_color(*(FOREST_SOFT if correct else WHITE))
            pdf.rect(ML + pad, y, inner, h, RenderStyle.F, round_corners=True, corner_radius=1.2)
            pdf.set_x(ML + pad + 2.2)
            pdf.set_font("bn", "B", 8.3)
            pdf.set_text_color(*(FOREST if correct else PLUM))
            pdf.cell(7, 5.1, o["key"])
            pdf.set_font("bn", "B" if correct else "", 8.5)
            pdf.set_text_color(*(FOREST if correct else INK))
            pdf.multi_cell(inner - 10, 5.1, o["text"], align="L")
            pdf.ln(0.7)
        pdf.ln(1.2)
        pdf.set_x(ML + pad)
        pdf.set_font("bn", "B", 8.5)
        pdf.set_text_color(*FOREST)
        pdf.cell(inner, 4.8, "✔ সঠিক উত্তর: " + q["correct"], align="L")
        pdf.ln(5.2)
        pdf.set_x(ML + pad)
        pdf.set_font("bn", "", 8.5)
        pdf.set_text_color(43, 74, 43)
        pdf.multi_cell(inner, 5.1, q["explanation"], align="L")
        if os.environ.get("SLI_DEBUG"):
            print(f"[master] allocated={total:.1f} used={pdf.get_y()-y0:.1f}")
        pdf.set_y(y0 + total + 4.0)

    # ethics
    pdf.running_label = "APPENDIX G · FIELD ETHICS"
    pdf.add_page()
    pages.append(pdf.page_no())
    pdf.set_font("bns", "B", 7.0)
    pdf.set_text_color(*OLIVE_DEEP)
    pdf.cell(80, 5, "APPENDIX G", align="L")
    pdf.ln(7)
    pdf.set_font("bn", "B", 17)
    pdf.set_text_color(*CHARCOAL_DEEP)
    pdf.multi_cell(CW, 9.0, DATA["ethicsChecklist"]["heading"], align="L")
    pdf.ln(2)
    pdf.set_fill_color(*OLIVE)
    pdf.rect(ML, pdf.get_y(), 22, 1.2, RenderStyle.F)
    pdf.set_fill_color(*SUNSET)
    pdf.rect(ML + 22, pdf.get_y(), 11, 1.2, RenderStyle.F)
    pdf.ln(5)
    pdf.body(DATA["ethicsChecklist"]["intro"], size=9.0)
    pdf.ln(1)

    for i, item in enumerate(DATA["ethicsChecklist"]["items"]):
        pdf.will_page_break(20)
        y = pdf.get_y()
        pdf.set_font("bn", "", 9.0)
        self_h = pdf.multi_cell(CW - 22, 5.4, item, dry_run=True, output="HEIGHT", align="L")
        box_h = self_h + 4.6
        pdf.set_fill_color(*WHITE)
        pdf.rect(ML, y, CW, box_h, RenderStyle.F, round_corners=True, corner_radius=1.4)
        pdf.set_draw_color(*CHARCOAL)
        with pdf.local_context(stroke_opacity=0.16):
            pdf.set_line_width(0.14)
            pdf.rect(ML, y, CW, box_h, RenderStyle.D, round_corners=True, corner_radius=1.4)
        pdf.set_draw_color(*OLIVE)
        pdf.set_line_width(0.5)
        with pdf.local_context(stroke_opacity=0.55):
            pdf.rect(ML + 4, y + 3.4, 3.4, 3.4, RenderStyle.D, round_corners=True, corner_radius=0.6)
        pdf.set_xy(ML + 10, y + 3.0)
        pdf.set_font("bn", "", 9.0)
        pdf.set_text_color(*INK)
        pdf.multi_cell(CW - 22, 5.4, item, align="L")
        pdf.set_xy(PAGE_W - MR - 10, y + 3.0)
        pdf.set_font("bns", "B", 7.4)
        pdf.set_text_color(*CHARCOAL_SOFT)
        pdf.cell(8, 5, bn(i + 1) if i < 9 else bn(i + 1), align="R")
        pdf.set_y(y + box_h + 2.6)

    # closing
    pdf.running_label = "CLOSING"
    pdf.add_page()
    pages.append(pdf.page_no())
    pdf.set_font("bns", "B", 7.0)
    pdf.set_text_color(*OLIVE_DEEP)
    pdf.cell(80, 5, "CLOSING", align="L")
    pdf.ln(7)
    pdf.set_font("bn", "B", 17)
    pdf.set_text_color(*CHARCOAL_DEEP)
    pdf.multi_cell(CW, 9.0, DATA["closing"]["heading"], align="L")
    pdf.ln(2)
    pdf.set_fill_color(*OLIVE)
    pdf.rect(ML, pdf.get_y(), 22, 1.2, RenderStyle.F)
    pdf.set_fill_color(*SUNSET)
    pdf.rect(ML + 22, pdf.get_y(), 11, 1.2, RenderStyle.F)
    pdf.ln(6)
    pdf.image_block(IMG / "scene-scep.jpg", "আজকের সঠিক পরামর্শই আগামীর নিশ্চিত ভবিষ্যৎ", height=66)
    for p in DATA["closing"]["paragraphs"]:
        pdf.body(p)

    pdf.will_page_break(30)
    y0 = pdf.get_y() + 2
    pdf.set_fill_color(*CHARCOAL_DEEP)
    pdf.rect(ML, y0, CW, 24, RenderStyle.F, round_corners=True, corner_radius=2)
    pdf.set_xy(ML + 6, y0 + 5.4)
    pdf.set_font("bn", "B", 10.6)
    pdf.set_text_color(*WHITE)
    pdf.multi_cell(CW - 12, 6.2, "শান্তা লাইফে আমরা বিশ্বাস করি — সঠিক পরামর্শই সবচেয়ে বড় সুরক্ষা।", align="C")
    pdf.set_xy(ML + 6, y0 + 16.2)
    pdf.set_font("bns", "", 6.4)
    pdf.set_text_color(200, 200, 196)
    pdf.cell(CW - 12, 4, "SHANTA LIFE INSURANCE PLC", align="C")
    pdf.set_y(y0 + 30)

    y0 = pdf.get_y()
    pdf.panel(ML, y0, CW, 20, OLIVE_TINT, bar=OLIVE)
    pdf.set_xy(ML, y0 + 3.2)
    pdf.set_font("bns", "B", 6.6)
    pdf.set_text_color(*OLIVE_DEEP)
    pdf.cell(CW, 4, "★  GOLDEN RULE", align="C")
    pdf.set_xy(ML + 6, y0 + 8.0)
    pdf.set_font("bn", "B", 9.2)
    pdf.set_text_color(*CHARCOAL_DEEP)
    pdf.multi_cell(
        CW - 12,
        5.4,
        "গ্রাহকের চাহিদা শুনুন, সৎভাবে সমাধান দিন, একচ্যুয়ারিয়াল নিয়ম মেনে চলুন — এটাই শান্তা লাইফের ফিল্ড সাফল্যের চিরন্তন সূত্র!",
        align="C",
    )
    pdf.set_y(y0 + 24)

    # credits
    pdf.will_page_break(40)
    pdf.sub_heading("ভিজ্যুয়াল, ব্র্যান্ড ও তথ্যসূত্র")
    for line in (
        "লোগো: শান্তা লাইফ ইনস্যুরেন্স পিএলসি-র অনুমোদিত ব্র্যান্ড অ্যাসেট (কালার ও হোয়াইট ভার্সন)।",
        "রঙ ও লোগো ব্যবহার: Shanta Life Brand Guidelines — Charcoal Grey #3C3C3B, Olive Green #978C21, Sunset Orange #F37021।",
        "দৃশ্য-ইলাস্ট্রেশন: বইয়ের প্রতিটি অধ্যায়ের গল্পের সঙ্গে মিল রেখে ব্র্যান্ড প্যালেটে নির্মিত মৌলিক দৃশ্য।",
        "ফিল্ড ফটো: শান্তা লাইফের অভ্যন্তরীণ প্রশিক্ষণ আর্কাইভ থেকে সংগৃহীত।",
    ):
        pdf.bullet(line, size=8.4, color=CHARCOAL_SOFT)

    draw_back_cover(pdf)

    pdf.output(str(out))
    return pages


def main() -> int:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    prepare_cover_bg()
    prepare_back_cover_bg()
    # pass 1 — collect page numbers, pass 2 — render with real TOC numbers
    pages = build(None, OUT)
    build(pages, OUT)
    if os.environ.get("SLI_DEBUG"):
        print("[toc pages]", pages)
    size_kb = OUT.stat().st_size / 1024
    print(f"✓ PDF written to {OUT.relative_to(ROOT)} ({size_kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
