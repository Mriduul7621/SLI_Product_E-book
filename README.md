# Shanta Life Learning Hub

**ফিল্ড ফোর্স অ্যাকাডেমি — পড়া, মূল্যায়ন ও অগ্রগতি, এক অ্যাপে।**
Shanta Life Insurance PLC · Learning & Development

একটি অ্যাপে তিনটি কাজ একসাথে: **ই-বুক** (১৩ মডিউল, ৮৪ পৃষ্ঠার PDF ও Word সংস্করণ),
**অ্যাসেসমেন্ট** (অধ্যায়ভিত্তিক যাচাই, বড় সেট, ট্রেনার-নির্ধারিত শেয়ার লিংক) এবং
**অগ্রগতি** (লার্নার ড্যাশবোর্ড + ট্রেইনার রিপোর্ট)। সব ডেটা জমা হয় **একটিমাত্র
Google Sheet**-এ — Learning Hub স্প্রেডশিট।

> বিস্তারিত সেটআপ, স্কিমা ও সমস্যা-সমাধান: [`docs/LEARNING_HUB.md`](docs/LEARNING_HUB.md)

---

## ১. কী কী আছে

| সারফেস | কোথায় | নোট |
| --- | --- | --- |
| Learning Hub (React 19 + Vite 7 + Tailwind 4) | `src/pages/` | হোম ড্যাশবোর্ড, লাইব্রেরি, রিডার, অ্যাসেসমেন্ট, রেজাল্ট, প্রোফাইল, অ্যাডমিন |
| ই-বুক রিডার (সম্পূর্ণ বই এক পাতায়) | `/book` (`src/pages/Book.tsx`) | সূচিপত্র, রিডিং প্রগ্রেস, প্রিন্ট, PDF/Word |
| ডেটাবেস (Google Apps Script) | `apps-script/Code.gs` | ৮টি ট্যাব স্বয়ংক্রিয়ভাবে তৈরি/ম্যাপ করে, পুরনো ডেটা নষ্ট করে না |
| **PDF** (৮৪ পৃষ্ঠা, A4) | `public/shanta-life-ebook.pdf` | কভার, সূচিপত্র (পেজ নম্বরসহ), সিন আর্ট, প্লেবুক, ব্যাক কভার |
| **Word** | `public/shanta-life-ebook.docx` | প্রতি অধ্যায় নতুন পৃষ্ঠা, H1/H2, অটো TOC, ওয়াইড টেবিল আলাদা পৃষ্ঠায় |
| ব্র্যান্ড অ্যাসেট ও ফন্ট | `public/assets/img/`, `public/fonts/` | অনুমোদিত লোগো, সিন ইলাস্ট্রেশন, সেলফ-হোস্টেড নোটো সানস বাংলা |

### কনটেন্ট

| পার্ট | মডিউল |
| --- | --- |
| ভিত্তি | ০১ ভূমিকা ও লার্নিং ফ্রেমওয়ার্ক |
| **Part I — প্রোডাক্ট** | ০২ এন্ডোমেন্ট · ০৩ S4PP · ০৪ SCEP · ০৫ SSPE · ০৬ SDPP · ০৭ রাইডার |
| **Part II — আন্ডাররাইটিং** | ০৮ বেসিকস · ০৯ নথি · ১০ সততা · ১১ FA রিপোর্ট · ১২ মেডিকেল গ্রিড |
| **Mastery** | ১৩ নিড-বেজড বিক্রয়, আপত্তির ৭ ধাপ, কঠিন মক প্রশ্ন, নো-নিড এথিক্স |

প্রতিটি অধ্যায় একই ছাঁচে: **সিন আর্ট → গল্প → সহজ ব্যাখ্যা → রেড অ্যালার্ট → কুইজ →
গোল্ডেন রুল → সেলস প্লেবুক** (আপত্তি, কঠিন প্রশ্ন, ভুল ধারণা)।

## ২. আর্কিটেকচার

