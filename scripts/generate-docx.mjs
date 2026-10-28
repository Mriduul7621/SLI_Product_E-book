/**
 * Build the branded Word (.docx) edition of
 * "গল্পে গল্পে শিখি — শান্তা লাইফের বিমা প্রোডাক্ট".
 *
 * Palette follows the Shanta Life brand guidelines:
 *   Charcoal Grey #3C3C3B · Olive Green #978C21 · Sunset Orange #F37021
 *
 * Usage: npm run build:docx
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  convertMillimetersToTwip,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const IMG = path.join(root, "public/assets/img");
const data = JSON.parse(fs.readFileSync(path.join(root, "src/data/ebookContent.json"), "utf-8"));
const salesDir = path.join(root, "src/data/sales");
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(salesDir, name), "utf-8"));
const storyData = readJson("stories.json");
const mastery = readJson("mastery.json");
const salesPacks = {};
["endowment", "s4pp", "scep", "sspe", "sdpp", "riders"].forEach((id) => {
  salesPacks[id] = readJson(`${id}.json`);
});
const storyFor = (id) => (storyData.chapters || []).find((c) => c.chapterId === id);

/* ------------------------------------------------------------------ tokens */
const FONT = "Nirmala UI";
const CHARCOAL = "3C3C3B";
const CHARCOAL_DEEP = "262625";
const CHARCOAL_SOFT = "6E6E6C";
const INK = "2B2B2A";
const OLIVE = "978C21";
const OLIVE_DEEP = "6F6614";
const OLIVE_TINT = "F3F0D9";
const OLIVE_WASH = "FAF8EC";
const SUNSET = "F37021";
const SUNSET_DEEP = "C8540F";
const SUNSET_SOFT = "FDEEE3";
const SHELL = "FCF4EB";
const CLAY = "7F2D23";
const CLAY_SOFT = "FBF1EC";
const FOREST = "254525";
const FOREST_SOFT = "EEF5EC";
const PLUM = "583382";
const PLUM_SOFT = "F1ECF7";
const PAGE_TW = convertMillimetersToTwip(210);
const MARGIN = convertMillimetersToTwip(18);
const CONTENT_TW = PAGE_TW - MARGIN * 2;

const bn = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const hairBorder = (color = "D8D5CC", size = 4) => ({ style: BorderStyle.SINGLE, size, color });

/* ------------------------------------------------------------------ images */
const imageCache = new Map();
function img(file) {
  if (!imageCache.has(file)) {
    const buffer = fs.readFileSync(path.join(IMG, file));
    const type = file.toLowerCase().endsWith(".png") ? "png" : "jpg";
    imageCache.set(file, { buffer, type });
  }
  return imageCache.get(file);
}

function picture(file, widthMm, heightMm, { radius = false } = {}) {
  const { buffer, type } = img(file);
  return new ImageRun({
    type,
    data: buffer,
    transformation: {
      width: Math.round(convertMillimetersToTwip(widthMm) / 15),
      height: Math.round(convertMillimetersToTwip(heightMm) / 15),
    },
    altText: { name: file, description: file },
    ...(radius ? {} : {}),
  });
}

const CHAPTER_IMAGE = {
  endowment: "scene-endowment.jpg",
  s4pp: "scene-s4pp.jpg",
  scep: "scene-scep.jpg",
  sspe: "scene-sspe.jpg",
  sdpp: "scene-sdpp.jpg",
  riders: "scene-riders.jpg",
  "uwn-basics": "scene-uwn-basics.jpg",
  "uwn-docs": "scene-uwn-docs.jpg",
  "uwn-honesty": "scene-uwn-honesty.jpg",
  "uwn-fa-report": "scene-uwn-fa-report.jpg",
  "uwn-grid": "scene-uwn-grid.jpg",
};

const CAPTION = {
  endowment: "মেয়াদ শেষে নিশ্চিত মূলধন, মেয়াদজুড়ে পরিবারের নিরাপত্তা",
  s4pp: "মেয়াদের মাঝেই তারল্য — চার ধাপে বীমাঙ্কের অর্থ",
  scep: "পিতামাতার অবর্তমানেও থেমে থাকে না সন্তানের পড়াশোনা",
  sspe: "একবারের বিনিয়োগে দীর্ঘমেয়াদি নিশ্চিন্ততা",
  sdpp: "নমনীয় সঞ্চয় আর স্বাস্থ্য সুরক্ষা — একই পলিসিতে",
  riders: "সঠিক রাইডার যুক্ত করলেই ৩৬০-ডিগ্রি সুরক্ষা বলয়",
  "uwn-basics": "প্রস্তাব জমা মানেই পলিসি নয় — আগে আসে ঝুঁকির যাচাই",
  "uwn-docs": "সঠিক নথি জমা দিলেই দ্রুত অনুমোদন",
  "uwn-honesty": "সত্য তথ্যই দাবির সময় পরিবারের আসল সুরক্ষা",
  "uwn-fa-report": "এজেন্টই কোম্পানির প্রথম ফিল্ড আন্ডাররাইটার",
  "uwn-grid": "বয়স ও বীমাঙ্ক মিলিয়ে এক নজরে সঠিক টেস্টের তালিকা",
};

