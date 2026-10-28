import { GoldenRuleCard, ParamTable, QuizCard, SectionShell } from "./Cards";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function IntroSection({ data }: { data: Any }) {
  return (
    <SectionShell id="introduction" eyebrow="অধ্যায় ১" title={data.heading}>
      <div className="space-y-4">
        {data.paragraphs.map((p: string, i: number) => (
          <p key={i} className="leading-relaxed text-slate-700">
            {p}
          </p>
        ))}
      </div>
    </SectionShell>
  );
}

export function FrameworkSection({ items }: { items: Any[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <span className="text-3xl">{item.emoji}</span>
          <h3 className="font-bold text-slate-900">{item.titleBn}</h3>
          <p className="text-sm leading-relaxed text-slate-600">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function QuickReferenceSection({ data }: { data: Any }) {
  return (
    <SectionShell id="quick-reference" eyebrow="পরিশিষ্ট" title={data.heading}>
      <ParamTable headers={data.headers} rows={data.rows} />
    </SectionShell>
  );
}

export function MasterAssessmentSection({ data }: { data: Any }) {
  return (
    <SectionShell id="assessment" eyebrow="অধ্যায় ৮" title={data.heading}>
      <p className="mb-6 leading-relaxed text-slate-700">{data.intro}</p>
      <div className="space-y-6">
        {data.questions.map((q: Any, i: number) => (
          <QuizCard
            key={i}
            index={`${i + 1} (${q.product})`}
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

export function EthicsChecklistSection({ data }: { data: Any }) {
  return (
    <SectionShell id="ethics" title={data.heading}>
      <p className="mb-6 leading-relaxed text-slate-700">{data.intro}</p>
      <div className="space-y-3">
        {data.items.map((item: string, i: number) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-5 py-4"
          >
            <span className="mt-0.5 shrink-0 text-lg text-emerald-600">✅</span>
            <p className="leading-relaxed text-emerald-950">{item}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function ClosingSection({ data }: { data: Any }) {
  return (
    <SectionShell id="closing" eyebrow="সমাপনী" title={data.heading}>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {data.paragraphs.map((p: string, i: number) => (
          <p key={i} className="leading-relaxed text-slate-700">
            {p}
          </p>
        ))}
      </div>
      <div className="mt-8">
        <GoldenRuleCard text="গ্রাহকের চাহিদা শুনুন, সৎভাবে সমাধান দিন, একচ্যুয়ারিয়াল নিয়ম মেনে চলুন — এটাই শান্তা লাইফের ফিল্ড সাফল্যের চিরন্তন সূত্র!" />
      </div>
    </SectionShell>
  );
}
