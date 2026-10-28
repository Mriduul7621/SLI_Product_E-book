import { cn } from "@/utils/cn";
import { ParamTable, SectionShell } from "./Cards";
import {
  IconAlert,
  IconBrain,
  IconCheck,
  IconClose,
  IconQuote,
  IconStar,
  IconTarget,
} from "./icons";

/* ================================================================== */
/* Types                                                               */
/* ================================================================== */
export type Objection = {
  objection: string;
  realFear?: string;
  acknowledge?: string;
  clarify?: string;
  respond?: string;
  proof?: string;
  close?: string;
};

export type HardQuestion = {
  by?: string;
  level?: string;
  question: string;
  trap?: string;
  answer: string;
  data?: string;
};

export type Misconception = { myth: string; truth: string };

export type SalesPack = {
  chapterId: string;
  objectionTitle?: string;
  objections?: Objection[];
  hardQuestions?: HardQuestion[];
  misconceptions?: Misconception[];
};

const STEPS: { key: keyof Objection; label: string; tone: "charcoal" | "olive" | "sunset" | "forest" }[] = [
  { key: "realFear", label: "আসল ভয়", tone: "charcoal" },
  { key: "acknowledge", label: "স্বীকৃতি", tone: "olive" },
  { key: "clarify", label: "স্পষ্টীকরণ প্রশ্ন", tone: "olive" },
  { key: "respond", label: "উত্তর", tone: "forest" },
  { key: "proof", label: "প্রমাণ", tone: "charcoal" },
  { key: "close", label: "ক্লোজ", tone: "sunset" },
];

const TONE: Record<string, string> = {
  charcoal: "border-charcoal/20 text-charcoal-soft",
  olive: "border-olive/35 text-olive-deep",
  sunset: "border-sunset/35 text-sunset-deep",
  forest: "border-forest/25 text-forest",
};

/* ================================================================== */
/* Objection playbook                                                  */
/* ================================================================== */
function ObjectionBlock({ index, item }: { index: number; item: Objection }) {
  return (
    <details
      open
      className="group overflow-hidden rounded-xl border border-charcoal/12 bg-white print-avoid-break"
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 border-b border-charcoal/10 bg-clay-tint/50 px-4 py-3 transition hover:bg-clay-tint/70">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-clay font-latin text-[11px] font-extrabold text-white">
          {index}
        </span>
        <span className="flex-1 text-[13.5px] font-extrabold leading-relaxed text-charcoal-deep">
          “{item.objection}”
        </span>
        <span className="mt-1 hidden shrink-0 font-latin text-[9px] font-bold uppercase tracking-[0.16em] text-clay sm:block">
          Objection
        </span>
      </summary>
      <div className="space-y-2.5 px-4 py-4">
        {STEPS.map((s) => {
          const value = item[s.key];
          if (!value) return null;
          return (
            <div key={s.key} className={cn("rounded-lg border-l-[3px] bg-shell/60 px-3 py-2", TONE[s.tone])}>
              <p className="mb-0.5 font-latin text-[9.5px] font-bold uppercase tracking-[0.16em] opacity-70">
                {s.label}
              </p>
              <p className="whitespace-pre-line text-[13px] leading-[1.85] text-charcoal">{value}</p>
            </div>
          );
        })}
      </div>
    </details>
  );
}

