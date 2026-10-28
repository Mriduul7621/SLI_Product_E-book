import { useId, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Visual } from "@/data/visuals";
import { IconAlert, IconArrowRight, IconBook, IconBrain, IconBulb, IconCheck, IconClose, IconQuote, IconStar } from "./icons";

/* ================================================================== */
/* Chapter opener                                                      */
/* ================================================================== */
export function SectionShell({
  id,
  number,
  eyebrow,
  title,
  tagline,
  children,
  visual,
  variant = "chapter",
}: {
  id?: string;
  number?: string;
  eyebrow?: string;
  title: string;
  tagline?: string;
  children?: ReactNode;
  visual?: Visual;
  variant?: "chapter" | "appendix" | "intro";
}) {
  return (
    <section id={id} className="chapter-anchor">
      <header className="relative">
        <div className="mb-4 flex items-center gap-3">
          {number && (
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-lg font-latin text-[13px] font-extrabold tabular-nums",
                variant === "appendix"
                  ? "bg-charcoal text-white"
                  : "bg-olive text-white",
              )}
              aria-hidden="true"
            >
              {number}
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="truncate font-latin text-[10.5px] font-bold uppercase tracking-[0.18em] text-olive-deep">
                {eyebrow}
              </p>
            )}
            <p className="font-latin text-[10px] font-semibold uppercase tracking-[0.22em] text-charcoal/40">
              {variant === "appendix" ? "Appendix" : variant === "intro" ? "Introduction" : "Chapter"}
            </p>
          </div>
        </div>

        <h2 className="max-w-[26ch] text-[1.6rem] font-extrabold leading-[1.3] tracking-tight text-charcoal-deep sm:text-[2rem]">
          {title}
        </h2>
        {tagline && (
          <p className="mt-3 flex items-start gap-2 text-[15px] font-semibold leading-relaxed text-sunset-deep">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sunset" aria-hidden="true" />
            {tagline}
          </p>
        )}
        <div className="mt-5 h-[3px] w-16 rule-brand" aria-hidden="true" />
      </header>

      {visual && <SceneFigure visual={visual} className="mt-7" />}

      {children && <div className="mt-6 space-y-4">{children}</div>}
    </section>
  );
}

/* ================================================================== */
/* Scene figure                                                        */
/* ================================================================== */
export function SceneFigure({
  visual,
  className,
  ratio = "16 / 9",
}: {
  visual: Visual;
  className?: string;
  ratio?: string;
}) {
  return (
    <figure
      className={cn(
        "group relative overflow-hidden rounded-xl bg-charcoal-deep ring-1 ring-charcoal/10 print-avoid-break",
        className,
      )}
    >
      <img
        src={visual.src}
        alt={visual.alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
        style={{ aspectRatio: ratio }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: "linear-gradient(to top, rgba(30,30,29,0.82), transparent)" }}
        aria-hidden="true"
      />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <p className="max-w-[85%] text-[12.5px] font-semibold leading-snug text-white/92">
          {visual.caption}
        </p>
        <span className="hidden shrink-0 font-latin text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 sm:block">
          {visual.label}
        </span>
      </figcaption>
      <span
        className="pointer-events-none absolute left-0 top-0 h-12 w-12 border-l-2 border-t-2 border-sunset/80"
        aria-hidden="true"
      />
    </figure>
  );
}

/* ================================================================== */
/* Story                                                               */
/* ================================================================== */
function initials(name: string) {
  const clean = name.replace(/\(.*?\)/g, "").trim();
  return clean.slice(0, 1);
}

