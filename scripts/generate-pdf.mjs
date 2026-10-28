import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "src/data/ebookContent.json"), "utf-8"));

const fontSans = fs.readFileSync(path.join(__dirname, "fonts/NotoSansBengali-Regular.ttf")).toString("base64");
const fontSerif = fs.readFileSync(path.join(__dirname, "fonts/NotoSerifBengali-Regular.ttf")).toString("base64");

const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function storyHtml(story) {
  if (!story) return "";
  return `
  <div class="box story-box">
    <div class="box-head">📖 গল্প (Story)</div>
    <div class="box-body">
      <p class="chars">চরিত্র: ${esc(story.characters)}</p>
      ${story.dialogue
        .map(
          (d) => `
        <div class="bubble">
          <div class="speaker">${esc(d.speaker)}</div>
          <div class="text">${esc(d.text)}</div>
        </div>`
        )
        .join("")}
    </div>
  </div>`;
}

function tableHtml(headers, rows) {
  return `
  <table class="data-table">
    <thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}
    </tbody>
  </table>`;
}

function formulaHtml(f) {
  return `
  <div class="formula-box">
    <p class="formula-label">🧮 ${esc(f.label)}</p>
    <ol>${f.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
  </div>`;
}

function explSectionHtml(s) {
  let out = "";
  if (s.heading) out += `<h4>${esc(s.heading)}</h4>`;
  (s.paragraphs || []).forEach((p) => (out += `<p>${esc(p)}</p>`));
  if (s.bullets) out += `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`;
  (s.paragraphs2 || []).forEach((p) => (out += `<p>${esc(p)}</p>`));
  if (s.formulas) out += s.formulas.map(formulaHtml).join("");
  if (s.note) out += `<p class="note">📝 ${esc(s.note)}</p>`;
  return out;
}

function explanationHtml(exp) {
  let out = `<div class="box expl-box"><div class="box-head">💡 সহজ ব্যাখ্যা (Simple Explanation)</div><div class="box-body">`;
  if (exp.paramTable) {
    out += `<h4>প্রোডাক্টের মূল বৈশিষ্ট্যসমূহ</h4>${tableHtml(exp.paramTable.headers, exp.paramTable.rows)}`;
  }
  [...(exp.sections || []), ...(exp.sections2 || [])].forEach((s) => (out += explSectionHtml(s)));
  if (exp.tierTable) {
    out += `<h4>SDPP ৩-টায়ার আর্কিটেকচার</h4>${tableHtml(exp.tierTable.headers, exp.tierTable.rows)}`;
  }
  if (exp.riderTable) {
    out += `<h4>শান্তা লাইফের রাইডার ম্যাট্রিক্স</h4>${tableHtml(exp.riderTable.headers, exp.riderTable.rows)}`;
  }
  out += `</div></div>`;
  return out;
}

function redAlertHtml(items) {
  return `
  <div class="box alert-box">
    <div class="box-head">🚨 রেড অ্যালার্ট (Red Alert)</div>
    <div class="box-body">
      <ul class="alert-list">${items.map((i) => `<li>❌ ${esc(i)}</li>`).join("")}</ul>
    </div>
  </div>`;
}

function quizHtml(q, indexLabel) {
  return `
  <div class="box quiz-box">
    <div class="box-head">🧠 কুইজ / নিজেকে যাচাই করুন${indexLabel ? " — " + esc(indexLabel) : ""}</div>
    <div class="box-body">
      <p class="quiz-q">${esc(q.question)}</p>
      <ul class="quiz-options">
        ${q.options
          .map(
            (o) =>
              `<li class="${o.key === q.correct ? "correct" : ""}"><b>${esc(o.key)})</b> ${esc(o.text)}</li>`
          )
          .join("")}
      </ul>
      <div class="quiz-answer">
        <p><b>✅ সঠিক উত্তর: ${esc(q.correct)}</b></p>
        <p>${esc(q.explanation)}</p>
      </div>
    </div>
  </div>`;
}

function goldenRuleHtml(text) {
  return `<div class="golden-box">⭐ গোল্ডেন রুল<br/><span>${esc(text)}</span></div>`;
}

function bridgeHtml(text) {
  return `<div class="bridge-box">➡️ ${esc(text)}</div>`;
}

let body = "";

// Cover Page
body += `
<section class="cover">
  <p class="cover-company">${esc(data.meta.company)}</p>
  <div class="cover-icon">🛡️</div>
  <h1>${esc(data.meta.titleBn)}</h1>
  <p class="cover-sub">${esc(data.meta.subtitleBn)}</p>
  <p class="cover-footer">${esc(data.meta.footer)}</p>
</section>`;

