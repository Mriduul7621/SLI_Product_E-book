import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Link, useRoute } from "@/lib/router";
import { bootstrap, hasRemote, syncNow, useHub } from "@/lib/hub";
import {
  IconBook,
  IconCloud,
  IconDashboard,
  IconRefresh,
  IconSettings,
  IconTrophy,
  IconUser,
} from "@/components/icons";
import { toast } from "./ui";

const NAV = [
  { to: "/", label: "হোম", icon: IconDashboard, match: ["home"] },
  { to: "/library", label: "লাইব্রেরি", icon: IconBook, match: ["library", "module", "book"] },
  { to: "/assessment", label: "অ্যাসেসমেন্ট", icon: IconTrophy, match: ["assessment", "take", "result"] },
  { to: "/admin", label: "অ্যাডমিন", icon: IconSettings, match: ["admin"] },
] as const;

function SyncPill() {
  const remote = useHub((s) => s.settings.apiUrl);
  const pending = useHub((s) => s.queue.length);
  const status = useHub((s) => s.sync.status);
  const lastSync = useHub((s) => s.sync.lastSyncAt);
  const [busy, setBusy] = useState(false);

  const connected = Boolean(remote);
  const label = !connected
    ? "লোকাল মোড"
    : status === "syncing" || busy
      ? "সিঙ্ক হচ্ছে…"
      : status === "error"
        ? "সিঙ্ক ব্যর্থ"
        : pending > 0
          ? `${pending}টি অপেক্ষমাণ`
          : "শিটে সংযুক্ত";

  const tone = !connected
    ? "border-charcoal/15 bg-charcoal/5 text-charcoal-soft"
    : status === "error"
      ? "border-clay/30 bg-clay-tint text-clay"
      : pending > 0
        ? "border-sunset/30 bg-sunset-soft text-sunset-deep"
        : "border-forest/25 bg-forest-tint text-forest";

  const onClick = async () => {
    if (!connected) {
      toast("অ্যাডমিন → সেটিংসে Apps Script URL বসান", "info");
      return;
    }
    setBusy(true);
    const res = await bootstrap();
    setBusy(false);
    if (res.ok) {
      syncNow();
      toast("Learning Hub শিটের সাথে সিঙ্ক সম্পন্ন");
    } else {
      toast(`সিঙ্ক ব্যর্থ: ${res.message}`, "error");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={lastSync ? `সর্বশেষ সিঙ্ক: ${new Date(lastSync).toLocaleString("bn-BD")}` : "Google Sheet সিঙ্ক"}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-bold transition hover:opacity-85",
        tone,
      )}
    >
      {status === "syncing" || busy ? (
        <IconRefresh className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <IconCloud className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { route } = useRoute();
  const learner = useHub((s) => s.learner);
  const [elevated, setElevated] = useState(false);

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pull fresh data once per session when a backend is configured.
  useEffect(() => {
    if (hasRemote()) void bootstrap();
  }, []);

  const activeName = route.name;
  const initials = (learner.name || "শাল")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div className="min-h-screen bg-shell text-charcoal">
      <a
        href="#hub-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-charcoal focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        মূল কনটেন্টে যান
      </a>

      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-shell/92 backdrop-blur-md transition-shadow no-print",
          elevated ? "border-charcoal/12 shadow-[0_8px_24px_-20px_rgba(38,38,37,0.5)]" : "border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Shanta Life Learning Hub — হোম">
            <img src="/assets/img/logo-color.png" alt="Shanta Life" className="h-8 w-auto shrink-0" width={120} height={81} />
            <span className="hidden h-8 w-px bg-charcoal/15 sm:block" aria-hidden="true" />
            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block truncate font-latin text-[13px] font-extrabold tracking-tight text-charcoal-deep">
                Learning Hub
              </span>
              <span className="block truncate text-[10.5px] font-semibold text-charcoal-soft">
                শান্তা লাইফ · ফিল্ড ফোর্স অ্যাকাডেমি
              </span>
            </span>
          </Link>

          <nav aria-label="প্রধান মেনু" className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const isActive = (item.match as readonly string[]).includes(activeName);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold transition",
                    isActive
                      ? "bg-charcoal text-white shadow-sm"
                      : "text-charcoal-soft hover:bg-charcoal/5 hover:text-charcoal-deep",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <SyncPill />
            <Link
              to="/profile"
              aria-label="প্রোফাইল"
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full border text-[11.5px] font-extrabold transition",
                learner.name
                  ? "border-olive/40 bg-olive-tint text-olive-deep hover:bg-olive/20"
                  : "border-charcoal/20 bg-white text-charcoal-soft hover:border-olive hover:text-olive-deep",
              )}
            >
              {learner.name ? initials : <IconUser className="h-4 w-4" />}
            </Link>
          </div>
        </div>
      </header>

      <main id="hub-main" className="mx-auto max-w-[1280px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
        {children}
      </main>

      <footer className="border-t border-charcoal/10 bg-shell-deep/40 no-print">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-8 text-[11.5px] text-charcoal-soft sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            <span className="font-bold text-charcoal-deep">শান্তা লাইফ ইনস্যুরেন্স পিএলসি</span> · ফিল্ড ফোর্স
            অ্যাকাডেমি · অভ্যন্তরীণ প্রশিক্ষণ সামগ্রী
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/book" className="font-semibold hover:text-olive-deep">
              পুরো ই-বুক
            </Link>
            <a href="/shanta-life-ebook.pdf" download className="font-semibold hover:text-olive-deep">
              PDF
            </a>
            <a href="/shanta-life-ebook.docx" download className="font-semibold hover:text-olive-deep">
              Word
            </a>
            <Link to="/admin" className="font-semibold hover:text-olive-deep">
              অ্যাডমিন
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="মোবাইল মেনু"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/12 bg-shell/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md no-print lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map((item) => {
            const isActive = (item.match as readonly string[]).includes(activeName);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-bold transition",
                  isActive ? "text-olive-deep" : "text-charcoal/55",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-12 place-items-center rounded-lg transition",
                    isActive ? "bg-olive-tint" : "bg-transparent",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
