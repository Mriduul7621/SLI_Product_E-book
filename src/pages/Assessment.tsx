import { useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { BUILTIN_QUIZZES, MODULES, chapterJson } from "@/data/curriculum";
import { activeActivations, allQuizzes, bestScoreFor, findQuiz, useHub } from "@/lib/hub";
import { bn, bnDate } from "@/lib/format";
import {
  IconArrowRight,
  IconAward,
  IconBook,
  IconCheckCircle,
  IconClock,
  IconPlay,
  IconTrophy,
} from "@/components/icons";
import { Badge, Button, Card, EmptyState, ProgressBar, SectionTitle, Tabs } from "@/components/hub/ui";
import { cn } from "@/utils/cn";
import type { Quiz } from "@/lib/types";

type Tab = "open" | "sets" | "checks";

export default function Assessment() {
  const attempts = useHub((s) => s.attempts);
  const quizzes = allQuizzes();
  const [tab, setTab] = useState<Tab>("open");

  const open = activeActivations();
  const sets = quizzes.filter((q) => q.id.startsWith("set-"));
  const bank = quizzes.filter((q) => q.id.startsWith("bank-"));
  const checks = quizzes.filter((q) => q.id.startsWith("check-"));
  const created = quizzes.filter((q) => q.origin === "custom");

  const stats = useMemo(() => {
    const scored = attempts.filter((a) => a.total > 0);
    return {
      taken: attempts.length,
      avg: scored.length ? Math.round(scored.reduce((s, a) => s + a.percent, 0) / scored.length) : 0,
      passed: attempts.filter((a) => a.passed).length,
    };
  }, [attempts]);

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-charcoal/10 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <p className="font-latin text-[10.5px] font-bold uppercase tracking-brand text-olive">Assessments</p>
            <h1 className="mt-2 text-[1.6rem] font-extrabold tracking-tight text-charcoal-deep sm:text-[1.9rem]">
              নিজেকে যাচাই করুন
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-charcoal-soft">
              প্রতিটি উত্তর জমা হলে স্কোর, ব্যাখ্যা ও দুর্বল অধ্যায়ের তালিকা তৈরি হয় — ফলাফল Learning Hub শিটেও
              যায়, তাই ট্রেনার আপনার অগ্রগতি দেখতে পান।
            </p>
          </div>
          <div className="grid w-full max-w-sm grid-cols-3 gap-2">
            <MiniStat value={bn(stats.taken)} label="অংশগ্রহণ" />
            <MiniStat value={`${bn(stats.avg)}%`} label="গড় স্কোর" />
            <MiniStat value={bn(stats.passed)} label="পাস" />
          </div>
        </div>
      </header>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "open", label: "শেয়ার করা", badge: bn(open.length) },
          { id: "sets", label: "সেট ও ব্যাংক", badge: bn(sets.length + bank.length + created.length) },
          { id: "checks", label: "অধ্যায় যাচাই", badge: bn(checks.length) },
        ]}
      />

      {tab === "open" &&
        (open.length === 0 ? (
          <EmptyState
            icon={<IconTrophy className="h-5 w-5" />}
            title="এখন কোনো সক্রিয় অ্যাসেসমেন্ট নেই"
            description="ট্রেনার অ্যাসেসমেন্ট চালু করলে তার লিংক এখানে দেখা যাবে। ততক্ষণ নিচের সেটগুলো দিয়ে অনুশীলন করুন।"
            action={
              <Button variant="outline" size="sm" onClick={() => setTab("sets")}>
                সেট দেখুন <IconArrowRight className="h-3.5 w-3.5" />
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {open.map((act) => {
              const quiz = findQuiz(act.quizId);
              return (
                <Card key={act.slug} className="flex flex-col p-5" interactive>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge tone="sunset">সক্রিয়</Badge>
                    <span className="text-[11px] font-semibold text-charcoal/45">{bnDate(act.date)}</span>
                  </div>
                  <h2 className="text-[15px] font-extrabold leading-snug text-charcoal-deep">{act.quizTitle}</h2>
                  {act.message && <p className="mt-1.5 text-[12px] leading-relaxed text-charcoal-soft">{act.message}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-charcoal/50">
                    <span className="inline-flex items-center gap-1">
                      <IconBook className="h-3.5 w-3.5" /> {bn(quiz?.questions.length ?? 0)} প্রশ্ন
                    </span>
                    {act.durationMinutes > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <IconClock className="h-3.5 w-3.5" /> {bn(act.durationMinutes)} মিনিট
                      </span>
                    )}
                    {quiz && <span>· পাস {bn(quiz.passMark)}%</span>}
                  </div>
                  <Link
                    to={`/assessment/take/${act.quizId}?slug=${encodeURIComponent(act.slug)}`}
                    className="mt-4"
                  >
                    <Button block variant="primary">
                      <IconPlay className="h-4 w-4" /> শুরু করুন
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        ))}

      {tab === "sets" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...sets, ...bank, ...created].map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}

      {tab === "checks" && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {checks.map((quiz) => {
            const module = MODULES.find((m) => `check-${m.id}` === quiz.id);
            const best = bestScoreFor(quiz.id);
            return (
              <Card key={quiz.id} className="flex flex-col p-4" interactive>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-latin text-[10px] font-bold uppercase tracking-brand text-charcoal/40">
                    {module?.number ?? "—"}
                  </span>
                  {best !== null ? (
                    <Badge tone={best >= quiz.passMark ? "forest" : "clay"}>সেরা {bn(best)}%</Badge>
                  ) : (
                    <Badge tone="charcoal">নতুন</Badge>
                  )}
                </div>
                <h3 className="text-[13px] font-extrabold leading-snug text-charcoal-deep">
                  {module?.title ?? quiz.title}
                </h3>
                <p className="mt-1 flex-1 text-[11.5px] leading-relaxed text-charcoal-soft">
                  {bn(quiz.questions.length)}টি প্রশ্ন · পাস {bn(quiz.passMark)}%
                </p>
                <Link to={`/assessment/take/${quiz.id}`} className="mt-3">
                  <Button size="sm" variant="outline" block>
                    যাচাই দিন <IconArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      <SectionTitle
        eyebrow="Tip"
        title="কীভাবে ভালো স্কোর করবেন"
        description="প্রথমে মডিউলটি পড়ুন, তারপর দ্রুত যাচাই দিন। ভুল উত্তরের ব্যাখ্যা পড়ে নিন — সেই ব্যাখ্যাই মাঠে আপনার আসল অস্ত্র।"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: IconBook, title: "১. পড়ুন", text: "গল্প ও সহজ ব্যাখ্যা একসাথে পড়ুন, নোট নিন।" },
          { icon: IconCheckCircle, title: "২. যাচাই দিন", text: "অধ্যায় শেষে দ্রুত যাচাই — সাথে সাথে ব্যাখ্যা।" },
          { icon: IconAward, title: "৩. সার্টিফাই করুন", text: "ফাইনাল সেটে ৭৫% পেলে কোর্স সম্পন্ন।" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="p-4">
              <span className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-olive-tint text-olive-deep">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-[12.5px] font-extrabold text-charcoal-deep">{s.title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-charcoal-soft">{s.text}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-charcoal/10 bg-shell px-3 py-3 text-center">
      <p className="font-latin text-[1.1rem] font-extrabold leading-none text-charcoal-deep">{value}</p>
      <p className="mt-1 text-[10.5px] font-semibold text-charcoal-soft">{label}</p>
    </div>
  );
}

function QuizCard({ quiz }: { quiz: Quiz }) {
  const best = bestScoreFor(quiz.id);
  const attempts = useHub((s) => s.attempts.filter((a) => a.quizId === quiz.id).length);
  const chapterKeys = quiz.questions.map((q) => q.id.replace(/-q$/, ""));
  const related = MODULES.filter((m) => chapterKeys.includes(m.id));

  return (
    <Card className="flex flex-col p-5" interactive>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge tone={quiz.origin === "custom" ? "plum" : "olive"}>
          {quiz.origin === "custom" ? "ট্রেনার তৈরি" : quiz.set}
        </Badge>
        {best !== null && <span className="font-latin text-[11px] font-bold text-charcoal/45">সেরা {bn(best)}%</span>}
      </div>
      <h3 className="text-[14.5px] font-extrabold leading-snug text-charcoal-deep">{quiz.title}</h3>
      <p className="mt-1 text-[11.5px] leading-relaxed text-charcoal-soft">
        {quiz.product} · {bn(quiz.questions.length)} প্রশ্ন · পাস {bn(quiz.passMark)}%
      </p>

      {related.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {related.slice(0, 4).map((m) => (
            <span key={m.id} className="rounded bg-charcoal/5 px-1.5 py-0.5 text-[10px] font-semibold text-charcoal/60">
              {m.number}
            </span>
          ))}
          {related.length > 4 && (
            <span className="rounded bg-charcoal/5 px-1.5 py-0.5 text-[10px] font-semibold text-charcoal/60">
              +{bn(related.length - 4)}
            </span>
          )}
        </div>
      )}

      <div className="mt-3">
        <ProgressBar value={best ?? 0} tone={best !== null && best >= quiz.passMark ? "forest" : "olive"} />
        <p className={cn("mt-1.5 text-[10.5px] font-semibold", attempts ? "text-charcoal-soft" : "text-charcoal/40")}>
          {attempts ? `${bn(attempts)}বার দেওয়া হয়েছে` : "এখনো দেওয়া হয়নি"}
        </p>
      </div>

      <Link to={`/assessment/take/${quiz.id}`} className="mt-4">
        <Button size="sm" block variant={best === null ? "primary" : "outline"}>
          {best === null ? "শুরু করুন" : "আবার দিন"} <IconArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </Card>
  );
}

/* Keep bundle honest: these imports are used by chapter metadata lookups. */
export const chapterTitle = (id: string) => chapterJson(id)?.titleBn ?? id;
void BUILTIN_QUIZZES;
