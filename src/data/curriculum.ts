/**
 * Single source of truth for the learning path and the built-in quiz bank.
 *
 * The e-book JSON already holds one review question per chapter plus the
 * master assessment; instead of duplicating that content by hand we derive
 * the quiz bank from it, so any future chapter edit automatically lands in
 * both the reader and the assessments.
 */

import ebookRaw from "@/data/ebookContent.json";
import questionBankRaw from "@/data/questionBank.json";
import { chapterVisuals } from "@/data/visuals";
import type { LearningModule, Part, Question, Quiz } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const ebook = ebookRaw as any;

export const PARTS: { id: Part; label: string; title: string; blurb: string; accent: string }[] = [
  {
    id: "foundation",
    label: "Foundation",
    title: "ভিত্তি ও শেখার কাঠামো",
    blurb: "বইটি কীভাবে পড়বেন, প্রতিটি অধ্যায়ের গঠন এবং ফিল্ডে তার ব্যবহার।",
    accent: "steel",
  },
  {
    id: "products",
    label: "Part I",
    title: "প্রোডাক্ট মাস্টারি",
    blurb: "৬টি প্রোডাক্টের যোগ্যতা, সুবিধা, সীমাবদ্ধতা ও সঠিক গ্রাহক — মুখস্থ নয়, বোঝার জন্য।",
    accent: "olive",
  },
  {
    id: "underwriting",
    label: "Part II",
    title: "আন্ডাররাইটিং",
    blurb: "নথি, সততা, FA রিপোর্ট ও মেডিকেল গ্রিড — প্রপোজাল থেকে ইস্যু পর্যন্ত পুরো যাত্রা।",
    accent: "sunset",
  },
  {
    id: "mastery",
    label: "Mastery",
    title: "সেলস ও এথিক্স প্লেবুক",
    blurb: "নিড-বেজড বিক্রয়, আপত্তি মোকাবেলা, কঠিন মক টেস্ট ও নৈতিক সীমানা।",
    accent: "plum",
  },
];

