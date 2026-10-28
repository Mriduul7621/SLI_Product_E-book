import { useState } from "react";
import ebookDataRaw from "./data/ebookContent.json";
import Chapter from "./components/Chapter";
import Hero from "./components/Hero";
import { Header, ScrollTopButton, Sidebar, type NavItem } from "./components/Layout";
import {
  ClosingSection,
  EthicsChecklistSection,
  FrameworkSection,
  IntroSection,
  MasterAssessmentSection,
  QuickReferenceSection,
} from "./components/OtherSections";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ebookData = ebookDataRaw as any;

const navItems: NavItem[] = [
  { id: "introduction", label: "ভূমিকা ও লার্নিং ফ্রেমওয়ার্ক", emoji: "🎯" },
  ...ebookData.chapters.map((c: any) => ({
    id: c.id,
    label: `${c.number}. ${c.titleBn}`,
    emoji: "📘",
  })),
  { id: "quick-reference", label: "দ্রুত রেফারেন্স টেবিল", emoji: "📊" },
  { id: "assessment", label: "মাস্টার অ্যাসেসমেন্ট", emoji: "🧠" },
  { id: "ethics", label: "ফিল্ড এথিক্স চেকলিস্ট", emoji: "✅" },
  { id: "closing", label: "উপসংহার", emoji: "🏁" },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header onMenuToggle={() => setMenuOpen((v) => !v)} menuOpen={menuOpen} />

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:py-10">
        <Sidebar items={navItems} open={menuOpen} onNavigate={() => setMenuOpen(false)} />

        <main className="min-w-0 flex-1 space-y-16 pb-24">
          <Hero />

          <IntroSection data={ebookData.introduction} />
          <FrameworkSection items={ebookData.framework} />

          {ebookData.chapters.map((chapter: any) => (
            <Chapter key={chapter.id} chapter={chapter} />
          ))}

          <QuickReferenceSection data={ebookData.quickReference} />
          <MasterAssessmentSection data={ebookData.masterAssessment} />
          <EthicsChecklistSection data={ebookData.ethicsChecklist} />
          <ClosingSection data={ebookData.closing} />

          <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            {ebookData.meta.footer} · {ebookData.meta.company}
          </footer>
        </main>
      </div>

      <ScrollTopButton />
    </div>
  );
}