/* --------------------------------------------------------------- text utils */
function run(text, o = {}) {
  return new TextRun({
    text: String(text ?? ""),
    font: o.font || FONT,
    size: o.size ?? 19,
    bold: o.bold,
    italics: o.italics,
    color: o.color || INK,
    allCaps: o.caps,
    characterSpacing: o.spacing,
    break: o.break,
  });
}

function para(children, o = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [children],
    alignment: o.align,
    spacing: { before: o.before ?? 0, after: o.after ?? 120, line: o.line ?? 320 },
    indent: o.indent,
    border: o.border,
    shading: o.shading,
    keepNext: o.keepNext,
    pageBreakBefore: o.pageBreakBefore,
    heading: o.heading,
    bullet: o.bullet,
  });
}

const P = (text, o = {}) => para([run(text, o)], o);

function eyebrow(text, color = OLIVE_DEEP) {
  return para([run(text, { size: 14, bold: true, color, caps: true, spacing: 60 })], {
    after: 60,
  });
}

function h1(text) {
  return para([run(text, { size: 36, bold: true, color: CHARCOAL_DEEP })], {
    heading: HeadingLevel.HEADING_1,
    before: 0,
    after: 160,
    line: 360,
  });
}

function h2(text, color = CHARCOAL_DEEP) {
  return para([run(text, { size: 26, bold: true, color })], {
    heading: HeadingLevel.HEADING_2,
    before: 320,
    after: 140,
    line: 340,
  });
}

function h3(text, color = CHARCOAL_DEEP) {
  return para([run(text, { size: 21, bold: true, color })], {
    heading: HeadingLevel.HEADING_3,
    before: 220,
    after: 100,
    line: 330,
  });
}

/* -------------------------------------------------------------------- boxes */
function boxCell(children, { fill, bar, pad = 180, borders } = {}) {
  return new TableCell({
    shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
    margins: { top: pad, bottom: pad, left: pad + 60, right: pad },
    borders: borders || {
      top: NO_BORDER,
      bottom: NO_BORDER,
      right: NO_BORDER,
      left: bar
        ? { style: BorderStyle.SINGLE, size: 24, color: bar }
        : NO_BORDER,
    },
    children,
  });
}

function panel(children, opts = {}) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideHorizontal: NO_BORDER,
      insideVertical: NO_BORDER,
    },
    rows: [new TableRow({ children: [boxCell(children, opts)] })],
  });
}

function calloutBox(title, items, { accent, fill, number = true, emoji = "" } = {}) {
  const children = [
    para([run(`${emoji ? emoji + "  " : ""}${title}`, { size: 17, bold: true, color: accent })], {
      after: 120,
      line: 300,
    }),
    ...items.map((item, i) =>
      para(
        [
          run(`${number ? `${bn(i + 1)}. ` : "•  "}`, { size: 17, bold: true, color: accent }),
          run(item, { size: 18, color: INK }),
        ],
        { after: 90, line: 320 },
      ),
    ),
  ];
  return panel(children, { fill, bar: accent });
}

function storyBox(story, extended) {
  const children = [
    para([run("০১ · গল্প (Story)", { size: 18, bold: true, color: OLIVE_DEEP })], { after: 80 }),
    para([run(`চরিত্র: ${story.characters}`, { size: 16, italics: true, color: CHARCOAL_SOFT })], {
      after: 120,
    }),
  ];

  if (extended?.setting) {
    children.push(
      para(
        [
          run("দৃশ্য: ", { size: 16, bold: true, color: OLIVE_DEEP }),
          run(extended.setting, { size: 17, italics: true, color: CHARCOAL_SOFT }),
        ],
        { after: 160 },
      ),
    );
  }

  const dialogue = extended?.dialogue?.length ? extended.dialogue : story.dialogue;

  dialogue.forEach((d) => {
    const narration = d.speaker === "বর্ণনা" || d.speaker === "ফলাফল";
    if (narration) {
      children.push(
        para(
          [run(`${d.speaker}: `, { size: 17, bold: true, color: SUNSET_DEEP }), run(d.text, { size: 18 })],
          { after: 120 },
        ),
      );
    } else {
      children.push(para([run(d.speaker, { size: 16, bold: true, color: OLIVE_DEEP })], { after: 20 }));
      children.push(
        para([run(d.text, { size: 18 })], { after: 130, indent: { left: 200 } }),
      );
    }
  });

  if (extended?.aside) {
    children.push(
      para(
        [
          run("🎯 কোচিং নোট: ", { size: 16, bold: true, color: OLIVE_DEEP }),
          run(extended.aside, { size: 17, italics: true, color: OLIVE_DEEP }),
        ],
        { before: 120, after: 100 },
      ),
    );
  }

  if (extended?.aftermath) {
    children.push(
      para([run(extended.aftermath.title, { size: 17, bold: true, color: FOREST })], {
        before: 120,
        after: 60,
      }),
    );
    children.push(para([run(extended.aftermath.text, { size: 17 })], { after: 0 }));
  }

  return panel(children, { fill: SHELL, bar: OLIVE });
}

