import { cn } from "@/utils/cn";
import { closingVisual, fieldPhotos, frameworkVisual, introVisual } from "@/data/visuals";
import { BOOK_FILES } from "./Layout";
import {
  GoldenRuleCard,
  ParamTable,
  PullQuote,
  QuizCard,
  SceneFigure,
  SectionShell,
} from "./Cards";
import {
  IconArrowRight,
  IconCheck,
  IconClipboard,
  IconDownload,
  IconFilePdf,
  IconFileWord,
  IconLayers,
  IconStar,
  IconTarget,
  IconUsers,
} from "./icons";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/* ================================================================== */
/* Introduction                                                        */
/* ================================================================== */
export function IntroSection({ data }: { data: Any }) {
  return (
    <div className="scroll-mt-24">
      <SectionShell
        id="introduction"
        number="০১"
        eyebrow="Introduction & Learning Framework"
        title={data.heading}
        variant="intro"
        visual={introVisual}
      >
        <div className="prose-bn measure-wide text-[14px]">
          {data.paragraphs.map((p: string, i: number) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}

/* ================================================================== */
/* Learning framework                                                  */
/* ================================================================== */
const FRAMEWORK_ICONS = [IconLayers, IconTarget, IconClipboard, IconUsers, IconStar];

export function FrameworkSection({ items }: { items: Any[] }) {
  return (
    <section aria-labelledby="framework-title" className="scroll-mt-24">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-latin text-[10.5px] font-bold uppercase tracking-[0.2em] text-olive-deep">
            Learning Framework
          </p>
          <h3
            id="framework-title"
            className="mt-1.5 text-[1.25rem] font-extrabold tracking-tight text-charcoal-deep"
          >
            পাঁচ ধাপের শেখার কাঠামো
          </h3>
        </div>
        <span className="hidden font-latin text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/35 sm:block">
          05 Steps
        </span>
      </div>

      <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item, i) => {
          const Icon = FRAMEWORK_ICONS[i % FRAMEWORK_ICONS.length];
          return (
            <li
              key={i}
              className="group relative flex flex-col rounded-lg border border-charcoal/10 bg-white p-4 transition hover:border-olive/45 hover:shadow-card"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-olive-tint text-olive-deep transition group-hover:bg-olive group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-latin text-[10px] font-extrabold tabular-nums text-charcoal/25">
                  0{i + 1}
                </span>
              </div>
              <h4 className="text-[13.5px] font-extrabold leading-snug text-charcoal-deep">
                {item.titleBn}
              </h4>
              <p className="mt-1.5 text-[11.5px] leading-[1.75] text-charcoal-soft">{item.desc}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <SceneFigure visual={frameworkVisual} ratio="16 / 9" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {fieldPhotos.map((p) => (
            <figure
              key={p.src}
              className="relative overflow-hidden rounded-lg ring-1 ring-charcoal/10"
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="h-full max-h-[132px] w-full object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal-deep/90 to-transparent px-3 pb-2 pt-6 text-[10.5px] font-semibold leading-snug text-white/85">
                {p.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Quick reference                                                     */
/* ================================================================== */
export function QuickReferenceSection({ data }: { data: Any }) {
  return (
    <SectionShell
      id="quick-reference"
      number="০৮"
      eyebrow="Appendix A · Quick Reference"
      title={data.heading}
      variant="appendix"
      tagline="ফিল্ডে দ্রুত উত্তর দেওয়ার জন্য এক পাতার সারসংক্ষেপ"
    >
      <ParamTable headers={data.headers} rows={data.rows} dense />
      <p className="rounded-md border border-charcoal/10 bg-shell px-3.5 py-2.5 text-[12px] leading-relaxed text-charcoal-soft">
        📌 যেকোনো সিদ্ধান্তের আগে সর্বদা অনুমোদিত প্রোডাক্ট ফাইল ও আন্ডাররাইটিং ম্যানুয়াল যাচাই করুন —
        এই টেবিলটি কেবল দ্রুত স্মরণ করানোর সহায়ক।
      </p>
    </SectionShell>
  );
}

/* ================================================================== */
/* Master assessment                                                   */
/* ================================================================== */
export function MasterAssessmentSection({ data }: { data: Any }) {
  return (
    <SectionShell
      id="assessment"
      number="০৯"
      eyebrow="Appendix B · Master Assessment"
      title={data.heading}
      variant="appendix"
      tagline="বইয়ের সব প্রোডাক্ট একসাথে মিলিয়ে নিজেকে যাচাই করুন"
    >
      <p className="measure-wide text-[14px] leading-[1.95] text-charcoal-soft">{data.intro}</p>
      <div className="mt-5 space-y-4">
        {data.questions.map((q: Any, i: number) => (
          <QuizCard
            key={i}
            index={`${i + 1}`}
            product={q.product}
            question={q.question}
            options={q.options}
            correct={q.correct}
            explanation={q.explanation}
          />
        ))}
      </div>
    </SectionShell>
  );
}

/* ================================================================== */
/* Ethics checklist                                                    */
/* ================================================================== */
export function EthicsChecklistSection({ data }: { data: Any }) {
  return (
    <SectionShell
      id="ethics"
      number="১০"
      eyebrow="Appendix C · Field Ethics"
      title={data.heading}
      variant="appendix"
      tagline="কমপ্লায়েন্স ও বিশ্বাসই শান্তা লাইফের স্থায়ী মূলধন"
    >
      <p className="measure-wide text-[14px] leading-[1.95] text-charcoal-soft">{data.intro}</p>
      <div className="mt-5 space-y-2.5">
        {data.items.map((item: string, i: number) => (
          <label
            key={i}
            className="group flex cursor-pointer items-start gap-3 rounded-lg border border-charcoal/12 bg-white px-4 py-3.5 transition hover:border-olive/45"
          >
            <input type="checkbox" className="peer sr-only" />
            <span
              className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border border-charcoal/25 bg-white text-transparent transition peer-checked:border-olive peer-checked:bg-olive peer-checked:text-white"
              aria-hidden="true"
            >
              <IconCheck className="h-3.5 w-3.5" />
            </span>
            <span className="text-[13.5px] leading-[1.85] text-charcoal">{item}</span>
            <span className="ml-auto hidden font-latin text-[10px] font-bold tabular-nums text-charcoal/25 sm:block">
              {String(i + 1).padStart(2, "0")}
            </span>
          </label>
        ))}
      </div>
      <p className="text-[11.5px] font-semibold text-charcoal/45">
        ☑ চেকলিস্টটি নিজের প্রিন্ট কপিতে ব্যবহার করুন — টিক দিয়ে নিজের কমপ্লায়েন্স নিশ্চিত করুন।
      </p>
    </SectionShell>
  );
}

/* ================================================================== */
/* Closing                                                             */
/* ================================================================== */
export function ClosingSection({ data }: { data: Any }) {
  return (
    <SectionShell
      id="closing"
      number="১১"
      eyebrow="Closing Note"
      title={data.heading}
      variant="appendix"
      visual={closingVisual}
    >
      <div className="prose-bn measure-wide text-[14.5px]">
        {data.paragraphs.map((p: string, i: number) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <PullQuote by="Shanta Life Insurance PLC">
        শান্তা লাইফে আমরা বিশ্বাস করি — সঠিক পরামর্শই সবচেয়ে বড় সুরক্ষা।
      </PullQuote>
      <GoldenRuleCard text="গ্রাহকের চাহিদা শুনুন, সৎভাবে সমাধান দিন, একচ্যুয়ারিয়াল নিয়ম মেনে চলুন — এটাই শান্তা লাইফের ফিল্ড সাফল্যের চিরন্তন সূত্র!" />
    </SectionShell>
  );
}

/* ================================================================== */
/* Download call to action                                             */
/* ================================================================== */
export function DownloadSection() {
  const files = [
    {
      href: BOOK_FILES.pdf,
      icon: <IconFilePdf className="h-5 w-5" />,
      label: "PDF সংস্করণ",
      en: "Printable PDF",
      desc: "ব্র্যান্ড-ফরম্যাটে সম্পূর্ণ বই, অফলাইন প্রেজেন্টেশন ও প্রিন্টের জন্য প্রস্তুত।",
      cta: "PDF ডাউনলোড করুন",
      primary: true,
    },
    {
      href: BOOK_FILES.docx,
      icon: <IconFileWord className="h-5 w-5" />,
      label: "Word সংস্করণ",
      en: "Editable DOCX",
      desc: "প্রয়োজন অনুযায়ী নিজের ট্রেনিং ম্যানুয়ালে সম্পাদনা করার জন্য সম্পূর্ণ এডিটেবল ফাইল।",
      cta: "Word ডাউনলোড করুন",
      primary: false,
    },
  ];

  return (
    <section
      id="download"
      aria-labelledby="download-title"
      className="relative overflow-hidden rounded-2xl bg-charcoal-deep px-6 py-10 text-white sm:px-9 lg:px-12 lg:py-12 print-break-before"
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle,#F37021 0%,transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle,#978C21 0%,transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative">
        <p className="font-latin text-[10.5px] font-bold uppercase tracking-brand text-sunset">
          Download the book
        </p>
        <h2
          id="download-title"
          className="mt-2.5 max-w-[24ch] text-[1.55rem] font-extrabold leading-snug sm:text-[1.9rem]"
        >
          পুরো বইটি ডাউনলোড করে রাখুন
        </h2>
        <p className="mt-3 max-w-lg text-[13.5px] leading-[1.9] text-white/65">
          প্রশিক্ষণ সেশন, ফিল্ড মিটিং কিংবা অফলাইন রিভিশনের জন্য শান্তা লাইফ ব্র্যান্ড গাইডলাইন
          অনুসারে তৈরি প্রস্তুত সংস্করণ।
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {files.map((f) => (
            <div
              key={f.href}
              className="rounded-xl border border-white/12 bg-white/[0.05] p-5 backdrop-blur transition hover:border-white/25 hover:bg-white/[0.08]"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg",
                    f.primary ? "bg-sunset text-white" : "bg-olive/25 text-olive-mid",
                  )}
                >
                  {f.icon}
                </span>
                <div>
                  <p className="text-[14px] font-extrabold">{f.label}</p>
                  <p className="font-latin text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/40">
                    {f.en}
                  </p>
                </div>
              </div>
              <p className="mb-4 text-[12.5px] leading-[1.85] text-white/60">{f.desc}</p>
              <a
                href={f.href}
                download
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold transition",
                  f.primary
                    ? "bg-sunset text-white hover:bg-sunset-deep"
                    : "border border-white/25 text-white hover:border-white/50 hover:bg-white/10",
                )}
              >
                <IconDownload className="h-4 w-4" />
                {f.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-5 flex items-center gap-2 text-[11.5px] text-white/40">
          <IconArrowRight className="h-3.5 w-3.5" />
          Excel/Editable সোর্স ফাইল প্রয়োজন হলে লার্নিং অ্যান্ড ডেভেলপমেন্ট টিমের সঙ্গে যোগাযোগ করুন।
        </p>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Footer                                                              */
/* ================================================================== */
export function SiteFooter({ footerText }: { footerText: string }) {
  return (
    <footer className="mt-14 border-t border-charcoal/12 pt-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <img
            src="/assets/img/logo-color.png"
            alt="Shanta Life Insurance PLC"
            className="h-8 w-auto"
            width={120}
            height={81}
          />
          <p className="mt-3 max-w-sm text-[11.5px] leading-relaxed text-charcoal-soft">
            {footerText}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] font-semibold text-charcoal-soft">
          <a href={BOOK_FILES.pdf} download className="hover:text-olive-deep">
            PDF
          </a>
          <span className="h-3 w-px bg-charcoal/20" aria-hidden="true" />
          <a href={BOOK_FILES.docx} download className="hover:text-olive-deep">
            Word
          </a>
          <span className="h-3 w-px bg-charcoal/20" aria-hidden="true" />
          <a href="#contents" className="hover:text-olive-deep">
            সূচিপত্র
          </a>
          <span className="h-3 w-px bg-charcoal/20" aria-hidden="true" />
          <a href="#top" className="hover:text-olive-deep">
            শুরুতে ফিরুন
          </a>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2 border-t border-charcoal/10 pt-4 text-[10.5px] text-charcoal/40 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Shanta Life Insurance PLC — Learning &amp; Development</p>
        <p className="font-latin uppercase tracking-[0.18em]">Setting Standards</p>
      </div>
    </footer>
  );
}
