import { useState, type ReactNode } from "react";

export function SectionShell({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold tracking-wide text-emerald-700">{eyebrow}</p>
      )}
      <h2 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

export function StoryCard({
  characters,
  dialogue,
}: {
  characters: string;
  dialogue: { speaker: string; text: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm">
      <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-100/70 px-5 py-3">
        <span className="text-xl">📖</span>
        <h3 className="font-bold text-amber-900">গল্প (Story)</h3>
      </div>
      <div className="px-5 py-4">
        <p className="mb-4 text-sm font-medium text-amber-800">চরিত্র: {characters}</p>
        <div className="space-y-4">
          {dialogue.map((d, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">
                {d.speaker.slice(0, 1)}
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-slate-700 shadow-sm ring-1 ring-amber-100">
                <p className="mb-1 text-xs font-bold text-amber-700">{d.speaker}</p>
                <p className="leading-relaxed">{d.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FormulaBlock({ label, steps }: { label: string; steps: string[] }) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
      <p className="mb-2 text-sm font-bold text-indigo-900">🧮 {label}</p>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-indigo-900/90">
            <span className="mt-0.5 shrink-0 rounded-full bg-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">
              {i + 1}
            </span>
            <span className="font-mono-bn">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ParamTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-800 text-left text-white">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              {row.map((cell, j) => (
                <td key={j} className="border-t border-slate-100 px-4 py-2.5 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExplanationCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-200 bg-sky-50/50 shadow-sm">
      <div className="flex items-center gap-2 border-b border-sky-200 bg-sky-100/70 px-5 py-3">
        <span className="text-xl">💡</span>
        <h3 className="font-bold text-sky-900">সহজ ব্যাখ্যা (Simple Explanation)</h3>
      </div>
      <div className="space-y-6 px-5 py-5">{children}</div>
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
      {heading && <h4 className="text-base font-bold text-slate-900">{heading}</h4>}
      {paragraphs?.map((p, i) => (
        <p key={i} className="leading-relaxed text-slate-700">
          {p}
        </p>
      ))}
      {bullets && (
        <ul className="space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
              <span className="leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      )}
      {paragraphs2?.map((p, i) => (
        <p key={`p2-${i}`} className="leading-relaxed text-slate-700">
          {p}
        </p>
      ))}
      {formulas && (
        <div className="space-y-3">
          {formulas.map((f, i) => (
            <FormulaBlock key={i} label={f.label} steps={f.steps} />
          ))}
        </div>
      )}
      {note && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm italic text-slate-600">
          📝 {note}
        </p>
      )}
    </div>
  );
}

export function RedAlertCard({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rose-300 bg-rose-50/60 shadow-sm">
      <div className="flex items-center gap-2 border-b border-rose-300 bg-rose-100/80 px-5 py-3">
        <span className="text-xl">🚨</span>
        <h3 className="font-bold text-rose-900">রেড অ্যালার্ট (Red Alert)</h3>
      </div>
      <ul className="space-y-3 px-5 py-4">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-rose-900">
            <span className="mt-0.5 shrink-0 font-bold text-rose-600">❌</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuizCard({
  question,
  options,
  correct,
  explanation,
  index,
}: {
  question: string;
  options: { key: string; text: string }[];
  correct: string;
  explanation: string;
  index?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-300 bg-violet-50/60 shadow-sm">
      <div className="flex items-center gap-2 border-b border-violet-300 bg-violet-100/80 px-5 py-3">
        <span className="text-xl">🧠</span>
        <h3 className="font-bold text-violet-900">কুইজ / নিজেকে যাচাই করুন{index ? ` — প্রশ্ন ${index}` : ""}</h3>
      </div>
      <div className="px-5 py-4">
        <p className="mb-4 font-medium leading-relaxed text-slate-800">{question}</p>
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = selected === opt.key;
            const isCorrect = opt.key === correct;
            const showState = selected !== null;
            return (
              <button
                key={opt.key}
                onClick={() => setSelected(opt.key)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  showState && isCorrect
                    ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                    : showState && isSelected && !isCorrect
                      ? "border-rose-400 bg-rose-50 text-rose-900"
                      : "border-violet-200 bg-white text-slate-700 hover:border-violet-400 hover:bg-violet-50"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    showState && isCorrect
                      ? "bg-emerald-500 text-white"
                      : showState && isSelected && !isCorrect
                        ? "bg-rose-500 text-white"
                        : "bg-violet-100 text-violet-700"
                  }`}
                >
                  {opt.key}
                </span>
                <span className="leading-relaxed">{opt.text}</span>
              </button>
            );
          })}
        </div>
        {selected && (
          <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="mb-1 text-sm font-bold text-emerald-800">
              ✅ সঠিক উত্তর: {correct}
            </p>
            <p className="text-sm leading-relaxed text-emerald-900/90">{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function GoldenRuleCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-200 p-6 text-center shadow-md">
      <p className="mb-2 text-2xl">⭐</p>
      <p className="mb-1 text-sm font-bold uppercase tracking-wide text-amber-900">গোল্ডেন রুল</p>
      <p className="text-lg font-bold leading-relaxed text-amber-950">{text}</p>
    </div>
  );
}

export function BridgeNote({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 px-5 py-4">
      <span className="text-lg">➡️</span>
      <p className="leading-relaxed text-emerald-900">{text}</p>
    </div>
  );
}