export function StoryCard({
  characters,
  dialogue,
}: {
  characters: string;
  dialogue: { speaker: string; text: string }[];
}) {
  const speakers = Array.from(new Set(dialogue.map((d) => d.speaker)));

  return (
    <div className="overflow-hidden rounded-xl border border-olive/20 bg-shell print-avoid-break">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-olive/20 bg-olive-tint/70 px-4 py-3 sm:px-5">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-olive text-white">
          <IconBook className="h-4 w-4" />
        </span>
        <h3 className="text-[14.5px] font-extrabold text-charcoal-deep">গল্প (Story)</h3>
        <span className="ml-auto hidden font-latin text-[9.5px] font-bold uppercase tracking-[0.18em] text-olive-deep sm:block">
          Field Conversation
        </span>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <p className="mb-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-charcoal-soft">
          <span className="mt-0.5 shrink-0 rounded bg-white px-1.5 py-0.5 font-bold text-olive-deep">
            চরিত্র
          </span>
          <span className="italic">{characters}</span>
        </p>

        <div className="space-y-3.5">
          {dialogue.map((d, i) => {
            const isNarration = d.speaker === "বর্ণনা" || d.speaker === "ফলাফল";
            const idx = speakers.indexOf(d.speaker);
            const isRight = !isNarration && idx % 2 === 1;

            if (isNarration) {
              return (
                <p
                  key={i}
                  className="rounded-md border-l-2 border-sunset/60 bg-white/70 px-3 py-2 text-[13.5px] leading-relaxed text-charcoal-soft"
                >
                  <span className="mr-1.5 font-bold text-sunset-deep">{d.speaker}:</span>
                  {d.text}
                </p>
              );
            }

            return (
              <div
                key={i}
                className={cn("flex items-start gap-2.5", isRight && "flex-row-reverse text-right")}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-extrabold",
                    isRight ? "bg-sunset text-white" : "bg-charcoal text-white",
                  )}
                  aria-hidden="true"
                >
                  {initials(d.speaker)}
                </span>
                <div
                  className={cn(
                    "max-w-[88%] rounded-xl border bg-white px-3.5 py-2.5 shadow-[0_1px_0_rgba(60,60,59,0.05)]",
                    isRight
                      ? "rounded-tr-sm border-sunset/25 bg-sunset-soft/60"
                      : "rounded-tl-sm border-olive/20",
                  )}
                >
                  <p
                    className={cn(
                      "mb-1 text-[11.5px] font-extrabold",
                      isRight ? "text-sunset-deep" : "text-olive-deep",
                    )}
                  >
                    {d.speaker}
                  </p>
                  <p className="text-left text-[13.5px] leading-[1.85] text-charcoal">{d.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Explanation                                                         */
/* ================================================================== */
export function ExplanationCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-charcoal/12 bg-white shadow-[0_1px_0_rgba(60,60,59,0.04)] print-avoid-break">
      <div className="flex items-center gap-3 border-b border-charcoal/10 bg-shell px-4 py-3 sm:px-5">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-sunset text-white">
          <IconBulb className="h-4 w-4" />
        </span>
        <h3 className="text-[14.5px] font-extrabold text-charcoal-deep">
          সহজ ব্যাখ্যা (Simple Explanation)
        </h3>
      </div>
      <div className="space-y-6 px-4 py-5 sm:px-5 lg:px-6">{children}</div>
    </div>
  );
}

function FormulaBlock({ label, steps }: { label: string; steps: string[] }) {
  return (
    <div className="rounded-lg border border-olive/25 bg-olive-wash p-3.5">
      <p className="mb-2 flex items-start gap-2 text-[12.5px] font-extrabold leading-snug text-olive-deep">
        <span aria-hidden="true">🧮</span>
        {label}
      </p>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-[1.8] text-charcoal">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-olive/15 font-latin text-[10px] font-extrabold text-olive-deep">
              {i + 1}
            </span>
            <span className="font-mono-bn">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ExplSection({
  heading,
  paragraphs,
  bullets,
  paragraphs2,
  formulas,
  note,
}: {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  paragraphs2?: string[];
  formulas?: { label: string; steps: string[] }[];
  note?: string;
}) {
  return (
    <div className="space-y-3">
      {heading && (
        <h4 className="border-l-[3px] border-olive pl-3 text-[15px] font-extrabold leading-snug text-charcoal-deep">
          {heading}
        </h4>
      )}
      <div className="prose-bn text-[14px]">
        {paragraphs?.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {bullets && (
        <ul className="space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-[13.5px] leading-[1.8] text-charcoal">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rotate-45 bg-olive" aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="prose-bn text-[14px]">
        {paragraphs2?.map((p, i) => (
          <p key={`p2-${i}`}>{p}</p>
        ))}
      </div>
      {formulas && (
        <div className="space-y-3">
          {formulas.map((f, i) => (
            <FormulaBlock key={i} label={f.label} steps={f.steps} />
          ))}
        </div>
      )}
      {note && (
        <p className="rounded-md border border-charcoal/10 bg-shell px-3 py-2 text-[12.5px] italic leading-relaxed text-charcoal-soft">
          📝 {note}
        </p>
      )}
    </div>
  );
}

/* ================================================================== */
/* Tables                                                              */
/* ================================================================== */
export function ParamTable({
  headers,
  rows,
  dense = false,
}: {
  headers: string[];
  rows: string[][];
  dense?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-charcoal/15">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="bg-charcoal">
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="whitespace-nowrap px-3.5 py-2.5 text-[11.5px] font-bold text-white/90 first:rounded-tl-none"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-t border-charcoal/10 align-top",
                  i % 2 === 0 ? "bg-white" : "bg-shell/70",
                )}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={cn(
                      "px-3.5 text-[12.5px] leading-[1.7] text-charcoal",
                      dense ? "py-2" : "py-2.5",
                      j === 0 && "font-bold text-charcoal-deep",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Red alert                                                           */
/* ================================================================== */
export function RedAlertCard({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-clay/25 bg-[#FBF1EC] print-avoid-break">
      <div className="flex items-center gap-3 border-b border-clay/20 bg-clay/[0.08] px-4 py-3 sm:px-5">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-clay text-white">
          <IconAlert className="h-4 w-4" />
        </span>
        <h3 className="text-[14.5px] font-extrabold text-clay">রেড অ্যালার্ট (Red Alert)</h3>
      </div>
      <ul className="divide-y divide-clay/10 px-4 sm:px-5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 py-3">
            <IconClose className="mt-1 h-4 w-4 shrink-0 text-clay/80" />
            <span className="text-[13.5px] leading-[1.85] text-[#5c2a22]">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================== */
/* Quiz                                                                */
/* ================================================================== */
export function QuizCard({
  question,
  options,
  correct,
  explanation,
  index,
  product,
}: {
  question: string;
  options: { key: string; text: string }[];
  correct: string;
  explanation: string;
  index?: string;
  product?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const uid = useId();
  const answered = selected !== null;

  return (
    <div className="overflow-hidden rounded-xl border border-plum/20 bg-plum-soft/60 print-avoid-break">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-plum/20 bg-plum/[0.08] px-4 py-3 sm:px-5">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-plum text-white">
          <IconBrain className="h-4 w-4" />
        </span>
        <h3 className="text-[14.5px] font-extrabold text-plum">
          কুইজ — নিজেকে যাচাই করুন{index ? ` (${index})` : ""}
        </h3>
        {product && (
          <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[10.5px] font-bold text-plum">
            {product}
          </span>
        )}
      </div>

      <div className="px-4 py-4 sm:px-5">
        <p className="mb-4 text-[14px] font-bold leading-[1.85] text-charcoal-deep">{question}</p>

        <div role="radiogroup" aria-labelledby={`${uid}-q`} className="space-y-2">
          <p id={`${uid}-q`} className="sr-only">
            {question}
          </p>
          {options.map((opt) => {
            const isSelected = selected === opt.key;
            const isCorrect = opt.key === correct;
            const show = revealed || answered;
            return (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setSelected(opt.key);
                  setRevealed(true);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border px-3.5 py-2.5 text-left transition print:bg-white",
                  show && isCorrect
                    ? "border-forest/40 bg-[#EEF5EC]"
                    : show && isSelected && !isCorrect
                      ? "border-clay/40 bg-[#FBF1EC]"
                      : "border-plum/15 bg-white hover:border-plum/45 hover:bg-white",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full font-latin text-[11px] font-extrabold",
                    show && isCorrect
                      ? "bg-forest text-white"
                      : show && isSelected && !isCorrect
                        ? "bg-clay text-white"
                        : "bg-plum/10 text-plum",
                  )}
                >
                  {opt.key}
                </span>
                <span className="text-[13.5px] leading-[1.8] text-charcoal">{opt.text}</span>
                {show && isCorrect && <IconCheck className="ml-auto mt-1 h-4 w-4 shrink-0 text-forest" />}
                {show && isSelected && !isCorrect && (
                  <IconClose className="ml-auto mt-1 h-4 w-4 shrink-0 text-clay" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="text-[11.5px] font-bold text-plum underline decoration-plum/30 underline-offset-4 transition hover:decoration-plum no-print"
          >
            {revealed ? "উত্তর লুকান" : "সঠিক উত্তর দেখুন"}
          </button>
          {answered && (
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setRevealed(false);
              }}
              className="text-[11.5px] font-semibold text-charcoal/50 underline decoration-charcoal/20 underline-offset-4 hover:text-charcoal no-print"
            >
              আবার চেষ্টা করুন
            </button>
          )}
        </div>

        {revealed && (
          <div className="mt-3 rounded-lg border border-forest/25 bg-[#EEF5EC] p-3.5">
            <p className="mb-1 flex items-center gap-1.5 text-[12.5px] font-extrabold text-forest">
              <IconCheck className="h-4 w-4" /> সঠিক উত্তর: {correct}
            </p>
            <p className="text-[13px] leading-[1.85] text-[#2b4a2b]">{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Golden rule + bridge                                                */
/* ================================================================== */
export function GoldenRuleCard({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-olive/35 bg-olive-tint px-5 py-5 text-center print-avoid-break">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "radial-gradient(90% 120% at 50% -20%, rgba(151,140,33,0.22) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="relative">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 font-latin text-[9.5px] font-extrabold uppercase tracking-[0.24em] text-olive-deep">
          <IconStar className="h-3.5 w-3.5 text-sunset" /> Golden Rule
        </span>
        <p className="text-[15px] font-extrabold leading-[1.8] text-charcoal-deep">{text}</p>
      </div>
    </div>
  );
}

export function BridgeNote({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border-l-[3px] border-sunset bg-sunset-soft/70 px-4 py-3.5">
      <IconArrowRight className="mt-1 h-4 w-4 shrink-0 text-sunset-deep" />
      <div>
        <p className="mb-0.5 font-latin text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-sunset-deep">
          পরবর্তী অধ্যায়
        </p>
        <p className="text-[13.5px] leading-[1.85] text-charcoal">{text}</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Pull quote                                                          */
/* ================================================================== */
export function PullQuote({ children, by }: { children: ReactNode; by?: string }) {
  return (
    <figure className="relative rounded-xl bg-charcoal px-6 py-7 text-center">
      <IconQuote className="mx-auto mb-3 h-6 w-6 text-olive-mid/70" />
      <blockquote className="text-[16px] font-bold leading-[1.8] text-white/92">{children}</blockquote>
      {by && (
        <figcaption className="mt-3 font-latin text-[9.5px] font-bold uppercase tracking-[0.22em] text-white/45">
          {by}
        </figcaption>
      )}
    </figure>
  );
}
