# গল্পে গল্পে শিখি — শান্তা লাইফের বিমা প্রোডাক্ট ও আন্ডাররাইটিং গাইডলাইন

**ফিল্ড ফোর্স প্রশিক্ষণ ই-বুক** · Shanta Life Insurance PLC — Learning & Development

A brand-compliant digital book that presents every Shanta Life product module **and the
underwriting guideline** as field stories, plus a printable **PDF** and an editable
**Word (DOCX)** edition.

---

## 1. What is inside

| Surface | Location | Notes |
| --- | --- | --- |
| Web e-book (React + Vite + Tailwind 4) | `src/` | Reading-first layout, sticky table of contents, reading progress, interactive quizzes |
| Downloadable **PDF** (84 pages, A4) | `public/shanta-life-ebook.pdf` | Cover, title page, contents with real page numbers, chapter scene art, objection playbooks, hard-question mock bank, back cover |
| Downloadable **Word** file | `public/shanta-life-ebook.docx` | Same structure/visuals; each chapter starts on a new page, chapter = Heading 1 / section = Heading 2, field-based automatic TOC, SDPP tier table on its own page |
| Brand assets | `public/assets/img/` | Approved logo (colour + white), cover artwork, scene illustrations, field photos |
| Bengali webfonts | `public/fonts/` | Self-hosted Noto Sans Bengali (400 / 600 / 700 / 800) |

Content was extended (2026-10) in two passes. First: the field stories were rewritten
longer and warmer, and four training banks were added — a need-based selling framework,
a 7-step objection-handling method (LAER-PC), a hard mock-test bank and a no-need ethics
playbook. Second: a new **Part II — Underwriting Guideline** (chapters ৮–১২) built from
the approved underwriting presentation and documentation:

| Chapter | Focus |
| --- | --- |
| ৮ · আন্ডাররাইটিং কী এবং কেন প্রয়োজন? | definition, underwriter's role, 5 risk drivers, process flow |
| ৯ · প্রয়োজনীয় নথি ও গাইডলাইন | adult / minor / payor document lists, 60-second checklist |
| ১০ · স্বাস্থ্যগত ও পারিবারিক তথ্যের সততা | utmost good faith, medical & family history, rider amounts |
| ১১ · এজেন্ট/ফিল্ড আন্ডাররাইটারের দায়বদ্ধতা | FA UW report fields, risk categorisation, pocket checklist |
| ১২ · মেডিকেল ও ফিন্যান্সিয়াল আন্ডাররাইটিং গ্রিড | age × sum-assured grid, 50 lakh / 1 crore panels, child limits |

Every product and underwriting figure in the new material comes from the supplied
product chapters and underwriting documentation — nothing is invented.

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

## 5. Deploying on Vercel

The repository ships a `vercel.json` at the root. **The project is a single static
service** — a Vite build that outputs one self-contained `dist/index.html` plus the
`public/` files (scene art, Bengali fonts, the PDF and the DOCX).

| Setting | Value |
| --- | --- |
| Framework preset | Vite (auto-detected) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node runtime | any 20+ image (Vite 7 requires Node 20.19+ / 22.12+) |

Import the repo in Vercel, keep the detected settings, and deploy — no environment
variables and no build-time services are required.

**Why there is no `services` block:** `scripts/` holds *offline generators*
(`build_pdf.py`, `generate-docx.mjs`) that produce the PDF and Word files committed in
`public/`; they are run by a human (`npm run build:book`), not per request. They expose
no HTTP entrypoint, so declaring them as a Python service would fail to build and add no
runtime capability. The site never calls any backend: every page, image, font and
download is static, so there are no inter-service bindings to declare either.

If a runtime API is ever needed, add it as its own directory with a real entrypoint
(e.g. `api/app.py` exposing `app`), declare it as a second service, make it public on a
specific path (`/api/(.*)`) — and give the `app` service a binding to it, e.g.
`{ "type": "service", "service": "api", "format": "url", "env": "API_URL" }`, then read
`process.env.API_URL` in the browser bundle's build-time config or in another function.

## 6. Content model

`src/data/ebookContent.json` is the single source of truth for text — the website, the
PDF and the DOCX all read from it. `src/data/visuals.ts` maps each chapter to its scene
illustration and caption, so a new visual can be added without touching the copy.

Per chapter the reader gets: **scene art → intro → গল্প (story) → সহজ ব্যাখ্যা
(explanation, tables and actuarial formulas) → রেড অ্যালার্ট → কুইজ → গোল্ডেন রুল →
পরবর্তী অধ্যায়**.
