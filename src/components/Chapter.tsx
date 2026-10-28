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
import { visualFor } from "@/data/visuals";

// Loose typing to accommodate the varied JSON shapes across chapters.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyChapter = any;

export default function Chapter({ chapter }: { chapter: AnyChapter }) {
  const exp = chapter.explanation ?? {};
  const sectionLists: AnyChapter[] = [...(exp.sections ?? []), ...(exp.sections2 ?? [])];
  const visual = visualFor(chapter.id);

  return (
    <article
      aria-labelledby={`${chapter.id}-title`}
      className="scroll-mt-24 space-y-7 border-t border-charcoal/10 pt-12 print-break-before"
    >
      <div id={`${chapter.id}-title`}>
        <SectionShell
          id={chapter.id}
          number={chapter.number}
          eyebrow={chapter.titleEn}
          title={chapter.titleBn}
          tagline={chapter.tagline}
          visual={visual}
        >
          <p className="measure-wide text-[14px] leading-[1.95] text-charcoal-soft">{chapter.intro}</p>
        </SectionShell>
      </div>

      {chapter.story && (
        <StoryCard characters={chapter.story.characters} dialogue={chapter.story.dialogue} />
      )}

      <ExplanationCard>
        {exp.paramTable && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.12em] text-charcoal">
              <span className="h-3 w-[3px] bg-olive" aria-hidden="true" />
              প্রোডাক্টের মূল বৈশিষ্ট্যসমূহ
            </h4>
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
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.12em] text-charcoal">
              <span className="h-3 w-[3px] bg-olive" aria-hidden="true" />
              টায়ার-ভিত্তিক তুলনা
            </h4>
            <ParamTable headers={exp.tierTable.headers} rows={exp.tierTable.rows} />
          </div>
        )}

        {exp.riderTable && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.12em] text-charcoal">
              <span className="h-3 w-[3px] bg-olive" aria-hidden="true" />
              শান্তা লাইফের রাইডার ম্যাট্রিক্স
            </h4>
            <ParamTable headers={exp.riderTable.headers} rows={exp.riderTable.rows} dense />
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
    </article>
  );
}
