import {
  BridgeNote,
  ExplanationCard,
  ExplSection,
  GoldenRuleCard,
  ParamTable,
  QuizCard,
  RedAlertCard,
  SectionShell,
  StoryCard,
} from "./Cards";

// Loose typing to accommodate the varied JSON shapes across chapters.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyChapter = any;

export default function Chapter({ chapter }: { chapter: AnyChapter }) {
  const exp = chapter.explanation ?? {};
  const sectionLists: AnyChapter[] = [
    ...(exp.sections ?? []),
    ...(exp.sections2 ?? []),
  ];

  return (
    <div className="space-y-10">
      <SectionShell
        id={chapter.id}
        eyebrow={`অধ্যায় ${chapter.number} · ${chapter.titleEn}`}
        title={chapter.titleBn}
      >
        <p className="mb-1 text-lg font-semibold text-emerald-700">{chapter.tagline}</p>
        <p className="leading-relaxed text-slate-700">{chapter.intro}</p>
      </SectionShell>

      {chapter.story && <StoryCard characters={chapter.story.characters} dialogue={chapter.story.dialogue} />}

      <ExplanationCard>
        {exp.paramTable && (
          <div>
            <h4 className="mb-3 text-base font-bold text-slate-900">প্রোডাক্টের মূল বৈশিষ্ট্যসমূহ</h4>
            <ParamTable headers={exp.paramTable.headers} rows={exp.paramTable.rows} />
          </div>
        )}

        {sectionLists.map((s, i) => (
          <ExplSection
            key={i}
            heading={s.heading}
            paragraphs={s.paragraphs}
            bullets={s.bullets}
            paragraphs2={s.paragraphs2}
            formulas={s.formulas}
            note={s.note}
          />
        ))}

        {exp.tierTable && (
          <div>
            <h4 className="mb-3 text-base font-bold text-slate-900">টায়ার-ভিত্তিক তুলনা</h4>
            <ParamTable headers={exp.tierTable.headers} rows={exp.tierTable.rows} />
          </div>
        )}

        {exp.riderTable && (
          <div>
            <h4 className="mb-3 text-base font-bold text-slate-900">শান্তা লাইফের রাইডার ম্যাট্রিক্স</h4>
            <ParamTable headers={exp.riderTable.headers} rows={exp.riderTable.rows} />
          </div>
        )}
      </ExplanationCard>

      {chapter.redAlerts && <RedAlertCard items={chapter.redAlerts} />}

      {chapter.quiz && (
        <QuizCard
          question={chapter.quiz.question}
          options={chapter.quiz.options}
          correct={chapter.quiz.correct}
          explanation={chapter.quiz.explanation}
        />
      )}

      {chapter.goldenRule && <GoldenRuleCard text={chapter.goldenRule} />}

      {chapter.bridge && <BridgeNote text={chapter.bridge} />}
    </div>
  );
}
