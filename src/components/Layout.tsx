import { useEffect, useState } from "react";
import { IconChevronUp, IconClose, IconDownload, IconMenu, IconShield } from "./icons";

export type NavItem = { id: string; label: string; emoji?: string };

export function Header({
  onMenuToggle,
  menuOpen,
}: {
  onMenuToggle: () => void;
  menuOpen: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            aria-label="মেনু খুলুন"
          >
            {menuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow">
            <IconShield className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-slate-900 sm:text-base">গল্পে গল্পে শিখি: শান্তা লাইফ</p>
            <p className="hidden text-xs text-slate-500 sm:block">ফিল্ড ফোর্স প্রশিক্ষণ ই-বুক</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/shanta-life-ebook.pdf"
            download
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:text-sm"
          >
            <IconDownload className="h-4 w-4" />
            <span className="hidden sm:inline">PDF ডাউনলোড</span>
            <span className="sm:hidden">PDF</span>
          </a>
          <a
            href="/shanta-life-ebook.docx"
            download
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 sm:text-sm"
          >
            <IconDownload className="h-4 w-4" />
            <span className="hidden sm:inline">Word ডাউনলোড</span>
            <span className="sm:hidden">Word</span>
          </a>
        </div>
      </div>
    </header>
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
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0.1 }
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      className={`${
        open ? "block" : "hidden"
      } fixed inset-0 top-[61px] z-30 overflow-y-auto bg-white px-4 pb-10 pt-4 lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-6rem)] lg:w-64 lg:shrink-0 lg:border-r lg:border-slate-200 lg:bg-transparent lg:px-0 lg:pt-0`}
    >
      <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">সূচিপত্র</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={onNavigate}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                active === item.id
                  ? "bg-emerald-100 font-bold text-emerald-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.emoji && <span>{item.emoji}</span>}
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
      aria-label="উপরে যান"
    >
      <IconChevronUp className="h-5 w-5" />
    </button>
  );
}