/** Reading time is estimated at ~145 Bengali words per minute. */
function readingMinutes(text: unknown): number {
  const words = JSON.stringify(text ?? "").replace(/[{}[\]",:]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.round(words / 145));
}

const chapterModules: LearningModule[] = (ebook.chapters ?? []).map((c: any, i: number) => ({
  id: c.id,
  number: c.number,
  title: c.titleBn,
  titleEn: c.titleEn,
  tagline: c.tagline,
  part: (i < 6 ? "products" : "underwriting") as Part,
  minutes: readingMinutes([c.intro, c.story, c.explanation, c.redAlerts, c.goldenRule]),
  image: chapterVisuals[c.id]?.src,
  quizId: `check-${c.id}`,
}));

export const MODULES: LearningModule[] = [
  {
    id: "introduction",
    number: "০১",
    title: ebook.introduction?.heading ?? "ভূমিকা",
    titleEn: "Introduction & Learning Framework",
    tagline: "কেন এই বই, কীভাবে পড়বেন এবং প্রতিটি অধ্যায়ের গঠন।",
    part: "foundation",
    minutes: 6,
    image: "/assets/img/scene-intro.jpg",
  },
  ...chapterModules,
  {
    id: "mastery-playbook",
    number: "১৩",
    title: "সেলস মাস্টারি প্লেবুক",
    titleEn: "Sales Mastery Playbook",
    tagline: "নিড-বেজড বিক্রয়, আপত্তির ৭ ধাপ, কঠিন মক প্রশ্ন ও নো-নিড এথিক্স।",
    part: "mastery",
    minutes: 22,
    image: "/assets/img/sli-family-photo.jpg",
  },
];

export const moduleById = (id: string): LearningModule | undefined =>
  MODULES.find((m) => m.id === id);

export const chapterJson = (id: string): any | undefined =>
  (ebook.chapters ?? []).find((c: any) => c.id === id);

export const TOTAL_MINUTES = MODULES.reduce((sum, m) => sum + m.minutes, 0);

export const bookMeta = {
  title: ebook.meta?.titleBn as string,
  subtitle: ebook.meta?.subtitleBn as string,
  company: ebook.meta?.company as string,
  footer: ebook.meta?.footer as string,
};

/* ------------------------------------------------------------------ */
/* Quiz bank — derived from the book                                   */
/* ------------------------------------------------------------------ */

const keyToIndex = (key: string, options: any[]): number => {
  const idx = (options ?? []).findIndex((o) => String(o?.key ?? "").trim() === String(key).trim());
  return idx >= 0 ? idx : 0;
};

function chapterQuestion(c: any): Question {
  const options = (c.quiz?.options ?? []).map((o: any) => `${o.text}`);
  return {
    id: `${c.id}-q`,
    prompt: c.quiz.question,
    options,
    correct: keyToIndex(c.quiz.correct, c.quiz.options),
    explanation: c.quiz.explanation,
    type: "MCQ",
  };
}

function masterQuestions(): Question[] {
  return (ebook.masterAssessment?.questions ?? []).map((q: any, i: number) => ({
    id: `master-q${i + 1}`,
    prompt: q.question,
    options: (q.options ?? []).map((o: any) => `${o.text}`),
    correct: keyToIndex(q.correct, q.options),
    explanation: q.explanation,
    type: "MCQ",
  }));
}

/** Removes near-duplicate prompts so an aggregated set never repeats a question. */
function dedupe(questions: Question[]): Question[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    const key = q.prompt
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function quickCheck(c: any): Quiz {
  return {
    id: `check-${c.id}`,
    title: `${c.titleBn} — দ্রুত যাচাই`,
    product: c.titleBn,
    set: `অধ্যায় ${c.number}`,
    kind: "quiz",
    passMark: 60,
    questions: [chapterQuestion(c)],
    origin: "builtin",
  };
}

const chapters: any[] = ebook.chapters ?? [];
const productChapters = chapters.slice(0, 6);
const uwChapters = chapters.slice(6);

/* ------------------------------------------------------------------ */
/* Product question bank — ported from the legacy quiz portal          */
/* ------------------------------------------------------------------ */

type BankQuestion = {
  id: string;
  productId: string;
  productTitle: string;
  set: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation?: string;
  difficulty?: string;
};

const bankQuestions = (questionBankRaw as { questions: BankQuestion[] }).questions ?? [];

function bankQuizFor(productId: string, productTitle: string): Quiz | null {
  const questions = bankQuestions.filter((q) => q.productId === productId);
  if (!questions.length) return null;
  return {
    id: `bank-${productId}`,
    title: `${productTitle} — প্রশ্ন ব্যাংক`,
    product: productTitle,
    set: "প্রশ্ন ব্যাংক",
    kind: "quiz",
    passMark: 70,
    questions: questions.map((q) => ({
      id: `bank-${q.id}`,
      prompt: q.prompt,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
      type: "MCQ",
    })),
    origin: "builtin",
  };
}

const BANK_PRODUCTS: [string, string][] = [
  ["endowment", "শান্তা এন্ডোমেন্ট"],
  ["s4pp", "শান্তা ফোর পেমেন্ট প্ল্যান"],
  ["scep", "শান্তা চাইল্ড এডুকেশন প্ল্যান"],
  ["sspe", "শান্তা সিঙ্গেল প্রিমিয়াম এন্ডোমেন্ট"],
  ["sdpp", "শান্তা ডিপোজিটর্স প্রোটেকশন প্ল্যান"],
];

export const BANK_QUIZZES: Quiz[] = BANK_PRODUCTS.map(([id, title]) => bankQuizFor(id, title)).filter(
  (q): q is Quiz => Boolean(q),
);

export const BUILTIN_QUIZZES: Quiz[] = [
  ...chapters.map(quickCheck),
  ...BANK_QUIZZES,
  {
    id: "set-products",
    title: "প্রোডাক্ট মাস্টারি — সেট ১",
    product: "Part I · প্রোডাক্ট",
    set: "Part I",
    kind: "quiz",
    passMark: 70,
    questions: dedupe(productChapters.map(chapterQuestion)),
    origin: "builtin",
  },
  {
    id: "set-underwriting",
    title: "আন্ডাররাইটিং — সেট ২",
    product: "Part II · আন্ডাররাইটিং",
    set: "Part II",
    kind: "quiz",
    passMark: 70,
    questions: dedupe(uwChapters.map(chapterQuestion)),
    origin: "builtin",
  },
  {
    id: "set-final",
    title: "ফাইনাল সার্টিফিকেশন টেস্ট",
    product: "সম্পূর্ণ সিলেবাস",
    set: "Final",
    kind: "quiz",
    passMark: 75,
    questions: dedupe([...chapters.map(chapterQuestion), ...masterQuestions()]),
    origin: "builtin",
  },
];

export const quizById = (id: string, extra: Quiz[] = []): Quiz | undefined =>
  [...extra, ...BUILTIN_QUIZZES].find((q) => q.id === id);

export const TOTAL_QUESTIONS = BUILTIN_QUIZZES.filter((q) => q.id.startsWith("set-")).reduce(
  (sum, q) => sum + q.questions.length,
  0,
);

/** Distinct questions a learner can practise (same prompt counts once). */
export const QUESTION_POOL = (() => {
  const seen = new Set<string>();
  BUILTIN_QUIZZES.forEach((quiz) =>
    quiz.questions.forEach((q) => {
      seen.add(
        q.prompt
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, " ")
          .replace(/\s+/g, " ")
          .trim(),
      );
    }),
  );
  return seen.size;
})();

/** Plain-text curriculum outline, reused by the admin CSV export. */
export const OUTLINE_CSV_HEADER = ["module_id", "number", "title", "part", "minutes"];
export const OUTLINE_CSV_ROWS = MODULES.map((m) => [m.id, m.number, m.title, m.part, String(m.minutes)]);