/* ---------------------------------------------------- sales playbook (chapter) */
function objectionPanel(item, index) {
  const steps = [
    ["আসল ভয়", item.realFear, CHARCOAL_SOFT],
    ["স্বীকৃতি", item.acknowledge, OLIVE_DEEP],
    ["স্পষ্টীকরণ প্রশ্ন", item.clarify, OLIVE_DEEP],
    ["উত্তর", item.respond, FOREST],
    ["প্রমাণ", item.proof, CHARCOAL],
    ["ক্লোজ", item.close, SUNSET_DEEP],
  ].filter(([, value]) => Boolean(value));

  const children = [
    para([run(`${bn(index)}.  ${item.objection}`, { size: 18, bold: true, color: CLAY })], {
      after: 120,
    }),
  ];

  steps.forEach(([label, value, color]) => {
    children.push(
      para([run(label, { size: 14, bold: true, color, caps: true, spacing: 40 })], { after: 20 }),
    );
    children.push(para([run(value, { size: 17 })], { after: 100, indent: { left: 120 } }));
  });

  return panel(children, { fill: "FFFFFF", bar: CLAY });
}

function hardQuestionPanel(q, index) {
  const children = [
    para([run(`${bn(index)}. ${q.by || "মক টেস্ট"}`, { size: 14, bold: true, color: SUNSET_DEEP, caps: true, spacing: 40 })], {
      after: 60,
    }),
    para([run(`“${q.question}”`, { size: 18, bold: true, color: CHARCOAL_DEEP })], { after: 120 }),
  ];
  if (q.trap) {
    children.push(
      para(
        [run("⚠ ফাঁদ: ", { size: 16, bold: true, color: CLAY }), run(q.trap, { size: 17, color: CHARCOAL })],
        { after: 90 },
      ),
    );
  }
  children.push(
    para(
      [run("✔ নিরাপদ উত্তর: ", { size: 16, bold: true, color: FOREST }), run(q.answer, { size: 17 })],
      { after: 90 },
    ),
  );
  if (q.data) {
    children.push(
      para([run(`📌 ${q.data}`, { size: 16, italics: true, color: CHARCOAL_SOFT })], { after: 0 }),
    );
  }
  return panel(children, { fill: CLAY_SOFT, bar: CLAY });
}

function salesPackBlock(pack) {
  if (!pack) return [];
  const out = [];

  if (pack.objections?.length) {
    out.push(h2(pack.objectionTitle || "আপত্তি মোকাবেলা প্লেবুক", CLAY));
    out.push(
      P("প্রতিটি আপত্তির পেছনে একটি অকথিত ভয় থাকে। আগে ভয়টিকে চিহ্নিত করুন, তারপর স্বীকৃতি ও প্রমাণ দিন।", {
        size: 17,
        line: 320,
      }),
    );
    pack.objections.forEach((o, i) => {
      out.push(objectionPanel(o, i + 1));
      out.push(spacer(160));
    });
  }

  if (pack.hardQuestions?.length) {
    out.push(h2("কঠিন প্রশ্নের মক টেস্ট (এই অধ্যায়)", CLAY));
    pack.hardQuestions.forEach((q, i) => {
      out.push(hardQuestionPanel(q, i + 1));
      out.push(spacer(160));
    });
  }

  if (pack.misconceptions?.length) {
    out.push(h2("ভুল ধারণা ভাঙা", CLAY));
    out.push(
      dataTable(
        ["প্রচলিত ভুল ধারণা", "সঠিক তথ্য"],
        pack.misconceptions.map((m) => [m.myth, m.truth]),
        { widths: [42, 58], fontSize: 14 },
      ),
    );
    out.push(spacer(160));
  }

  return out;
}

function quizBox(quiz, label) {
  const children = [
    para([run(`০৪ · কুইজ — নিজেকে যাচাই করুন${label ? ` (${label})` : ""}`, { size: 18, bold: true, color: PLUM })], {
      after: 120,
    }),
    para([run(quiz.question, { size: 18, bold: true, color: CHARCOAL_DEEP })], { after: 120 }),
    ...quiz.options.map((o) => {
      const correct = o.key === quiz.correct;
      return para(
        [
          run(`${o.key})  `, { size: 17, bold: true, color: correct ? FOREST : PLUM }),
          run(o.text, { size: 17, bold: correct, color: correct ? FOREST : INK }),
        ],
        { after: 60, indent: { left: 160 } },
      );
    }),
    para([run(`✔ সঠিক উত্তর: ${quiz.correct}`, { size: 17, bold: true, color: FOREST })], {
      before: 140,
      after: 60,
    }),
    para([run(quiz.explanation, { size: 17, color: "2B4A2B" })], { after: 0 }),
  ];
  return panel(children, { fill: PLUM_SOFT, bar: PLUM });
}