export function SalesPlaybook({ pack }: { pack: SalesPack }) {
  if (!pack) return null;
  const hasAny = (pack.objections?.length ?? 0) + (pack.hardQuestions?.length ?? 0) + (pack.misconceptions?.length ?? 0) > 0;
  if (!hasAny) return null;

  return (
    <section className="space-y-8 border-t border-olive/25 pt-8 print-break-before">
      <header className="space-y-2">
        <p className="font-latin text-[10px] font-bold uppercase tracking-[0.22em] text-clay">
          Sales Mastery · Field Playbook
        </p>
        <h3 className="text-[1.25rem] font-extrabold leading-snug text-charcoal-deep">
          {pack.objectionTitle ?? "আপত্তি মোকাবেলা প্লেবুক"}
        </h3>
        <p className="text-[13px] leading-relaxed text-charcoal-soft">
          প্রতিটি আপত্তির পেছনে একটি অকথিত ভয় থাকে। এই প্লেবুকে প্রথমে ভয়টিকে চিহ্নিত করুন, তারপর
          স্বীকৃতি দিন, তারপর প্রমাণ দিন — কোনো ধাপ লাফ দেবেন না।
        </p>
        <div className="h-[3px] w-16 rule-brand" aria-hidden="true" />
      </header>

      {pack.objections && pack.objections.length > 0 && (
        <div className="space-y-3">
          {pack.objections.map((o, i) => (
            <ObjectionBlock key={i} index={i + 1} item={o} />
          ))}
        </div>
      )}

      {pack.hardQuestions && pack.hardQuestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-[14px] font-extrabold text-charcoal-deep">
            <IconAlert className="h-4 w-4 text-clay" />
            কঠিন প্রশ্নের মক টেস্ট (এই অধ্যায়)
          </h4>
          {pack.hardQuestions.map((q, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-charcoal/12 bg-white print-avoid-break">
              <div className="border-b border-charcoal/10 bg-charcoal-deep px-4 py-3">
                {q.by && (
                  <p className="mb-1 font-latin text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/50">
                    {q.by}
                  </p>
                )}
                <p className="text-[13px] font-bold leading-relaxed text-white">“{q.question}”</p>
              </div>
              <div className="space-y-2.5 px-4 py-3.5">
                {q.trap && (
                  <p className="rounded-md border border-clay/25 bg-clay-tint/60 px-3 py-2 text-[12.5px] leading-relaxed text-charcoal">
                    <span className="font-extrabold text-clay">⚠ ফাঁদ: </span>
                    {q.trap}
                  </p>
                )}
                <p className="text-[13px] leading-[1.85] text-charcoal">
                  <span className="font-extrabold text-forest">✔ নিরাপদ উত্তর: </span>
                  {q.answer}
                </p>
                {q.data && (
                  <p className="rounded-md bg-shell px-3 py-2 text-[12px] leading-relaxed text-charcoal-soft">
                    📌 {q.data}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pack.misconceptions && pack.misconceptions.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-[14px] font-extrabold text-charcoal-deep">
            <IconClose className="h-4 w-4 text-clay" />
            ভুল ধারণা ভাঙা (Misconception → Truth)
          </h4>
          <ParamTable
            headers={["প্রচলিত ভুল ধারণা", "সঠিক তথ্য"]}
            rows={pack.misconceptions.map((m) => [m.myth, m.truth])}
          />
        </div>
      )}
    </section>
  );
}

/* ================================================================== */
/* Mastery appendices                                                  */
/* ================================================================== */
type Any = any;

export function NeedBasedSection({ data }: { data: Any }) {
  return (
    <div className="scroll-mt-24">
      <SectionShell
        id="mastery"
        number="০৮"
        eyebrow="Need-Based Selling"
        title={data.heading}
        tagline={data.tagline}
        variant="appendix"
      >
        <p className="measure-wide text-[13.5px] leading-[1.95] text-charcoal-soft">{data.intro}</p>

        <ol className="space-y-3">
          {data.steps.map((s: Any, i: number) => (
            <li
              key={i}
              className="rounded-xl border border-charcoal/12 bg-white p-4 print-avoid-break"
            >
              <div className="mb-2 flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-olive font-latin text-[11px] font-extrabold text-white">
                  {s.step}
                </span>
                <h4 className="text-[13.5px] font-extrabold leading-snug text-charcoal-deep">{s.title}</h4>
              </div>
              <p className="text-[13px] leading-[1.9] text-charcoal">{s.text}</p>
              <p className="mt-2 flex items-start gap-2 rounded-md bg-olive-wash px-3 py-2 text-[12.5px] italic leading-relaxed text-olive-deep">
                <IconQuote className="mt-1 h-3.5 w-3.5 shrink-0" />
                {s.script}
              </p>
            </li>
          ))}
        </ol>

        <div className="space-y-3 pt-2">
          <h4 className="flex items-center gap-2 text-[14px] font-extrabold text-charcoal-deep">
            <IconBrain className="h-4 w-4 text-olive" />
            প্রশ্ন-ব্যাংক: যা জিজ্ঞেস করলেই গ্রাহক খুলে যান
          </h4>
          <ParamTable
            headers={["বিষয়", "প্রশ্ন"]}
            rows={data.questions.map((q: Any) => [q.group, q.question])}
          />
        </div>
      </SectionShell>
    </div>
  );
}

export function ObjectionMethodSection({ data }: { data: Any }) {
  return (
    <div className="scroll-mt-24">
      <SectionShell
        id="objection-method"
        number="০৯"
        eyebrow="Objection Handling · LAER-PC"
        title={data.heading}
        tagline={data.tagline}
        variant="appendix"
      >
        <p className="measure-wide text-[13.5px] leading-[1.95] text-charcoal-soft">{data.intro}</p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {data.steps.map((s: Any, i: number) => (
            <div key={i} className="rounded-xl border border-charcoal/12 bg-white p-4 print-avoid-break">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="grid h-6 min-w-6 place-items-center rounded bg-charcoal px-1 font-latin text-[10.5px] font-extrabold text-white">
                  {s.key}
                </span>
                <h4 className="text-[13px] font-extrabold leading-snug text-charcoal-deep">{s.title}</h4>
              </div>
              <p className="text-[12.5px] leading-[1.85] text-charcoal">{s.text}</p>
              <p className="mt-2 text-[12px] italic leading-relaxed text-sunset-deep">“{s.script}”</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-clay/25 bg-clay-tint/40 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-[13.5px] font-extrabold text-charcoal-deep">
            <IconAlert className="h-4 w-4 text-clay" />
            পাঁচটি অলঙ্ঘনীয় নিয়ম
          </h4>
          <ul className="space-y-1.5">
            {data.rules.map((r: string, i: number) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-[1.85] text-charcoal">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </SectionShell>
    </div>
  );
}

export function MockTestSection({ data }: { data: Any }) {
  return (
    <div className="scroll-mt-24">
      <SectionShell
        id="mock-tests"
        number="১০"
        eyebrow="Hard Question Bank"
        title={data.heading}
        tagline={data.tagline}
        variant="appendix"
      >
        <p className="measure-wide text-[13.5px] leading-[1.95] text-charcoal-soft">{data.intro}</p>

        <div className="grid gap-2.5 sm:grid-cols-3">
          {data.levels.map((l: Any, i: number) => (
            <div key={i} className="rounded-lg border border-charcoal/12 bg-white px-3.5 py-3">
              <p className="font-latin text-[9.5px] font-bold uppercase tracking-[0.16em] text-clay">
                {l.level}
              </p>
              <p className="mt-1 text-[12.5px] font-extrabold text-charcoal-deep">{l.title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-charcoal-soft">{l.text}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          {data.questions.map((q: Any, i: number) => (
            <div key={i} className="overflow-hidden rounded-xl border border-charcoal/12 bg-white print-avoid-break">
              <div className="flex flex-wrap items-center gap-2 border-b border-charcoal/10 bg-charcoal-deep px-4 py-2.5">
                <span className="rounded bg-sunset px-1.5 py-0.5 font-latin text-[9px] font-extrabold uppercase tracking-[0.14em] text-white">
                  {q.level}
                </span>
                <span className="font-latin text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/55">
                  {q.by}
                </span>
                <span className="ml-auto font-latin text-[10px] font-bold tabular-nums text-white/40">
                  #{i + 1}
                </span>
              </div>
              <div className="space-y-2.5 px-4 py-3.5">
                <p className="text-[13.5px] font-extrabold leading-relaxed text-charcoal-deep">
                  “{q.question}”
                </p>
                {q.trap && (
                  <p className="rounded-md border border-clay/25 bg-clay-tint/60 px-3 py-2 text-[12.5px] leading-relaxed text-charcoal">
                    <span className="font-extrabold text-clay">⚠ ফাঁদ: </span>
                    {q.trap}
                  </p>
                )}
                <p className="text-[13px] leading-[1.9] text-charcoal">
                  <span className="font-extrabold text-forest">✔ উত্তর: </span>
                  {q.answer}
                </p>
                {q.data && (
                  <p className="rounded-md bg-shell px-3 py-2 text-[12px] leading-relaxed text-charcoal-soft">
                    📌 {q.data}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}

export function NoNeedSection({ data }: { data: Any }) {
  return (
    <div className="scroll-mt-24">
      <SectionShell
        id="no-need"
        number="১১"
        eyebrow="Ethics · The No-Need Case"
        title={data.heading}
        tagline={data.tagline}
        variant="appendix"
      >
        <p className="measure-wide text-[13.5px] leading-[1.95] text-charcoal-soft">{data.intro}</p>

        <ol className="space-y-3">
          {data.steps.map((s: Any, i: number) => (
            <li key={i} className="rounded-xl border border-charcoal/12 bg-white p-4 print-avoid-break">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-forest font-latin text-[11px] font-extrabold text-white">
                  {s.step}
                </span>
                <h4 className="text-[13.5px] font-extrabold leading-snug text-charcoal-deep">{s.title}</h4>
              </div>
              <p className="text-[13px] leading-[1.9] text-charcoal">{s.text}</p>
              <p className="mt-2 flex items-start gap-2 rounded-md bg-forest-tint px-3 py-2 text-[12.5px] italic leading-relaxed text-forest">
                <IconQuote className="mt-1 h-3.5 w-3.5 shrink-0" />
                {s.script}
              </p>
            </li>
          ))}
        </ol>

        <div className="space-y-3 pt-2">
          <h4 className="flex items-center gap-2 text-[14px] font-extrabold text-charcoal-deep">
            <IconTarget className="h-4 w-4 text-clay" />
            আগের ভুল ধারণা পরিষ্কার করা
          </h4>
          <ParamTable
            headers={["যা মানুষ ভাবেন", "আসলে কী"]}
            rows={data.misbeliefs.map((m: Any) => [m.myth, m.truth])}
          />
        </div>

        <div className="rounded-xl border border-olive/30 bg-olive-wash p-4">
          <h4 className="mb-2 flex items-center gap-2 text-[13.5px] font-extrabold text-olive-deep">
            <IconStar className="h-4 w-4" />
            {data.closing.title}
          </h4>
          <ul className="space-y-1.5">
            {data.closing.lines.map((l: string, i: number) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-[1.85] text-charcoal">
                <IconCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-forest" />
                {l}
              </li>
            ))}
          </ul>
        </div>
      </SectionShell>
    </div>
  );
}
