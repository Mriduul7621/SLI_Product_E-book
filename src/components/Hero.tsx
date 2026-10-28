import { cn } from "@/utils/cn";
import { coverVisual } from "@/data/visuals";
import { BOOK_FILES } from "./Layout";
import { IconArrowRight, IconFilePdf, IconFileWord, IconSparkle } from "./icons";

/**
 * The book cover — built from the original cover artwork plus the approved
 * Shanta Life logo, brand colours and Bengali typography.
 * Type scales with the container so the same component serves the hero,
 * the contents page and the closing spread.
 */
export function BookCover({ className }: { className?: string }) {
  return (
    <figure
      className={cn(
        "cover-shell relative aspect-[1/1.414] w-full select-none overflow-hidden bg-charcoal-deep",
        className,
      )}
    >
      <img
        src={coverVisual.src}
        alt={coverVisual.alt}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {/* Brand overlays for title legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(30,30,29,0.94) 0%, rgba(30,30,29,0.86) 30%, rgba(30,30,29,0.42) 52%, rgba(30,30,29,0.06) 68%, rgba(30,30,29,0.72) 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(120% 70% at 82% 6%, rgba(243,112,33,0.55) 0%, transparent 55%), radial-gradient(90% 60% at 8% 12%, rgba(151,140,33,0.5) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* Frame + spine */}
      <div className="pointer-events-none absolute inset-[4.2%] border border-white/20" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[2.6%]"
        style={{ background: "linear-gradient(180deg,#a89f36,#978C21 46%,#F37021 100%)" }}
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col px-[8.5%] pb-[6.5%] pt-[7.5%] pl-[10.5%]">
        <div className="flex items-start justify-between gap-3">
          <img
            src="/assets/img/logo-white.png"
            alt="Shanta Life Insurance PLC"
            className="cover-logo h-auto"
            width={160}
            height={108}
          />
          <span className="cover-eyebrow mt-1 text-right leading-relaxed text-white/60">
            FIELD
            <br />
            FORCE
          </span>
        </div>

        <div className="mt-[9%]">
          <div className="mb-[5%] flex items-center gap-[3%]">
            <span className="block h-[2px] w-[14%] bg-sunset" aria-hidden="true" />
            <span className="cover-eyebrow text-sunset">শান্তা লাইফ · ই-বুক</span>
          </div>
          <h2 className="cover-title text-white">গল্পে গল্পে শিখি</h2>
          <p className="cover-title-2 mt-[2%] text-white/92">শান্তা লাইফের বিমা প্রোডাক্ট</p>
          <p className="cover-sub mt-[6%] max-w-[92%] text-white/75">
            বাস্তব গল্প, সহজ ব্যাখ্যা ও একচ্যুয়ারিয়াল নির্ভুলতায় সাজানো ফিল্ড ফোর্স প্রশিক্ষণ
            নির্দেশিকা
          </p>
        </div>

        <div className="mt-auto">
          <div className="mb-[4%] h-px w-full bg-white/25" aria-hidden="true" />
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="cover-foot text-white/90">শান্তা লাইফ ইনস্যুরেন্স পিএলসি</p>
              <p className="cover-eyebrow mt-[2%] text-white/55">সংস্করণ ১.০ · ২০২৬</p>
            </div>
            <span className="cover-eyebrow shrink-0 text-right text-white/55">
              SETTING
              <br />
              STANDARDS
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}

type Stat = { value: string; label: string };

export default function Hero({ stats }: { stats: Stat[] }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-charcoal-deep text-white"
      aria-labelledby="book-title"
    >
      {/* Brand atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(120% 85% at 50% 0%, #000 20%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(120% 85% at 50% 0%, #000 20%, transparent 78%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 top-[-10%] h-[520px] w-[520px] rounded-full opacity-40 blur-[90px]"
        style={{ background: "radial-gradient(circle,#F37021 0%,transparent 68%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-32 bottom-[-18%] h-[420px] w-[420px] rounded-full opacity-30 blur-[90px]"
        style={{ background: "radial-gradient(circle,#978C21 0%,transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-14 pt-12 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="animate-rise">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.06] px-3.5 py-1.5 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-sunset" aria-hidden="true" />
            <span className="font-latin text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/80">
              Shanta Life · Learning &amp; Development
            </span>
          </div>

          <h1
            id="book-title"
            className="max-w-[19ch] text-[2.05rem] font-extrabold leading-[1.22] tracking-tight sm:text-[2.9rem] lg:text-[3.35rem]"
          >
            গল্পে গল্পে শিখি
            <span className="mt-1 block text-[1.15rem] font-bold text-white/70 sm:text-[1.55rem]">
              শান্তা লাইফের বিমা প্রোডাক্ট
            </span>
          </h1>

          <p className="measure mt-5 text-[14.5px] leading-[1.95] text-white/70 sm:text-[15.5px]">
            সেলস অফিসার, ইউনিট ম্যানেজার ও ফাইন্যান্সিয়াল কনসালট্যান্টদের জন্য তৈরি সম্পূর্ণ
            প্রশিক্ষণ ই-বুক — প্রতিটি প্রোডাক্টের বাস্তব কথোপকথন, সহজ ব্যাখ্যা, রেড অ্যালার্ট,
            কুইজ ও গোল্ডেন রুলসহ।
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-y border-white/12 py-5">
            {stats.map((s) => (
              <div key={s.label} className="min-w-[92px]">
                <dt className="font-latin text-[9.5px] font-bold uppercase tracking-[0.2em] text-white/45">
                  {s.label}
                </dt>
                <dd className="mt-1 text-[1.35rem] font-extrabold leading-none text-white">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#introduction"
              className="group inline-flex items-center gap-2 rounded-lg bg-sunset px-5 py-3 text-[14px] font-bold text-white shadow-lg shadow-sunset/25 transition hover:bg-sunset-deep"
            >
              পড়া শুরু করুন
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href={BOOK_FILES.pdf}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/[0.07] px-4 py-3 text-[13.5px] font-bold text-white backdrop-blur transition hover:border-white/45 hover:bg-white/15"
            >
              <IconFilePdf className="h-4 w-4" /> PDF ডাউনলোড
            </a>
            <a
              href={BOOK_FILES.docx}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/[0.07] px-4 py-3 text-[13.5px] font-bold text-white backdrop-blur transition hover:border-white/45 hover:bg-white/15"
            >
              <IconFileWord className="h-4 w-4" /> Word ডাউনলোড
            </a>
          </div>

          <p className="mt-5 flex items-center gap-1.5 text-[12px] text-white/45">
            <IconSparkle className="h-3.5 w-3.5 text-olive-mid" />
            শান্তা লাইফ ব্র্যান্ড গাইডলাইন অনুসরণে ডিজাইনকৃত · অভ্যন্তরীণ ব্যবহারের জন্য
          </p>
        </div>

        {/* Cover */}
        <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] lg:max-w-none">
          <div
            className="absolute -inset-6 rounded-[28px] opacity-60 blur-2xl"
            style={{
              background:
                "radial-gradient(60% 55% at 50% 40%, rgba(243,112,33,0.35) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />
          <div className="relative [perspective:1600px]">
            <div className="relative transition-transform duration-700 ease-out will-change-transform lg:[transform:rotateY(-13deg)_rotateX(3deg)_translateZ(0)] lg:hover:[transform:rotateY(-6deg)_rotateX(1deg)]">
              <BookCover className="rounded-[3px] shadow-book ring-1 ring-white/10" />
              {/* page edges */}
              <div
                className="absolute inset-y-[1.5%] -right-[7px] w-[10px] rounded-r-[3px]"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.55), rgba(255,255,255,0.18) 40%, rgba(60,60,59,0.5))",
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-lg border border-white/15 bg-charcoal/85 px-3 py-2 backdrop-blur sm:flex">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-olive/25 text-[11px] font-bold text-olive-mid">
              ১.০
            </span>
            <span className="text-[11.5px] font-semibold text-white/75">প্রিন্ট-রেডি সংস্করণ</span>
          </div>
        </div>
      </div>

      {/* Brand rule */}
      <div className="relative h-1 w-full rule-brand" aria-hidden="true" />
    </section>
  );
}