```
React SPA (static, Vercel)
  └── localStorage: অফলাইন ফার্স্ট স্টোর + সিঙ্ক কিউ
        └── Apps Script Web App  (GET bootstrap / POST submit …)
              └── Learning Hub Spreadsheet: Learners · Progress · Quizzes ·
                  Activations · Responses · Supervisors · Zones · Meta
```

- **অফলাইন-ফার্স্ট:** মাঠে নেটওয়ার্ক না থাকলেও পড়া, কুইজ ও অগ্রগতি কাজ করে;
  সংযোগ ফিরলে কিউ স্বয়ংক্রিয়ভাবে শিটে যায়। ডুপ্লিকেট হয় না (আইডি-ভিত্তিক upsert)।
- **একটাই শিট:** পুরনো কুইজ পোর্টালের আলাদা "Score Sheet" আর দরকার নেই। আগের
  ট্যাব থাকলে স্ক্রিপ্ট হেডার মিলিয়ে সেই কলামেই লেখে, নতুন কলাম ডানে যোগ করে।
- **কোনো লগইন নেই:** লার্নার লিংক খুলে নাম-মোবাইল দিয়ে সরাসরি অংশ নেয়;
  ট্রেইনার `/admin`-এ পিন (ডিফল্ট **2468**) দিয়ে ঢোকে।

## ৩. চালানো ও যাচাই

```bash
npm ci
npm run dev          # http://localhost:5173
npm run typecheck    # TypeScript
npm test             # ১২ রুটের SSR স্মোক + ৪০টি Apps Script বেকেন্ড চেক
npm run test:flow    # jsdom দিয়ে আসল ক্লিক-ফ্লো (কুইজ → রেজাল্ট, প্রোগ্রেস, শেয়ার লিংক)
npm run build        # dist/ — একটাই self-contained index.html
```

## ৪. Google Sheet সংযোগ (একবার)

1. Learning Hub স্প্রেডশিট → **Extensions → Apps Script** → `apps-script/Code.gs` পেস্ট → Save।
2. ফাংশন **`setupHubSheets`** → ▶ Run → অনুমতি দিন।
3. **Deploy → New deployment → Web app** (Execute as **Me**, Who has access **Anyone**)
   → `…/exec` URL কপি।
4. অ্যাপে **অ্যাডমিন → সেটিংস** → URL বসিয়ে **সেভ ও টেস্ট**।

কোড বদলালে **নতুন version deploy** করতে ভুলবেন না। বিস্তারিত: `docs/LEARNING_HUB.md`।

## ৫. বইয়ের PDF/Word পুনরায় তৈরি

```bash
npm run build:docx                      # Word → public/shanta-life-ebook.docx
pip install -r scripts/requirements.txt # fpdf2 + uharfbuzz + pillow (একবার)
npm run build:pdf                       # PDF → public/shanta-life-ebook.pdf
npm run build:book                      # দুটোই
```

PDF HarfBuzz টেক্সট শেপিং দিয়ে তৈরি, তাই বাংলা যুক্তাক্ষর ও মাত্রা সঠিক বসে।
অধ্যায়ের পেজ নম্বর প্রথম পাসে বের করে দ্বিতীয় পাসে সূচিপত্রে বসানো হয়।

## ৬. Vercel-এ ডিপ্লয়

| সেটিং | মান |
| --- | --- |
| Framework preset | Vite (auto) |
| Install / Build | `npm ci` / `npm run build` |
| Output | `dist` |
| Node | `22.x` (`.nvmrc` + `engines`) |

`vercel.json`-এ `/library`, `/book`, `/assessment`, `/admin`, `/profile`-এর জন্য
SPA rewrites আছে, যাতে ডিপ লিংক রিফ্রেশেও কাজ করে। PDF/DOCX-এ
`must-revalidate`; `/assets/*` ও `/fonts/*`-এ ক্যাশ।