// TOC
body += `
<section class="toc-page">
  <h2>সূচিপত্র</h2>
  <ul class="toc-list">
    <li>১. ভূমিকা ও লার্নিং ফ্রেমওয়ার্ক</li>
    ${data.chapters.map((c) => `<li>${esc(c.number)}. ${esc(c.titleBn)} (${esc(c.titleEn)})</li>`).join("")}
    <li>পরিশিষ্ট: দ্রুত রেফারেন্স টেবিল</li>
    <li>৮. মাস্টার অ্যাসেসমেন্ট ও সেলস এথিক্স চেকমেট</li>
    <li>উপসংহার</li>
  </ul>
</section>`;

// Introduction
body += `<section class="chapter">
  <p class="eyebrow">অধ্যায় ১</p>
  <h2>${esc(data.introduction.heading)}</h2>
  ${data.introduction.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
  <h3>${esc(data.introduction.frameworkIntro)}</h3>
  <div class="framework-grid">
    ${data.framework
      .map(
        (f) => `<div class="framework-item"><div class="emoji">${f.emoji}</div><div class="ftitle">${esc(f.titleBn)}</div><div class="fdesc">${esc(f.desc)}</div></div>`
      )
      .join("")}
  </div>
  <p class="closing-note">${esc(data.introduction.closing)}</p>
</section>`;

// Chapters
data.chapters.forEach((chapter) => {
  body += `<section class="chapter">
    <p class="eyebrow">অধ্যায় ${esc(chapter.number)} · ${esc(chapter.titleEn)}</p>
    <h2>${esc(chapter.titleBn)}</h2>
    <p class="tagline">${esc(chapter.tagline)}</p>
    <p>${esc(chapter.intro)}</p>
    ${storyHtml(chapter.story)}
    ${explanationHtml(chapter.explanation || {})}
    ${chapter.redAlerts ? redAlertHtml(chapter.redAlerts) : ""}
    ${chapter.quiz ? quizHtml(chapter.quiz) : ""}
    ${chapter.goldenRule ? goldenRuleHtml(chapter.goldenRule) : ""}
    ${chapter.bridge ? bridgeHtml(chapter.bridge) : ""}
  </section>`;
});

// Quick reference
body += `<section class="chapter">
  <p class="eyebrow">পরিশিষ্ট</p>
  <h2>${esc(data.quickReference.heading)}</h2>
  ${tableHtml(data.quickReference.headers, data.quickReference.rows)}
</section>`;

// Master Assessment
body += `<section class="chapter">
  <p class="eyebrow">অধ্যায় ৮</p>
  <h2>${esc(data.masterAssessment.heading)}</h2>
  <p>${esc(data.masterAssessment.intro)}</p>
  ${data.masterAssessment.questions.map((q, i) => quizHtml(q, `প্রশ্ন ${i + 1} (${q.product})`)).join("")}
</section>`;

// Ethics
body += `<section class="chapter">
  <h2>${esc(data.ethicsChecklist.heading)}</h2>
  <p>${esc(data.ethicsChecklist.intro)}</p>
  <ul class="ethics-list">
    ${data.ethicsChecklist.items.map((i) => `<li>✅ ${esc(i)}</li>`).join("")}
  </ul>
</section>`;

// Closing
body += `<section class="chapter closing">
  <p class="eyebrow">সমাপনী</p>
  <h2>${esc(data.closing.heading)}</h2>
  ${data.closing.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
  ${goldenRuleHtml("গ্রাহকের চাহিদা শুনুন, সৎভাবে সমাধান দিন, একচ্যুয়ারিয়াল নিয়ম মেনে চলুন — এটাই শান্তা লাইফের ফিল্ড সাফল্যের চিরন্তন সূত্র!")}
</section>`;

