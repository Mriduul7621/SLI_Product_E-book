import { useMemo } from "react";
import { Link, navigate } from "@/lib/router";
import { findQuiz, useHub } from "@/lib/hub";
import { MODULES } from "@/data/curriculum";
import { bn, bnDateTime, mmss } from "@/lib/format";
import {
  IconArrowRight,
  IconAward,
  IconCheckCircle,
  IconChevronLeft,
  IconClock,
  IconTrophy,
} from "@/components/icons";
import { Badge, Button, Card, ProgressRing, SectionTitle } from "@/components/hub/ui";
import { cn } from "@/utils/cn";

export default function Result({ attemptId }: { attemptId: string }) {
  const attempt = useHub((s) => s.attempts.find((a) => a.id === attemptId));
  const custom = useHub((s) => s.customQuizzes);

  const quiz = useMemo(() => (attempt ? findQuiz(attempt.quizId) : undefined), [attempt, custom]);

  if (!attempt) {
    return (
      <Card className="p-10 text-center">
        <p className="text-[15px] font-extrabold text-charcoal-deep">ফলাফলটি পাওয়া যায়নি</p>
        <p className="mx-auto mt-1 max-w-md text-[12.5px] text-charcoal-soft">
          এই ফলাফল এই ডিভাইসে সংরক্ষিত নেই (সম্ভবত অন্য ব্রাউজারে দেওয়া হয়েছে)। চাইলে আবার অংশ নিতে পারেন।
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/assessment")}>
            অ্যাসেসমেন্ট লাইব্রেরি
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate("/profile")}>
            আমার প্রোফাইল
          </Button>
        </div>
      </Card>
    );
  }

  const weakModules = quiz
    ? Array.from(
        new Set(
          quiz.questions
            .filter((q) => attempt.answers[q.id] !== q.correct)
            .map((q) => q.id.replace(/-q$/, ""))
            .filter((id) => MODULES.some((m) => m.id === id)),
        ),
      )
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      <button
        type="button"
        onClick={() => navigate("/assessment")}
        className="inline-flex items-center gap-1 text-[12px] font-bold text-charcoal-soft hover:text-olive-deep"
      >
        <IconChevronLeft className="h-4 w-4" /> অ্যাসেসমেন্টে ফিরুন
      </button>

      <Card className="overflow-hidden">
        <div
          className={cn(
            "grid gap-6 p-6 sm:p-8",
            "sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center",
            attempt.passed ? "bg-gradient-to-br from-forest-tint to-shell" : "bg-gradient-to-br from-clay-tint to-shell",
          )}
        >
          <div className="flex justify-center">
            <ProgressRing
              value={attempt.percent}
              caption={attempt.passed ? "পাস" : "আরেকবার"}
              sub={`${bn(attempt.score)}/${bn(attempt.total)} সঠিক`}
              size={150}
            />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <Badge tone={attempt.passed ? "forest" : "clay"}>
              {attempt.passed ? <IconCheckCircle className="h-3 w-3" /> : <IconAward className="h-3 w-3" />}
              {attempt.passed ? "সফলভাবে সম্পন্ন" : "পাস মার্কে পৌঁছায়নি"}
            </Badge>
            <h1 className="mt-2 text-[1.25rem] font-extrabold leading-snug text-charcoal-deep">
              {attempt.quizTitle}
            </h1>
            <p className="mt-1 text-[12.5px] text-charcoal-soft">
              {attempt.learnerName}
              {attempt.employeeId ? ` · ${attempt.employeeId}` : ""} · {bnDateTime(attempt.submittedAt)}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/12 bg-white px-3 py-1.5 text-[11.5px] font-bold text-charcoal">
                <IconClock className="h-3.5 w-3.5 text-charcoal/45" /> {mmss(attempt.durationSeconds)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/12 bg-white px-3 py-1.5 text-[11.5px] font-bold text-charcoal">
                <IconTrophy className="h-3.5 w-3.5 text-olive" /> {bn(attempt.percent)}%
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/12 bg-white px-3 py-1.5 text-[11.5px] font-bold text-charcoal">
                {attempt.passed ? "উত্তীর্ণ" : `প্রয়োজন ${bn(quiz?.passMark ?? 60)}%`}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Link to={`/assessment/take/${attempt.quizId}`}>
                <Button size="sm" variant="primary">
                  আবার দিন <IconArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link to="/library">
                <Button size="sm" variant="outline">
                  লাইব্রেরিতে যান
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {weakModules.length > 0 && (
        <Card className="p-5">
          <SectionTitle eyebrow="Focus" title="এই অধ্যায়গুলো আরেকবার পড়ুন" />
          <div className="grid gap-2 sm:grid-cols-2">
            {weakModules.map((id) => {
              const m = MODULES.find((x) => x.id === id);
              if (!m) return null;
              return (
                <Link
                  key={id}
                  to={`/library/${id}`}
                  className="flex items-center gap-3 rounded-xl border border-charcoal/12 bg-white p-3 transition hover:border-olive"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-olive-tint font-latin text-[11px] font-extrabold text-olive-deep">
                    {m.number}
                  </span>
                  <span className="min-w-0 flex-1 text-[12.5px] font-bold text-charcoal-deep">{m.title}</span>
                  <IconArrowRight className="h-4 w-4 shrink-0 text-charcoal/35" />
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {quiz && (
        <section>
          <SectionTitle
            eyebrow="Review"
            title="উত্তরপত্র ও ব্যাখ্যা"
            description="প্রতিটি প্রশ্নের সঠিক উত্তর ও ব্যাখ্যা — মাঠে এই যুক্তিগুলোই কাজে লাগবে।"
          />
          <ol className="space-y-3">
            {quiz.questions.map((q, i) => {
              const chosen = attempt.answers[q.id];
              const correct = chosen === q.correct;
              return (
                <li key={q.id}>
                  <Card className="overflow-hidden">
                    <div
                      className={cn(
                        "flex items-start gap-3 border-b px-4 py-3",
                        correct ? "border-forest/15 bg-forest-tint/70" : "border-clay/15 bg-clay-tint/70",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full font-latin text-[11px] font-extrabold text-white",
                          correct ? "bg-forest" : "bg-clay",
                        )}
                      >
                        {correct ? "✓" : "✕"}
                      </span>
                      <p className="text-[13px] font-bold leading-relaxed text-charcoal-deep">
                        <span className="font-latin text-[11px] font-extrabold text-charcoal/45">{bn(i + 1)}. </span>
                        {q.prompt}
                      </p>
                    </div>
                    <div className="space-y-1.5 px-4 py-3 text-[12.5px]">
                      <p className={cn("flex gap-2", correct ? "text-forest" : "text-clay")}>
                        <span className="font-bold">আপনার উত্তর:</span>
                        <span className="min-w-0">
                          {chosen === undefined ? "উত্তর দেননি" : q.options[chosen]}
                        </span>
                      </p>
                      {!correct && (
                        <p className="flex gap-2 text-forest">
                          <span className="font-bold">সঠিক উত্তর:</span>
                          <span className="min-w-0">
                            {String.fromCharCode(65 + q.correct)}. {q.options[q.correct]}
                          </span>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="mt-2 rounded-lg bg-shell px-3 py-2 leading-relaxed text-charcoal-soft">
                          <span className="font-bold text-charcoal">ব্যাখ্যা: </span>
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
