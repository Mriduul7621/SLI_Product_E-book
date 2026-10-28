# গল্পে গল্পে শিখি — শান্তা লাইফের বিমা প্রোডাক্ট

**ফিল্ড ফোর্স প্রশিক্ষণ ই-বুক** · Shanta Life Insurance PLC — Learning & Development

A brand-compliant digital book that presents every Shanta Life product module as a
field story, plus a printable **PDF** and an editable **Word (DOCX)** edition.

---

## 1. What is inside

| Surface | Location | Notes |
| --- | --- | --- |
| Web e-book (React + Vite + Tailwind 4) | `src/` | Reading-first layout, sticky table of contents, reading progress, interactive quizzes |
| Downloadable **PDF** (29 pages, A4) | `public/shanta-life-ebook.pdf` | Cover, title page, contents with real page numbers, chapter scene art, callouts, back cover |
| Downloadable **Word** file | `public/shanta-life-ebook.docx` | Same structure/visuals, fully editable in MS Word / Google Docs |
| Brand assets | `public/assets/img/` | Approved logo (colour + white), cover artwork, scene illustrations, field photos |
| Bengali webfonts | `public/fonts/` | Self-hosted Noto Sans Bengali (400 / 600 / 700 / 800) |

Text content is unchanged — only the design, visuals, structure and export pipeline were rebuilt.

## 2. Brand compliance

Taken directly from `Shanta_Life_Brand_Guidelines.pdf` (Drive) and the approved
`SLI Official Template 2025` master:

| Token | Value | Usage |
| --- | --- | --- |
| Charcoal Grey | `#3C3C3B` | Text, strong panels, headers/footers |
| Olive Green | `#978C21` | Brand identity, headings, primary accents |
| Sunset Orange | `#F37021` | High-attention accents, CTAs, rules |
| Seashell | `#FCF4EB` | Paper / reading background |
| Blue · Brown · Green · Plum | `#026A8B` · `#7F2D23` · `#254525` · `#583382` | Supporting UI states only (never dominant) |

Rules honoured: approved logo artwork only (never redrawn, never recoloured),
generous clear space, no stretched/skewed logo, charcoal-dominant balance with olive
and sunset used as accents, strong text/background contrast, authentic customer-centred
imagery, clean uncluttered layouts.

Design tokens live in `src/index.css` (`@theme`), the PDF palette in
`scripts/build_pdf.py`, the Word palette in `scripts/generate-docx.mjs`.

## 3. Running the site

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # single-file build in dist/
npm run typecheck
```

## 4. Regenerating the book files

```bash
npm run build:docx                      # Word edition  → public/shanta-life-ebook.docx
pip install -r scripts/requirements.txt # fpdf2 + uharfbuzz + pillow (only needed once)
npm run build:pdf                       # PDF edition   → public/shanta-life-ebook.pdf
npm run build:book                      # both
```

The PDF is rendered with HarfBuzz text shaping so Bengali conjuncts, vowel signs and
matras are typeset correctly, using the same self-hosted Noto Sans Bengali family as
the website. Chapter page numbers are resolved in a first pass and injected into the
contents page in a second pass.

## 5. Content model

`src/data/ebookContent.json` is the single source of truth for text — the website, the
PDF and the DOCX all read from it. `src/data/visuals.ts` maps each chapter to its scene
illustration and caption, so a new visual can be added without touching the copy.

Per chapter the reader gets: **scene art → intro → গল্প (story) → সহজ ব্যাখ্যা
(explanation, tables and actuarial formulas) → রেড অ্যালার্ট → কুইজ → গোল্ডেন রুল →
পরবর্তী অধ্যায়**.