function goldenBox(text) {
  return panel(
    [
      para([run("★  GOLDEN RULE", { size: 13, bold: true, color: OLIVE_DEEP, caps: true, spacing: 80 })], {
        align: AlignmentType.CENTER,
        after: 100,
      }),
      para([run(text, { size: 19, bold: true, color: CHARCOAL_DEEP })], {
        align: AlignmentType.CENTER,
        after: 0,
      }),
    ],
    { fill: OLIVE_TINT, bar: OLIVE },
  );
}

function bridgeBox(text) {
  return panel(
    [
      para([run("পরবর্তী অধ্যায়", { size: 13, bold: true, color: SUNSET_DEEP, caps: true, spacing: 60 })], {
        after: 40,
      }),
      para([run(text, { size: 18 })], { after: 0 }),
    ],
    { fill: SUNSET_SOFT, bar: SUNSET },
  );
}

/* -------------------------------------------------------------------- table */
function cellPara(text, { bold = false, color = INK, size = 16, align } = {}) {
  return para([run(text, { bold, color, size })], { after: 0, line: 280, align });
}

function dataTable(headers, rows, { widths, fontSize = 15 } = {}) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, color: "auto", fill: CHARCOAL },
          margins: { top: 90, bottom: 90, left: 110, right: 110 },
          children: [cellPara(h, { bold: true, color: "FFFFFF", size: fontSize + 1 })],
        }),
    ),
  });

  const bodyRows = rows.map(
    (row, i) =>
      new TableRow({
        children: row.map(
          (c, j) =>
            new TableCell({
              shading:
                i % 2 === 1
                  ? { type: ShadingType.CLEAR, color: "auto", fill: SHELL }
                  : undefined,
              margins: { top: 80, bottom: 80, left: 110, right: 110 },
              verticalAlign: VerticalAlign.TOP,
              children: [cellPara(c, { bold: j === 0, size: fontSize })],
            }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: hairBorder("C9C5B8"),
      bottom: hairBorder("C9C5B8"),
      left: hairBorder("C9C5B8"),
      right: hairBorder("C9C5B8"),
      insideHorizontal: hairBorder("E2DED3", 2),
      insideVertical: NO_BORDER,
    },
    ...(widths
      ? { columnWidths: widths.map((w) => Math.round((CONTENT_TW * w) / 100)) }
      : {}),
    rows: [headerRow, ...bodyRows],
  });
}

/* ------------------------------------------------------------------- blocks */
function spacer(h = 120) {
  return para([run("", { size: 8 })], { after: h, line: 120 });
}

function divider() {
  return new Paragraph({
    children: [],
    spacing: { before: 160, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: OLIVE, space: 1 } },
  });
}

function sceneBlock(file, caption, { widthMm = 174, heightMm = 100 } = {}) {
  return [
    para([picture(file, widthMm, heightMm)], { after: 60, align: AlignmentType.CENTER }),
    para(
      [run(caption, { size: 15, italics: true, color: CHARCOAL_SOFT })],
      { after: 220 },
    ),
  ];
}

