import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  BorderStyle,
  AlignmentType,
  PageBreak,
  LevelFormat,
  convertInchesToTwip,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "src/data/ebookContent.json"), "utf-8"));

const FONT = "Nirmala UI";
const COLOR_PRIMARY = "0F766E"; // emerald-700
const COLOR_DARK = "1E293B";
const COLOR_AMBER = "92400E";
const COLOR_SKY = "075985";
const COLOR_ROSE = "9F1239";
const COLOR_VIOLET = "5B21B6";

function p(text, opts = {}) {
  const { bold, italics, size, color, alignment, spacingBefore = 0, spacingAfter = 160, heading } = opts;
  return new Paragraph({
    heading,
    alignment,
    spacing: { before: spacingBefore, after: spacingAfter },
    children: [
      new TextRun({
        text,
        bold,
        italics,
        size,
        color,
        font: FONT,
      }),
    ],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { color: COLOR_PRIMARY, space: 4, style: BorderStyle.SINGLE, size: 10 } },
    children: [new TextRun({ text, bold: true, size: 36, color: COLOR_PRIMARY, font: FONT })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: COLOR_DARK, font: FONT })],
  });
}

function heading3(text, color = COLOR_DARK) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color, font: FONT })],
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text, font: FONT, size: opts.size || 22, color: opts.color })],
  });
}

function numbered(text, refNum) {
  return new Paragraph({
    numbering: { reference: refNum, level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}

function cell(text, { header = false, width, shade } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: header
      ? { type: ShadingType.SOLID, color: COLOR_DARK }
      : shade
        ? { type: ShadingType.SOLID, color: shade }
        : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: header,
            color: header ? "FFFFFF" : COLOR_DARK,
            font: FONT,
            size: 20,
          }),
        ],
      }),
    ],
  });
}

function dataTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
    },
    rows: [
      new TableRow({ children: headers.map((h) => cell(h, { header: true })), tableHeader: true }),
      ...rows.map(
        (row, i) =>
          new TableRow({
            children: row.map((c) => cell(c, { shade: i % 2 === 1 ? "F1F5F9" : undefined })),
          })
      ),
    ],
  });
}

function calloutBox(label, lines, { bg = "EEF2FF", borderColor = "6366F1" } = {}) {
  const cells = [
    new TableCell({
      shading: { type: ShadingType.SOLID, color: bg },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
        left: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
        right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
      },
      margins: { top: 150, bottom: 150, left: 200, right: 200 },
      children: [
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "🧮 " + label, bold: true, font: FONT, size: 22, color: COLOR_DARK })],
        }),
        ...lines.map(
          (l, i) =>
            new Paragraph({
              spacing: { after: 60 },
              children: [new TextRun({ text: `${i + 1}. ${l}`, font: FONT, size: 20, color: COLOR_DARK })],
            })
        ),
      ],
    }),
  ];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: cells })],
  });
}

function storyBox(characters, dialogue) {
  const paras = [
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: "চরিত্র: " + characters, italics: true, font: FONT, size: 20, color: COLOR_AMBER })],
    }),
  ];
  dialogue.forEach((d) => {
    paras.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [new TextRun({ text: d.speaker + ":", bold: true, font: FONT, size: 21, color: COLOR_AMBER })],
      })
    );
    paras.push(
      new Paragraph({
        spacing: { after: 80 },
        indent: { left: convertInchesToTwip(0.2) },
        children: [new TextRun({ text: d.text, font: FONT, size: 21, color: COLOR_DARK })],
      })
    );
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "FEF3C7" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "F59E0B" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "F59E0B" },
              left: { style: BorderStyle.SINGLE, size: 12, color: "F59E0B" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "F59E0B" },
            },
            margins: { top: 150, bottom: 150, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 120 },
                children: [new TextRun({ text: "📖 গল্প (Story)", bold: true, font: FONT, size: 24, color: COLOR_AMBER })],
              }),
              ...paras,
            ],
          }),
        ],
      }),
    ],
  });
}