**কেন কোনো `services` বা binding নেই:** `scripts/` শুধু অফলাইন জেনারেটর
(`build_pdf.py`, `generate-docx.mjs`) — কোনো HTTP এন্ট্রিপয়েন্ট নেই, তাই সেটিকে
Python সার্ভিস বানালে বিল্ড ফেল করত। রানটাইম API-র দরকার হলে Apps Script-ই সেটি
পূরণ করে (আলাদা ডিপ্লয়মেন্ট হিসেবে), ব্রাউজার থেকে সরাসরি ডাকা হয় — কোনো
inter-service binding লাগে না।

## ৭. কোড ম্যাপ

| ফাইল | কাজ |
| --- | --- |
| `src/App.tsx` | রাউটিং, শেয়ার-লিংক এন্ট্রি, ৪০৪ |
| `src/pages/*` | Home · Library · ModuleReader · Book · Assessment · TakeQuiz · Result · Profile · Admin |
| `src/lib/hub.ts` | অফলাইন স্টোর, সিঙ্ক কিউ, API ব্রিজ, ডেরাইভড সিলেক্টর |
| `src/lib/router.tsx` | History API রাউটার (বইয়ের `#anchor` অটুট রাখে) |
| `src/data/curriculum.ts` | মডিউল তালিকা + বই থেকে স্বয়ংক্রিয়ভাবে তৈরি কুইজ ব্যাংক |
| `src/data/ebookContent.json` | সব টেক্সটের একক উৎস (ওয়েব + PDF + DOCX) |
| `apps-script/Code.gs` | শিট স্কিমা, অ্যাডাপ্টিভ হেডার ম্যাপিং, GET/POST API |
| `scripts/smoke.mjs`, `scripts/flow-test.mjs`, `scripts/backend-test.mjs` | তিন স্তরের টেস্ট |

## ৮. ব্র্যান্ড কমপ্লায়েন্স

Taken from `Shanta_Life_Brand_Guidelines.pdf` (Drive) ও অনুমোদিত
`SLI Official Template 2025`:

| টোকেন | মান | ব্যবহার |
| --- | --- | --- |
| Charcoal Grey | `#3C3C3B` | টেক্সট, শক্ত প্যানেল, হেডার/ফুটার |
| Olive Green | `#978C21` | ব্র্যান্ড আইডেন্টিটি, হেডিং, অগ্রগতি |
| Sunset Orange | `#F37021` | CTA, হাইলাইট রুল, সতর্কতা |
| Seashell | `#FCF4EB` | রিডিং ব্যাকগ্রাউন্ড |
| Blue · Brown · Green · Plum | `#026A8B` · `#7F2D23` · `#254525` · `#583382` | সহায়ক স্টেট (কখনো প্রধান নয়) |

অনুমোদিত লোগো আর্টওয়ার্কই ব্যবহৃত (নতুন করে আঁকা বা রঙ বদলানো নয়), যথেষ্ট
ক্লিয়ার স্পেস, প্রসারিত/বাঁকা লোগো নেই, চারকোল-প্রধান ভারসাম্য। টোকেন:
`src/index.css` (`@theme`), PDF প্যালেট `scripts/build_pdf.py`, DOCX প্যালেট
`scripts/generate-docx.mjs`।

## ৯. কনটেন্ট মডেল

`src/data/ebookContent.json` — ওয়েব, PDF ও DOCX তিনটিরই একক টেক্সট-উৎস।
`src/data/visuals.ts` — অধ্যায় → সিন ইলাস্ট্রেশন ম্যাপিং।
`src/data/sales/*.json` — অধ্যায়ভিত্তিক স্টোরি এনরিচমেন্ট ও সেলস প্লেবুক।
`src/data/curriculum.ts` — মডিউল মেটাডেটা এবং বইয়ের কুইজ থেকে তৈরি অ্যাসেসমেন্ট ব্যাংক
(নতুন অধ্যায় যোগ করলে কুইজও নিজে থেকেই যোগ হয়)।