const html = `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'NotoBengali';
    src: url(data:font/ttf;base64,${fontSans}) format('truetype');
    font-weight: normal;
  }
  @font-face {
    font-family: 'NotoBengaliSerif';
    src: url(data:font/ttf;base64,${fontSerif}) format('truetype');
    font-weight: normal;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'NotoBengali', 'Noto Color Emoji', sans-serif;
    color: #1e293b;
    font-size: 12.5px;
    line-height: 1.75;
    margin: 0;
  }
  h1, h2, h3, h4 { font-family: 'NotoBengaliSerif', 'NotoBengali', 'Noto Color Emoji', sans-serif; color: #0f172a; }
  p { margin: 0 0 10px 0; text-align: justify; }
  .cover {
    height: 277mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: linear-gradient(160deg,#047857,#0f766e 60%,#0e7490);
    color: white;
    page-break-after: always;
  }
  .cover-company { font-size: 16px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px; opacity: .9;}
  .cover-icon { font-size: 70px; margin-bottom: 20px; }
  .cover h1 { color: white; font-size: 38px; margin: 0 0 18px 0; max-width: 700px; line-height: 1.4; }
  .cover-sub { font-size: 16px; max-width: 600px; opacity: .95; margin-bottom: 220px; }
  .cover-footer { font-size: 12px; opacity: .8; position: absolute; bottom: 40px; }
  .toc-page { page-break-after: always; padding-top: 20px; }
  .toc-page h2 { font-size: 26px; border-bottom: 3px solid #0f766e; padding-bottom: 10px; }
  .toc-list { list-style: none; padding: 0; margin-top: 20px; }
  .toc-list li { padding: 10px 14px; font-size: 14px; border-bottom: 1px dashed #cbd5e1; font-weight: 600; }
  .chapter { page-break-before: always; padding-top: 10px; }
  .chapter.closing { page-break-after: avoid; }
  .eyebrow { color: #0f766e; font-weight: 700; font-size: 11px; letter-spacing: .5px; margin-bottom: 4px; }
  .chapter h2 { font-size: 24px; margin: 0 0 10px 0; }
  .tagline { color: #0f766e; font-weight: 700; font-size: 14px; margin-bottom: 10px; }
  h4 { font-size: 14px; margin: 16px 0 8px; }
  h3 { font-size: 17px; margin: 18px 0 10px; }

  .box { border-radius: 10px; overflow: hidden; margin: 16px 0; border: 1px solid; break-inside: avoid; }
  .box-head { font-weight: 800; font-size: 14px; padding: 8px 14px; }
  .box-body { padding: 12px 16px; }

  .story-box { border-color: #f59e0b; background: #fffbeb; }
  .story-box .box-head { background: #fde68a; color: #78350f; }
  .chars { font-style: italic; color: #92400e; font-size: 12px; margin-bottom: 10px; }
  .bubble { margin-bottom: 10px; background: white; border-radius: 8px; padding: 8px 12px; border: 1px solid #fde68a; }
  .bubble .speaker { font-weight: 800; color: #92400e; font-size: 11.5px; margin-bottom: 2px; }
  .bubble .text { color: #334155; }

  .expl-box { border-color: #38bdf8; background: #f0f9ff; }
  .expl-box .box-head { background: #bae6fd; color: #075985; }

  .alert-box { border-color: #fb7185; background: #fff1f2; }
  .alert-box .box-head { background: #fecdd3; color: #9f1239; }
  .alert-list { list-style: none; padding: 0; margin: 0; }
  .alert-list li { margin-bottom: 8px; color: #9f1239; }

  .quiz-box { border-color: #a78bfa; background: #f5f3ff; }
  .quiz-box .box-head { background: #ddd6fe; color: #5b21b6; }
  .quiz-q { font-weight: 700; margin-bottom: 10px; }
  .quiz-options { list-style: none; padding: 0; margin: 0 0 10px 0; }
  .quiz-options li { padding: 6px 10px; margin-bottom: 4px; border-radius: 6px; background: white; border: 1px solid #e9d5ff; }
  .quiz-options li.correct { background: #dcfce7; border-color: #4ade80; color: #166534; font-weight: 700; }
  .quiz-answer { background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 8px 12px; }
  .quiz-answer p { margin: 2px 0; color: #065f46; }

  table.data-table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; font-size: 11.5px; }
  table.data-table th { background: #1e293b; color: white; text-align: right; padding: 7px 10px; }
  table.data-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
  table.data-table tr:nth-child(even) td { background: #f8fafc; }

  .formula-box { background: #eef2ff; border: 1px solid #a5b4fc; border-radius: 8px; padding: 10px 14px; margin: 10px 0; }
  .formula-label { font-weight: 800; color: #3730a3; margin-bottom: 6px; }
  .formula-box ol { margin: 0; padding-right: 18px; padding-left: 0; }
  .formula-box li { margin-bottom: 4px; color: #312e81; }

  .note { background: #f1f5f9; border-radius: 6px; padding: 6px 10px; font-style: italic; color: #475569; font-size: 11.5px; }

  .golden-box {
    background: linear-gradient(135deg,#fde68a,#fbbf24);
    border-radius: 10px;
    padding: 16px;
    text-align: center;
    font-weight: 800;
    color: #78350f;
    margin: 14px 0;
  }
  .golden-box span { display: block; margin-top: 6px; font-size: 15px; }

  .bridge-box { background: #d1fae5; border-right: 5px solid #059669; border-radius: 6px; padding: 10px 14px; color: #065f46; margin-top: 14px; }

  .framework-grid { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
  .framework-item { flex: 1 1 30%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
  .framework-item .emoji { font-size: 20px; }
  .framework-item .ftitle { font-weight: 800; margin: 4px 0; font-size: 12.5px; }
  .framework-item .fdesc { font-size: 10.5px; color: #475569; }

  .ethics-list { list-style: none; padding: 0; }
  .ethics-list li { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; color: #065f46; }

  .closing-note { color: #0e7490; font-style: italic; margin-top: 10px; }
</style>
</head>
<body>
${body}
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, "_ebook-render.html"), html);

const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle0" });
const outPath = path.join(root, "public", "shanta-life-ebook.pdf");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
await page.pdf({
  path: outPath,
  format: "A4",
  printBackground: true,
  margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div></div>`,
  footerTemplate: `<div style="font-size:9px; width:100%; text-align:center; color:#94a3b8; font-family: sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
});
await browser.close();
console.log("PDF generated at", outPath);