function redAlertBox(items) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "FFE4E6" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "E11D48" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "E11D48" },
              left: { style: BorderStyle.SINGLE, size: 12, color: "E11D48" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "E11D48" },
            },
            margins: { top: 150, bottom: 150, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 120 },
                children: [new TextRun({ text: "🚨 রেড অ্যালার্ট (Red Alert)", bold: true, font: FONT, size: 24, color: COLOR_ROSE })],
              }),
              ...items.map(
                (it) =>
                  new Paragraph({
                    spacing: { after: 100 },
                    children: [new TextRun({ text: "❌ " + it, font: FONT, size: 21, color: "881337" })],
                  })
              ),
            ],
          }),
        ],
      }),
    ],
  });
}

function quizBox(question, options, correct, explanation, indexLabel) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "EDE9FE" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "7C3AED" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "7C3AED" },
              left: { style: BorderStyle.SINGLE, size: 12, color: "7C3AED" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "7C3AED" },
            },
            margins: { top: 150, bottom: 150, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `🧠 কুইজ / নিজেকে যাচাই করুন${indexLabel ? " — " + indexLabel : ""}`,
                    bold: true,
                    font: FONT,
                    size: 24,
                    color: COLOR_VIOLET,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 120 },
                children: [new TextRun({ text: question, bold: true, font: FONT, size: 21, color: COLOR_DARK })],
              }),
              ...options.map(
                (o) =>
                  new Paragraph({
                    spacing: { after: 70 },
                    indent: { left: convertInchesToTwip(0.2) },
                    children: [
                      new TextRun({
                        text: `${o.key}) ${o.text}`,
                        font: FONT,
                        size: 20,
                        bold: o.key === correct,
                        color: o.key === correct ? "15803D" : COLOR_DARK,
                      }),
                    ],
                  })
              ),
              new Paragraph({
                spacing: { before: 100, after: 60 },
                children: [new TextRun({ text: `✅ সঠিক উত্তর: ${correct}`, bold: true, font: FONT, size: 21, color: "15803D" })],
              }),
              new Paragraph({
                children: [new TextRun({ text: explanation, font: FONT, size: 20, color: "166534" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function goldenRuleBox(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "FDE68A" },
            margins: { top: 200, bottom: 200, left: 300, right: 300 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [new TextRun({ text: "⭐ গোল্ডেন রুল", bold: true, font: FONT, size: 22, color: COLOR_AMBER })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text, bold: true, font: FONT, size: 24, color: "78350F" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function bridgeBox(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "D1FAE5" },
            borders: { left: { style: BorderStyle.SINGLE, size: 16, color: "059669" } },
            margins: { top: 150, bottom: 150, left: 200, right: 200 },
            children: [new Paragraph({ children: [new TextRun({ text: "➡️ " + text, font: FONT, size: 21, color: "065F46" })] })],
          }),
        ],
      }),
    ],
  });
}

function spacer(h = 160) {
  return new Paragraph({ spacing: { after: h }, children: [] });
}

// ---------- Build document body ----------
const children = [];

// Title Page
children.push(
  new Paragraph({ spacing: { before: 1600 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: data.meta.company, font: FONT, size: 24, color: COLOR_PRIMARY, bold: true })],
  }),
  new Paragraph({ spacing: { before: 300 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "🛡️", size: 72 })] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 300, after: 200 },
    children: [new TextRun({ text: data.meta.titleBn, bold: true, size: 56, color: COLOR_DARK, font: FONT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 800 },
    children: [new TextRun({ text: data.meta.subtitleBn, size: 26, color: COLOR_SKY, font: FONT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: data.meta.footer, italics: true, size: 20, color: "64748B", font: FONT })],
  }),
  new Paragraph({ children: [new PageBreak()] })
);

