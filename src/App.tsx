import { useState } from "react";
import ebookDataRaw from "./data/ebookContent.json";
import Chapter from "./components/Chapter";
import Contents, { type ContentCard } from "./components/Contents";
import Hero from "./components/Hero";
import {
  Header,
  ReadingProgress,
  ScrollTopButton,
  Sidebar,
  type NavItem,
} from "./components/Layout";
import { MockTestSection, NeedBasedSection, NoNeedSection, ObjectionMethodSection } from "./components/Mastery";
import masteryDataRaw from "./data/sales/mastery.json";
import {
  ClosingSection,
  DownloadSection,
  EthicsChecklistSection,
  FrameworkSection,
  IntroSection,
  MasterAssessmentSection,
  QuickReferenceSection,
  SiteFooter,
} from "./components/OtherSections";
import { chapterVisuals } from "./data/visuals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ebookData = ebookDataRaw as any;
const masteryData = masteryDataRaw as any;

const bn = (n: number) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

const navItems: NavItem[] = [
  { id: "introduction", label: "ভূমিকা ও লার্নিং ফ্রেমওয়ার্ক", num: "০১", kind: "intro" },
  ...ebookData.chapters.map((c: any) => ({
    id: c.id,
    label: c.titleBn,
    num: c.number,
    kind: "chapter" as const,
  })),
  { id: "mastery", label: "নিড-বেজড বিক্রয় ফ্রেমওয়ার্ক", num: "১৩", kind: "appendix" },
  { id: "objection-method", label: "আপত্তি মোকাবেলার ৭ ধাপ", num: "১৪", kind: "appendix" },
  { id: "mock-tests", label: "কঠিন প্রশ্নের মক টেস্ট", num: "১৫", kind: "appendix" },
  { id: "no-need", label: "নো-নিড এথিক্স", num: "১৬", kind: "appendix" },
  { id: "quick-reference", label: "দ্রুত রেফারেন্স টেবিল", num: "১৭", kind: "appendix" },
  { id: "assessment", label: "মাস্টার অ্যাসেসমেন্ট", num: "১৮", kind: "appendix" },
  { id: "ethics", label: "ফিল্ড এথিক্স চেকলিস্ট", num: "১৯", kind: "appendix" },
  { id: "closing", label: "উপসংহার", num: "২০", kind: "appendix" },
];

const contentsItems: ContentCard[] = [
  {
    ...navItems[0],
    title: ebookData.introduction.heading,
    meta: "Introduction",
    accent: "sunset",
  },
  ...ebookData.chapters.map((c: any, i: number) => ({
    ...navItems[i + 1],
    title: c.titleBn,
    meta: c.titleEn,
    image: chapterVisuals[c.id]?.src,
    accent: (i % 3 === 0 ? "olive" : "charcoal") as ContentCard["accent"],
  })),
  ...navItems.slice(-8).map((item) => ({
    ...item,
    title:
      {
        mastery: masteryData.needBased.heading,
        "objection-method": masteryData.objectionMethod.heading,
        "mock-tests": masteryData.mockTest.heading,
        "no-need": masteryData.noNeed.heading,
        "quick-reference": ebookData.quickReference.heading,
        assessment: ebookData.masterAssessment.heading,
        ethics: ebookData.ethicsChecklist.heading,
        closing: "উপসংহার ও শেষ কথা",
      }[item.id as string] ?? item.label,
    meta: ["mastery", "objection-method", "mock-tests", "no-need"].includes(item.id)
      ? "Sales Mastery"
      : "Appendix",
    accent: "sunset" as const,
  })),
];

const redAlertCount = ebookData.chapters.reduce(
  (sum: number, c: any) => sum + (c.redAlerts?.length ?? 0),
  0,
);
const quizCount = ebookData.chapters.length + ebookData.masterAssessment.questions.length;

const heroStats = [
  { value: bn(ebookData.chapters.length), label: "মোট মডিউল" },
  { value: bn(quizCount), label: "কুইজ প্রশ্ন" },
  { value: bn(redAlertCount), label: "রেড অ্যালার্ট" },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-shell text-charcoal">
      <ReadingProgress />
      <a
        href="#introduction"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-charcoal focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        মূল কনটেন্টে যান
      </a>

      <Header onMenuToggle={() => setMenuOpen((v) => !v)} menuOpen={menuOpen} />

      <main>
        <Hero stats={heroStats} />
        <Contents items={contentsItems} />

        <div className="mx-auto max-w-[1240px] px-5 sm:px-6 lg:px-8">
          <div className="xl:grid xl:grid-cols-[236px_minmax(0,1fr)] xl:gap-14">
            <Sidebar items={navItems} open={menuOpen} onNavigate={() => setMenuOpen(false)} />

            <div className="min-w-0 pb-20 pt-12 lg:pt-14">
              <div className="space-y-14">
                <IntroSection data={ebookData.introduction} />
                <FrameworkSection items={ebookData.framework} />

                {ebookData.chapters.map((chapter: any) => (
                  <Chapter key={chapter.id} chapter={chapter} />
                ))}

                <div className="space-y-14 border-t border-charcoal/10 pt-12">
                  <NeedBasedSection data={masteryData.needBased} />
                  <ObjectionMethodSection data={masteryData.objectionMethod} />
                  <MockTestSection data={masteryData.mockTest} />
                  <NoNeedSection data={masteryData.noNeed} />
                  <QuickReferenceSection data={ebookData.quickReference} />
                  <MasterAssessmentSection data={ebookData.masterAssessment} />
                  <EthicsChecklistSection data={ebookData.ethicsChecklist} />
                  <ClosingSection data={ebookData.closing} />
                </div>

                <DownloadSection />
                <SiteFooter footerText={`${ebookData.meta.footer} · ${ebookData.meta.company}`} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <ScrollTopButton />
    </div>
  );
}