function chapterSection(ch) {
  const children = [
    para([run(`অধ্যায় ${ch.number} · ${ch.titleEn}`, { size: 14, bold: true, color: OLIVE_DEEP, caps: true, spacing: 40 })], {
      after: 80,
      pageBreakBefore: true,
    }),
    h1(ch.titleBn),
    para([run(ch.tagline, { size: 20, bold: true, color: SUNSET_DEEP })], { after: 220 }),
  ];

  const file = CHAPTER_IMAGE[ch.id];
  if (file) children.push(...sceneBlock(file, CAPTION[ch.id] || ""));

  children.push(P(ch.intro, { size: 19, line: 340 }), spacer(100));

  if (ch.story) {
    children.push(storyBox(ch.story, storyFor(ch.id)), spacer(180));
    children.push(P("০২ · সহজ ব্যাখ্যা (Simple Explanation)", { size: 18, bold: true, color: SUNSET_DEEP }), spacer(60));
  }

  const exp = ch.explanation || {};
  if (exp.paramTable) {
    const wide = exp.paramTable.headers.length > 2;
    children.push(
      h2(
        exp.paramTable.label ||
          (wide ? "বয়স ও বীমাঙ্ক অনুযায়ী মেডিকেল পরীক্ষা" : "প্রোডাক্টের মূল বৈশিষ্ট্যসমূহ"),
        OLIVE_DEEP,
      ),
    );
    children.push(
      dataTable(exp.paramTable.headers, exp.paramTable.rows, {
        ...(wide ? { fontSize: 13 } : { widths: [34, 66] }),
      }),
    );
    children.push(spacer(140));
  }

  [...(exp.sections || []), ...(exp.sections2 || [])].forEach((sec) => {
    if (sec.heading) children.push(h2(sec.heading));
    (sec.paragraphs || []).forEach((p) => children.push(P(p, { size: 19, line: 340 })));
    (sec.bullets || []).forEach((b) =>
      children.push(
        para([run("◆  ", { size: 15, color: OLIVE, bold: true }), run(b, { size: 18 })], {
          after: 70,
          indent: { left: 160 },
        }),
      ),
    );
    (sec.paragraphs2 || []).forEach((p) => children.push(P(p, { size: 19, line: 340 })));
    (sec.formulas || []).forEach((f) => {
      children.push(
        panel(
          [
            para([run(`🧮  ${f.label}`, { size: 17, bold: true, color: OLIVE_DEEP })], { after: 100 }),
            ...f.steps.map((s, i) =>
              para(
                [run(`${bn(i + 1)}.  `, { size: 16, bold: true, color: OLIVE_DEEP }), run(s, { size: 17 })],
                { after: 60, indent: { left: 120 } },
              ),
            ),
          ],
          { fill: OLIVE_WASH, bar: OLIVE },
        ),
      );
      children.push(spacer(140));
    });
    if (sec.note) {
      children.push(
        para([run(`📝  ${sec.note}`, { size: 16, italics: true, color: CHARCOAL_SOFT })], { after: 160 }),
      );
    }
  });

  /* Tier / charge tables get a page of their own so no row is ever split. */
  if (exp.tierTable) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(h2("SDPP টায়ার-ভিত্তিক তুলনা (পূর্ণ পৃষ্ঠা)", OLIVE_DEEP));
    children.push(
      P("নিচের টেবিলটি এক পৃষ্ঠায় সম্পূর্ণ রাখা হয়েছে — প্রশিক্ষণে হাতে ধরিয়ে দেওয়ার জন্য।", {
        size: 16,
        italics: true,
        color: CHARCOAL_SOFT,
      }),
    );
    children.push(dataTable(exp.tierTable.headers, exp.tierTable.rows, { fontSize: 15 }));
    children.push(spacer(160));
  }
  if (exp.riderTable) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(h2("শান্তা লাইফের রাইডার ম্যাট্রিক্স (পূর্ণ পৃষ্ঠা)", OLIVE_DEEP));
    children.push(dataTable(exp.riderTable.headers, exp.riderTable.rows, { fontSize: 14 }));
    children.push(spacer(160));
  }

  if (ch.redAlerts) {
    children.push(calloutBox("০৩ · রেড অ্যালার্ট (Red Alert)", ch.redAlerts, {
      accent: CLAY,
      fill: CLAY_SOFT,
      emoji: "🚨",
    }));
    children.push(spacer(180));
  }

  if (ch.quiz) {
    children.push(quizBox(ch.quiz));
    children.push(spacer(180));
  }

  if (ch.goldenRule) {
    children.push(goldenBox(ch.goldenRule));
    children.push(spacer(180));
  }

  if (ch.bridge) {
    children.push(bridgeBox(ch.bridge));
    children.push(spacer(140));
  }

  children.push(...salesPackBlock(salesPacks[ch.id]));

  return children;
}

/* ----------------------------------------------------------------- document */
const children = [];

/* ---- cover ---- */
children.push(
  para([picture("cover-bg.jpg", 174, 246)], { after: 0, align: AlignmentType.CENTER }),
  new Paragraph({ children: [new PageBreak()] }),
);

/* ---- title page ---- */
children.push(para([picture("logo-color.png", 46, 31)], { after: 40 }));
children.push(eyebrow("Field Force Training Series", OLIVE_DEEP));
children.push(spacer(200));
children.push(h1(data.meta.titleBn));
children.push(P(data.meta.subtitleBn, { size: 21, color: CHARCOAL_SOFT, line: 340 }));
children.push(divider());
children.push(P(data.meta.company, { size: 19, bold: true, color: CHARCOAL }));
children.push(spacer(200));

children.push(
  dataTable(
    ["মোট মডিউল", "মাস্টার কুইজ", "সংস্করণ", "প্রকাশকাল"],
    [[bn(data.chapters.length), bn(data.masterAssessment.questions.length), "১.০", "২০২৬"]],
    { fontSize: 17 },
  ),
);
children.push(spacer(260));

children.push(
  panel(
    [
      para([run("প্রকাশনা তথ্য", { size: 17, bold: true, color: OLIVE_DEEP })], { after: 100 }),
      P("প্রস্তুতকৃত: লার্নিং অ্যান্ড ডেভেলপমেন্ট বিভাগ, শান্তা লাইফ ইনস্যুরেন্স পিএলসি।", { size: 16, line: 300 }),
      P("ব্র্যান্ড রেফারেন্স: Shanta Life Brand Guidelines।", { size: 16, line: 300 }),
      P("ব্যবহার: অভ্যন্তরীণ প্রশিক্ষণ সামগ্রী — কেবল প্রাতিষ্ঠানিক ব্যবহারের জন্য।", { size: 16, line: 300 }),
      P("সতর্কতা: প্রোডাক্টের শর্তাবলি ও প্রিমিয়াম হারের চূড়ান্ত সূত্র অনুমোদিত প্রোডাক্ট ফাইল।", {
        size: 16,
        line: 300,
        after: 0,
      }),
    ],
    { fill: OLIVE_WASH, bar: OLIVE },
  ),
);

