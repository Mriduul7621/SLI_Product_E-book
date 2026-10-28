import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import {
  IconChevronUp,
  IconClose,
  IconFilePdf,
  IconFileWord,
  IconList,
  IconPrint,
} from "./icons";

export type NavItem = {
  id: string;
  label: string;
  /** Two-digit section number shown in the rail */
  num: string;
  kind: "intro" | "chapter" | "appendix";
};

export const BOOK_FILES = {
  pdf: "shanta-life-ebook.pdf",
  docx: "shanta-life-ebook.docx",
};

/* ------------------------------------------------------------------ */
/* Reading progress                                                    */
/* ------------------------------------------------------------------ */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-charcoal/10 no-print" aria-hidden="true">
      <div
        id="reading-progress"
        className="h-full rule-brand"
        style={{ transform: `scaleX(${progress})`, transformOrigin: "0 50%" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */
export function Header({
  onMenuToggle,
  menuOpen,
}: {
  onMenuToggle: () => void;
  menuOpen: boolean;
}) {
  return (
    <header className="sticky top-16 z-30 border-b border-charcoal/10 bg-shell/90 backdrop-blur-md no-print">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label={menuOpen ? "সূচিপত্র বন্ধ করুন" : "সূচিপত্র খুলুন"}
          aria-expanded={menuOpen}
          className="grid h-10 w-10 place-items-center rounded-lg border border-charcoal/15 text-charcoal transition hover:bg-olive-tint xl:hidden"
        >
          {menuOpen ? <IconClose className="h-5 w-5" /> : <IconList className="h-5 w-5" />}
        </button>

        <a href="#top" className="flex min-w-0 items-center gap-3">
          <img
            src="/assets/img/logo-color.png"
            alt="Shanta Life"
            className="h-8 w-auto shrink-0 sm:h-9"
            width={120}
            height={81}
          />
          <span className="hidden h-9 w-px bg-charcoal/15 sm:block" aria-hidden="true" />
          <span className="hidden min-w-0 leading-tight sm:block">
            <span className="block truncate text-[13px] font-bold text-charcoal-deep">
              গল্পে গল্পে শিখি — বিমা প্রোডাক্ট
            </span>
            <span className="block truncate text-[11px] font-medium text-charcoal-soft">
              ফিল্ড ফোর্স ট্রেনিং ই-বুক · সংস্করণ ১.০
            </span>
          </span>
        </a>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden h-9 w-9 place-items-center rounded-lg border border-charcoal/15 text-charcoal transition hover:bg-olive-tint md:grid"
            aria-label="ব্রাউজার থেকে প্রিন্ট করুন"
            title="প্রিন্ট"
          >
            <IconPrint className="h-4 w-4" />
          </button>
          <a
            href={BOOK_FILES.pdf}
            download
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-charcoal px-3 text-[12.5px] font-bold text-white shadow-sm transition hover:bg-charcoal-deep"
          >
            <IconFilePdf className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </a>
          <a
            href={BOOK_FILES.docx}
            download
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-charcoal/20 bg-white px-3 text-[12.5px] font-bold text-charcoal transition hover:border-olive hover:bg-olive-wash"
          >
            <IconFileWord className="h-4 w-4" />
            <span className="hidden sm:inline">Word</span>
          </a>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar / table of contents                                         */
/* ------------------------------------------------------------------ */
function TocList({
  items,
  active,
  onNavigate,
}: {
  items: NavItem[];
  active: string;
  onNavigate?: () => void;
}) {
  return (
    <ol className="space-y-0.5">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={onNavigate}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "group flex items-start gap-2.5 rounded-lg py-2 pl-2.5 pr-2 text-[13.5px] leading-snug transition",
                isActive
                  ? "bg-olive-tint font-bold text-olive-deep"
                  : "text-charcoal-soft hover:bg-shell-deep/60 hover:text-charcoal-deep",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 w-5 shrink-0 font-latin text-[11px] font-bold tabular-nums",
                  isActive ? "text-sunset" : "text-charcoal/35 group-hover:text-olive",
                )}
              >
                {item.num}
              </span>
              <span className="min-w-0">{item.label}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export function Sidebar({
  items,
  open,
  onNavigate,
}: {
  items: NavItem[];
  open: boolean;
  onNavigate: () => void;
}) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0.01, 0.2] },
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  const activeIndex = Math.max(0, items.findIndex((i) => i.id === active));

  return (
    <>
      {/* Mobile / tablet drawer */}
      <div
        className={cn(
          "fixed inset-0 z-30 xl:hidden no-print",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={onNavigate}
          className={cn(
            "absolute inset-0 bg-charcoal-deep/45 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-shell px-5 pb-10 pt-6 shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-5 flex items-center justify-between">
            <p className="font-latin text-[11px] font-bold uppercase tracking-brand text-olive">
              Contents
            </p>
            <button
              type="button"
              onClick={onNavigate}
              aria-label="বন্ধ করুন"
              className="grid h-8 w-8 place-items-center rounded-md border border-charcoal/15 text-charcoal"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mb-4 text-lg font-extrabold text-charcoal-deep">সূচিপত্র</h2>
          <TocList items={items} active={active} onNavigate={onNavigate} />
        </aside>
      </div>

      {/* Desktop rail */}
      <nav
        aria-label="সূচিপত্র"
        className="hidden xl:block no-print"
      >
        <div className="sticky top-24 max-h-[calc(100vh-7.5rem)] overflow-y-auto pr-1">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="font-latin text-[10.5px] font-bold uppercase tracking-brand text-olive">
              Contents
            </p>
            <p className="font-latin text-[10.5px] font-bold tabular-nums text-charcoal/45">
              {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </p>
          </div>
          <div className="mb-4 h-px w-full bg-charcoal/10" />
          <TocList items={items} active={active} />
          <div className="mt-6 rounded-xl border border-olive/25 bg-olive-wash p-4">
            <p className="mb-1 text-[13px] font-extrabold text-charcoal-deep">অফলাইনে পড়ুন</p>
            <p className="mb-3 text-[11.5px] leading-relaxed text-charcoal-soft">
              পুরো বইটি ব্র্যান্ড-ফরম্যাটে ডাউনলোড করে রাখুন।
            </p>
            <div className="flex gap-2">
              <a
                href={BOOK_FILES.pdf}
                download
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-charcoal px-2 py-1.5 text-[11.5px] font-bold text-white transition hover:bg-charcoal-deep"
              >
                <IconFilePdf className="h-3.5 w-3.5" /> PDF
              </a>
              <a
                href={BOOK_FILES.docx}
                download
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-charcoal/20 bg-white px-2 py-1.5 text-[11.5px] font-bold text-charcoal transition hover:border-olive"
              >
                <IconFileWord className="h-3.5 w-3.5" /> Word
              </a>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Scroll to top                                                       */
/* ------------------------------------------------------------------ */
export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const onScroll = () => setVisible(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="উপরে ফিরে যান"
      className={cn(
        "fixed bottom-6 right-5 z-40 grid h-11 w-11 place-items-center rounded-full bg-charcoal text-white shadow-lift transition-all duration-300 no-print hover:bg-olive-deep",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <IconChevronUp className="h-5 w-5" />
    </button>
  );
}