// Introduction
children.push(heading1("১. " + data.introduction.heading));
data.introduction.paragraphs.forEach((para) => children.push(p(para, { size: 22 })));
children.push(spacer());
children.push(heading2(data.introduction.frameworkIntro));
data.framework.forEach((f) => {
  children.push(heading3(f.emoji + " " + f.titleBn, COLOR_PRIMARY));
  children.push(p(f.desc, { size: 21 }));
});
children.push(spacer());
children.push(p(data.introduction.closing, { italics: true, size: 21, color: COLOR_SKY }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// Chapters
data.chapters.forEach((chapter) => {
  children.push(heading1(`${chapter.number}. ${chapter.titleBn} (${chapter.titleEn})`));
  children.push(p(chapter.tagline, { bold: true, color: COLOR_PRIMARY, size: 24 }));
  children.push(p(chapter.intro, { size: 22 }));
  children.push(spacer());

  if (chapter.story) {
    children.push(storyBox(chapter.story.characters, chapter.story.dialogue));
    children.push(spacer());
  }

  // Explanation
  children.push(heading2("💡 সহজ ব্যাখ্যা (Simple Explanation)"));
  const exp = chapter.explanation || {};
  if (exp.paramTable) {
    children.push(heading3("প্রোডাক্টের মূল বৈশিষ্ট্যসমূহ"));
    children.push(dataTable(exp.paramTable.headers, exp.paramTable.rows));
    children.push(spacer());
  }
  const allSections = [...(exp.sections || []), ...(exp.sections2 || [])];
  allSections.forEach((s) => {
    if (s.heading) children.push(heading3(s.heading));
    (s.paragraphs || []).forEach((para) => children.push(p(para, { size: 21 })));
    if (s.bullets) {
      s.bullets.forEach((b) => children.push(bullet(b)));
    }
    (s.paragraphs2 || []).forEach((para) => children.push(p(para, { size: 21 })));
    if (s.formulas) {
      s.formulas.forEach((f) => {
        children.push(calloutBox(f.label, f.steps));
        children.push(spacer(120));
      });
    }
    if (s.note) children.push(p("📝 " + s.note, { italics: true, size: 20, color: "475569" }));
    children.push(spacer(120));
  });
  if (exp.tierTable) {
    children.push(heading3("SDPP ৩-টায়ার আর্কিটেকচার"));
    children.push(dataTable(exp.tierTable.headers, exp.tierTable.rows));
    children.push(spacer());
  }
  if (exp.riderTable) {
    children.push(heading3("শান্তা লাইফের রাইডার ম্যাট্রিক্স"));
    children.push(dataTable(exp.riderTable.headers, exp.riderTable.rows));
    children.push(spacer());
  }

  // Red Alerts
  if (chapter.redAlerts) {
    children.push(redAlertBox(chapter.redAlerts));
    children.push(spacer());
  }

  // Quiz
  if (chapter.quiz) {
    children.push(quizBox(chapter.quiz.question, chapter.quiz.options, chapter.quiz.correct, chapter.quiz.explanation));
    children.push(spacer());
  }

  // Golden Rule
  if (chapter.goldenRule) {
    children.push(goldenRuleBox(chapter.goldenRule));
    children.push(spacer());
  }

  // Bridge
  if (chapter.bridge) {
    children.push(bridgeBox(chapter.bridge));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));
});

// Quick reference
children.push(heading1("পরিশিষ্ট: " + data.quickReference.heading));
children.push(dataTable(data.quickReference.headers, data.quickReference.rows));
children.push(new Paragraph({ children: [new PageBreak()] }));

// Master Assessment
children.push(heading1("৮. " + data.masterAssessment.heading));
children.push(p(data.masterAssessment.intro, { size: 22 }));
children.push(spacer());
data.masterAssessment.questions.forEach((q, i) => {
  children.push(quizBox(q.question, q.options, q.correct, q.explanation, `প্রশ্ন ${i + 1} (${q.product})`));
  children.push(spacer());
});

// Ethics checklist
children.push(heading2(data.ethicsChecklist.heading));
children.push(p(data.ethicsChecklist.intro, { size: 22 }));
data.ethicsChecklist.items.forEach((item) => children.push(bullet("✅ " + item, { size: 21 })));
children.push(new Paragraph({ children: [new PageBreak()] }));

// Closing
children.push(heading1(data.closing.heading));
data.closing.paragraphs.forEach((para) => children.push(p(para, { size: 22 })));
children.push(spacer());
children.push(
  goldenRuleBox(
    "গ্রাহকের চাহিদা শুনুন, সৎভাবে সমাধান দিন, একচ্যুয়ারিয়াল নিয়ম মেনে চলুন — এটাই শান্তা লাইফের ফিল্ড সাফল্যের চিরন্তন সূত্র!"
  )
);

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 22 },
      },
    },
  },
  numbering: {
    config: [
      {
        reference: "default-numbering",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START }],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.8),
            bottom: convertInchesToTwip(0.8),
            left: convertInchesToTwip(0.9),
            right: convertInchesToTwip(0.9),
          },
        },
      },
      children,
    },
  ],
});

const outPath = path.join(root, "public", "shanta-life-ebook.docx");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log("DOCX generated at", outPath, (buffer.length / 1024).toFixed(1), "KB");