/* ---- table of contents (field-based: Word fills it on open) ---- */
children.push(
  para([run("Contents", { size: 14, bold: true, color: OLIVE_DEEP, caps: true, spacing: 40 })], {
    pageBreakBefore: true,
    after: 80,
  }),
);
children.push(h1("সূচিপত্র"));
children.push(
  P("এই সূচিপত্র স্বয়ংক্রিয় (automatic) — Word খোলার সময় সব শিরোনাম ও পৃষ্ঠা নম্বর নিজেই তৈরি হয়ে যাবে। মাইক্রোসফট ওয়ার্ডে Ctrl+A চেপে F9 দিলে সূচি হালনাগাদ হবে।", {
    size: 16,
    italics: true,
    color: CHARCOAL_SOFT,
  }),
);
children.push(spacer(120));
children.push(
  new TableOfContents("সূচিপত্র", {
    hyperlink: true,
    headingStyleRange: "1-2",
  }),
);

/* ---- introduction ---- */
children.push(
  para([run("Introduction · Learning Framework", { size: 14, bold: true, color: OLIVE_DEEP, caps: true, spacing: 40 })], {
    pageBreakBefore: true,
    after: 80,
  }),
);
children.push(h1(data.introduction.heading));
children.push(...sceneBlock("scene-intro.jpg", "মাঠ পর্যায়ের প্রশিক্ষণই তৈরি করে আত্মবিশ্বাসী কনসালট্যান্ট"));
data.introduction.paragraphs.forEach((p) => children.push(P(p, { size: 19, line: 340 })));
children.push(h2("পাঁচ ধাপের শেখার কাঠামো"));
children.push(
  dataTable(
    ["ধাপ", "ফ্রেমওয়ার্ক", "বিবরণ"],
    data.framework.map((f, i) => [bn(i + 1), f.titleBn, f.desc]),
    { widths: [8, 24, 68], fontSize: 15 },
  ),
);
children.push(spacer(160));
children.push(P(data.introduction.frameworkIntro, { size: 19, line: 340 }));
children.push(P(data.introduction.closing, { size: 19, line: 340 }));

/* ---- chapters ---- */
data.chapters.forEach((ch) => children.push(...chapterSection(ch)));

/* ---- appendix · need-based selling ---- */
children.push(
  para([run("Appendix A · Sales Mastery", { size: 14, bold: true, color: OLIVE_DEEP, caps: true, spacing: 40 })], {
    pageBreakBefore: true,
    after: 80,
  }),
);
children.push(h1(mastery.needBased.heading));
children.push(para([run(mastery.needBased.tagline, { size: 20, bold: true, color: SUNSET_DEEP })], { after: 200 }));
children.push(P(mastery.needBased.intro, { size: 18, line: 340 }));
children.push(spacer(120));
mastery.needBased.steps.forEach((step) => {
  children.push(
    panel(
      [
        para([run(`${step.step} · ${step.title}`, { size: 18, bold: true, color: OLIVE_DEEP })], { after: 80 }),
        para([run(step.text, { size: 17 })], { after: 90 }),
        para([run(`“${step.script}”`, { size: 17, italics: true, color: SUNSET_DEEP })], { after: 0 }),
      ],
      { fill: "FFFFFF", bar: OLIVE },
    ),
  );
  children.push(spacer(140));
});
children.push(h2("প্রশ্ন-ব্যাংক: যা জিজ্ঞেস করলেই গ্রাহক খুলে যান"));
children.push(
  dataTable(
    ["বিষয়", "প্রশ্ন"],
    mastery.needBased.questions.map((q) => [q.group, q.question]),
    { widths: [22, 78], fontSize: 14 },
  ),
);

/* ---- appendix · objection method ---- */
children.push(
  para([run("Appendix B · Objection Handling", { size: 14, bold: true, color: OLIVE_DEEP, caps: true, spacing: 40 })], {
    pageBreakBefore: true,
    after: 80,
  }),
);
children.push(h1(mastery.objectionMethod.heading));
children.push(para([run(mastery.objectionMethod.tagline, { size: 20, bold: true, color: SUNSET_DEEP })], { after: 200 }));
children.push(P(mastery.objectionMethod.intro, { size: 18, line: 340 }));
children.push(spacer(120));
mastery.objectionMethod.steps.forEach((step) => {
  children.push(
    panel(
      [
        para([run(`${step.key} · ${step.title}`, { size: 18, bold: true, color: CHARCOAL_DEEP })], { after: 70 }),
        para([run(step.text, { size: 17 })], { after: 80 }),
        para([run(`“${step.script}”`, { size: 17, italics: true, color: SUNSET_DEEP })], { after: 0 }),
      ],
      { fill: SHELL, bar: SUNSET },
    ),
  );
  children.push(spacer(120));
});
children.push(
  calloutBox("পাঁচটি অলঙ্ঘনীয় নিয়ম", mastery.objectionMethod.rules, {
    accent: CLAY,
    fill: CLAY_SOFT,
    emoji: "🚨",
  }),
);

/* ---- appendix · hard question bank ---- */
children.push(
  para([run("Appendix C · Mock Test Bank", { size: 14, bold: true, color: OLIVE_DEEP, caps: true, spacing: 40 })], {
    pageBreakBefore: true,
    after: 80,
  }),
);
children.push(h1(mastery.mockTest.heading));
children.push(para([run(mastery.mockTest.tagline, { size: 20, bold: true, color: SUNSET_DEEP })], { after: 200 }));
children.push(P(mastery.mockTest.intro, { size: 18, line: 340 }));
children.push(spacer(120));
children.push(
  dataTable(
    ["স্তর", "ধরন", "বিবরণ"],
    mastery.mockTest.levels.map((l) => [l.level, l.title, l.text]),
    { widths: [15, 30, 55], fontSize: 14 },
  ),
);
children.push(spacer(180));
mastery.mockTest.questions.forEach((q, i) => {
  children.push(hardQuestionPanel({ ...q, by: `${q.level} · ${q.by}` }, i + 1));
  children.push(spacer(150));
});

/* ---- appendix · no-need ethics ---- */
children.push(
  para([run("Appendix D · No-Need Ethics", { size: 14, bold: true, color: OLIVE_DEEP, caps: true, spacing: 40 })], {
    pageBreakBefore: true,
    after: 80,
  }),
);
children.push(h1(mastery.noNeed.heading));
children.push(para([run(mastery.noNeed.tagline, { size: 20, bold: true, color: SUNSET_DEEP })], { after: 200 }));
children.push(P(mastery.noNeed.intro, { size: 18, line: 340 }));
children.push(spacer(120));
mastery.noNeed.steps.forEach((step) => {
  children.push(
    panel(
      [
        para([run(`${step.step} · ${step.title}`, { size: 18, bold: true, color: FOREST })], { after: 80 }),
        para([run(step.text, { size: 17 })], { after: 90 }),
        para([run(`“${step.script}”`, { size: 17, italics: true, color: FOREST })], { after: 0 }),
      ],
      { fill: FOREST_SOFT, bar: FOREST },
    ),
  );
  children.push(spacer(140));
});
children.push(h2("আগের ভুল ধারণা পরিষ্কার করা"));
children.push(
  dataTable(
    ["যা মানুষ ভাবেন", "আসলে কী"],
    mastery.noNeed.misbeliefs.map((m) => [m.myth, m.truth]),
    { widths: [40, 60], fontSize: 14 },
  ),
);
children.push(spacer(160));
children.push(
  calloutBox(mastery.noNeed.closing.title, mastery.noNeed.closing.lines, {
    accent: OLIVE_DEEP,
    fill: OLIVE_TINT,
    number: false,
    emoji: "★",
  }),
);

/* ---- quick reference ---- */
children.push(
  para([run("Appendix E · Quick Reference", { size: 14, bold: true, color: OLIVE_DEEP, caps: true, spacing: 40 })], {
    pageBreakBefore: true,
    after: 80,
  }),
);
children.push(h1(data.quickReference.heading));
children.push(
  P("ফিল্ডে দ্রুত উত্তর দেওয়ার জন্য এক পাতার সারসংক্ষেপ। যেকোনো চূড়ান্ত সিদ্ধান্তের আগে অনুমোদিত প্রোডাক্ট ফাইল ও আন্ডাররাইটিং ম্যানুয়াল যাচাই করুন।", {
    size: 18,
    line: 330,
  }),
);
children.push(divider());
children.push(
  dataTable(data.quickReference.headers, data.quickReference.rows, {
    widths: [18, 13, 13, 16, 18, 12, 10],
    fontSize: 12,
  }),
);

/* ---- master assessment ---- */
children.push(
  para([run("Appendix F · Master Assessment", { size: 14, bold: true, color: OLIVE_DEEP, caps: true, spacing: 40 })], {
    pageBreakBefore: true,
    after: 80,
  }),
);
children.push(h1(data.masterAssessment.heading));
children.push(P(data.masterAssessment.intro, { size: 18, line: 330 }));
children.push(spacer(120));
data.masterAssessment.questions.forEach((q, i) => {
  children.push(quizBox(q, `${bn(i + 1)} · ${q.product}`));
  children.push(spacer(160));
});

/* ---- ethics ---- */
children.push(
  para([run("Appendix G · Field Ethics", { size: 14, bold: true, color: OLIVE_DEEP, caps: true, spacing: 40 })], {
    pageBreakBefore: true,
    after: 80,
  }),
);
children.push(h1(data.ethicsChecklist.heading));
children.push(P(data.ethicsChecklist.intro, { size: 18, line: 330 }));
children.push(spacer(120));
children.push(
  panel(
    data.ethicsChecklist.items.map((item, i) =>
      para(
        [
          run("☐  ", { size: 20, color: OLIVE_DEEP, bold: true }),
          run(item, { size: 18 }),
          run(`   ${String(i + 1).padStart(2, "0")}`, { size: 14, color: CHARCOAL_SOFT }),
        ],
        { after: 120, line: 320 },
      ),
    ),
    { fill: SHELL, bar: OLIVE },
  ),
);

/* ---- closing ---- */
children.push(
  para([run("Closing Note", { size: 14, bold: true, color: OLIVE_DEEP, caps: true, spacing: 40 })], {
    pageBreakBefore: true,
    after: 80,
  }),
);
children.push(h1(data.closing.heading));
children.push(...sceneBlock("scene-scep.jpg", "আজকের সঠিক পরামর্শই আগামীর নিশ্চিত ভবিষ্যৎ"));
data.closing.paragraphs.forEach((p) => children.push(P(p, { size: 19, line: 340 })));
children.push(spacer(140));
children.push(
  panel(
    [
      para([run("শান্তা লাইফে আমরা বিশ্বাস করি — সঠিক পরামর্শই সবচেয়ে বড় সুরক্ষা।", {
        size: 21,
        bold: true,
        color: "FFFFFF",
      })], { align: AlignmentType.CENTER, after: 80 }),
      para([run("SHANTA LIFE INSURANCE PLC", { size: 12, color: "C8C8C4", caps: true, spacing: 80 })], {
        align: AlignmentType.CENTER,
        after: 0,
      }),
    ],
    { fill: CHARCOAL_DEEP },
  ),
);
children.push(spacer(200));
children.push(goldenBox("গ্রাহকের চাহিদা শুনুন, সৎভাবে সমাধান দিন, একচ্যুয়ারিয়াল নিয়ম মেনে চলুন — এটাই শান্তা লাইফের ফিল্ড সাফল্যের চিরন্তন সূত্র!"));

/* ---- credits ---- */
children.push(h2("ভিজ্যুয়াল, ব্র্যান্ড ও তথ্যসূত্র"));
[
  "লোগো: শান্তা লাইফ ইনস্যুরেন্স পিএলসি-র অনুমোদিত ব্র্যান্ড অ্যাসেট (কালার ও হোয়াইট ভার্সন)।",
  "রঙ ও লোগো ব্যবহার: Shanta Life Brand Guidelines — Charcoal Grey #3C3C3B, Olive Green #978C21, Sunset Orange #F37021।",
  "দৃশ্য-ইলাস্ট্রেশন: প্রতিটি অধ্যায়ের গল্পের সঙ্গে মিল রেখে ব্র্যান্ড প্যালেটে নির্মিত মৌলিক দৃশ্য।",
  "ফিল্ড ফটো: শান্তা লাইফের অভ্যন্তরীণ প্রশিক্ষণ আর্কাইভ।",
].forEach((line) =>
  children.push(
    para([run("◆  ", { size: 15, color: OLIVE, bold: true }), run(line, { size: 16, color: CHARCOAL_SOFT })], {
      after: 80,
      indent: { left: 160 },
    }),
  ),
);
children.push(divider());
children.push(
  para([run(`${data.meta.footer} · ${data.meta.company}`, { size: 14, color: CHARCOAL_SOFT })], {
    align: AlignmentType.CENTER,
    after: 0,
  }),
);

/* ----------------------------------------------------------------- document */
const doc = new Document({
  creator: "Shanta Life Insurance PLC — Learning & Development",
  title: data.meta.titleBn,
  subject: "ফিল্ড ফোর্স প্রশিক্ষণ ই-বুক",
  description: "গল্পে গল্পে শিখি — শান্তা লাইফের বিমা প্রোডাক্ট",
  features: {
    updateFields: true,
  },
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 19, color: INK },
        paragraph: { spacing: { line: 320, after: 120 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_TW, height: convertMillimetersToTwip(297) },
          margin: {
            top: MARGIN,
            right: MARGIN,
            bottom: MARGIN,
            left: MARGIN,
            header: convertMillimetersToTwip(10),
            footer: convertMillimetersToTwip(10),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                run("গল্পে গল্পে শিখি · শান্তা লাইফ ইনস্যুরেন্স পিএলসি", { size: 12, color: CHARCOAL_SOFT }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D8D5CC", space: 4 } },
              alignment: AlignmentType.LEFT,
              spacing: { after: 0 },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                run("SHANTA LIFE INSURANCE PLC", { size: 12, color: CHARCOAL_SOFT, caps: true, spacing: 40 }),
                new TextRun({ text: "   ·   ", font: FONT, size: 12, color: "C8C8C4" }),
                new TextRun({ children: ["পৃষ্ঠা ", PageNumber.CURRENT], font: FONT, size: 12, color: CHARCOAL_SOFT }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { before: 60, after: 0 },
            }),
          ],
        }),
      },
      children,
    },
  ],
});

const out = path.join(root, "public/shanta-life-ebook.docx");
await Packer.toBuffer(doc).then((buffer) => fs.writeFileSync(out, buffer));
console.log(`✓ DOCX written to public/shanta-life-ebook.docx (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
