import { useMemo } from "react";
import { Link } from "@/lib/router";
import { MODULES, PARTS, TOTAL_MINUTES, bookMeta } from "@/data/curriculum";
import {
  activeActivations,
  averageScore,
  completionRate,
  findQuiz,
  nextModule,
  streakDays,
  useHub,
} from "@/lib/hub";
import { bn, bnDate, bnDateTime, percent } from "@/lib/format";
import {
  IconArrowRight,
  IconAward,
  IconBook,
  IconCheckCircle,
  IconClock,
  IconFilePdf,
  IconFileWord,
  IconPlay,
  IconSparkle,
  IconTarget,
  IconTrophy,
  IconUsers,
} from "@/components/icons";
import { Badge, Button, Card, EmptyState, ProgressBar, ProgressRing, SectionTitle, Stat } from "@/components/hub/ui";
import { cn } from "@/utils/cn";

const partTone: Record<string, "olive" | "sunset" | "steel" | "plum"> = {
  foundation: "steel",
  products: "olive",
  underwriting: "sunset",
  mastery: "plum",
};

export default function Home() {
  const learner = useHub((s) => s.learner);
  const progress = useHub((s) => s.progress);
  const attempts = useHub((s) => s.attempts);

  const rate = completionRate();
  const streak = streakDays();
  const avg = averageScore();
  const next = nextModule();
  const done = MODULES.filter((m) => progress[m.id]?.status === "completed").length;
  const active = activeActivations();

  const partStats = useMemo(
    () =>
      PARTS.map((part) => {
        const modules = MODULES.filter((m) => m.part === part.id);
        const completed = modules.filter((m) => progress[m.id]?.status === "completed").length;
        return { part, modules, completed };
      }),
    [progress],
  );

  const recent = attempts.slice(0, 4);

  return (
    <div className="space-y-10">
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden rounded-3xl border border-charcoal/10 bg-charcoal-deep text-white shadow-lift">
        <img
          src="/assets/img/field-training-2.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(38,38,37,0.96) 0%, rgba(38,38,37,0.88) 46%, rgba(38,38,37,0.55) 100%)",
          }}
          aria-hidden="true"
        />
        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold">
              <IconSparkle className="h-3.5 w-3.5 text-sunset" />
              শান্তা লাইফ ফিল্ড ফোর্স অ্যাকাডেমি
            </div>
            <h1 className="text-[1.7rem] font-extrabold leading-[1.35] tracking-tight sm:text-[2.15rem]">
              {learner.name ? `${learner.name},` : "স্বাগতম,"}
              <span className="block text-white/85">
                আজ একটু শিখলেই আগামীকালের ক্লায়েন্ট জিতবেন।
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-white/70">
              প্রোডাক্ট জ্ঞান, আন্ডাররাইটিং ও সেলস প্লেবুক — সব একসাথে, আপনার নিজের গতিতে। পড়ুন, যাচাই করুন,
              স্কোর দেখুন; সব অগ্রগতি Learning Hub শিটে সংরক্ষিত হবে।
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to={`/library/${next.id}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-sunset px-5 text-[13px] font-extrabold text-white shadow-sm transition hover:bg-sunset-deep"
              >
                <IconPlay className="h-4 w-4" />
                {done ? "পড়া চালিয়ে যান" : "শেখা শুরু করুন"}
              </Link>
              <Link
                to="/assessment"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-[13px] font-extrabold text-white transition hover:bg-white/20"
              >
                <IconTrophy className="h-4 w-4" />
                অ্যাসেসমেন্ট দিন
              </Link>
              <a
                href="/shanta-life-ebook.pdf"
                download
                className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-[12.5px] font-bold text-white/80 transition hover:text-white"
              >
                <IconFilePdf className="h-4 w-4" /> ই-বুক PDF
              </a>
            </div>

            {!learner.name && (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[12px]">
                <IconUsers className="h-4 w-4 shrink-0 text-sunset" />
                <span className="text-white/80">স্কোর আপনার নামে জমা হতে প্রোফাইলটি একবার পূরণ করুন।</span>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1 font-extrabold text-white underline underline-offset-4 hover:text-sunset"
                >
                  প্রোফাইল সেট করুন <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm sm:gap-6">
            <ProgressRing value={rate} caption="সম্পূর্ণ" sub={`${bn(done)}/${bn(MODULES.length)} মডিউল`} />
            <div className="min-w-0 flex-1 space-y-3 text-[12px]">
              <div>
                <p className="font-latin text-[1.15rem] font-extrabold leading-none">{bn(avg)}%</p>
                <p className="mt-1 text-white/60">গড় স্কোর</p>
              </div>
              <div className="h-px bg-white/15" />
              <div>
                <p className="font-latin text-[1.15rem] font-extrabold leading-none">{bn(attempts.length)}</p>
                <p className="mt-1 text-white/60">অ্যাসেসমেন্ট</p>
              </div>
              <div className="h-px bg-white/15" />
              <div>
                <p className="font-latin text-[1.15rem] font-extrabold leading-none">{bn(streak)} দিন</p>
                <p className="mt-1 text-white/60">টানা শেখা</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Quick stats ---------------- */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="সংক্ষিপ্ত পরিসংখ্যান">
        <Stat value={bn(MODULES.length)} label="মোট মডিউল" hint={`${bn(TOTAL_MINUTES)} মিনিট কনটেন্ট`} icon={<IconBook className="h-4 w-4" />} />
        <Stat value={bn(done)} label="সম্পন্ন মডিউল" hint={`${bn(MODULES.length - done)}টি বাকি`} tone="forest" icon={<IconCheckCircle className="h-4 w-4" />} />
        <Stat value={bn(active.length)} label="সক্রিয় অ্যাসেসমেন্ট" hint={active.length ? "লিংক নিচে দেখুন" : "শীঘ্রই আসছে"} tone="sunset" icon={<IconTrophy className="h-4 w-4" />} />
        <Stat value={`${bn(rate)}%`} label="কোর্স অগ্রগতি" hint={`সর্বশেষ ${recent[0] ? bnDate(recent[0].submittedAt) : "—"}`} tone="olive" icon={<IconTarget className="h-4 w-4" />} />
      </section>

      {/* ---------------- Continue + path ---------------- */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div>
          <SectionTitle
            eyebrow="Continue"
            title="পড়া চালিয়ে যান"
            description="আপনার পরবর্তী মডিউলটি প্রস্তুত — গল্প দিয়ে শুরু, তারপর সহজ ব্যাখ্যা ও যাচাই।"
            action={
              <Link to="/library" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-olive-deep hover:underline">
                সব মডিউল <IconArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <Card className="overflow-hidden" interactive>
            <Link to={`/library/${next.id}`} className="block sm:flex">
              <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-auto sm:w-52">
                <img
                  src={next.image ?? "/assets/img/scene-intro.jpg"}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute left-3 top-3 rounded-md bg-charcoal/85 px-2 py-1 font-latin text-[10.5px] font-bold text-white">
                  {next.number}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone={partTone[next.part]}>{PARTS.find((p) => p.id === next.part)?.title}</Badge>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal/50">
                      <IconClock className="h-3.5 w-3.5" /> {bn(next.minutes)} মিনিট
                    </span>
                    {progress[next.id]?.status === "in_progress" && <Badge tone="sunset">চলমান</Badge>}
                  </div>
                  <h3 className="text-[15px] font-extrabold leading-snug text-charcoal-deep">{next.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-charcoal-soft">{next.tagline}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <ProgressBar value={progress[next.id]?.status === "completed" ? 100 : 8} className="max-w-[220px]" />
                  <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-sunset-deep">
                    পড়ুন <IconArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </Card>
        </div>

        <div>
          <SectionTitle eyebrow="Learning path" title="৪ ধাপের যাত্রা" />
          <div className="space-y-2.5">
            {partStats.map(({ part, modules, completed }) => {
              const pct = percent(completed, modules.length);
              return (
                <Link
                  key={part.id}
                  to={`/library?part=${part.id}`}
                  className="group block rounded-xl border border-charcoal/10 bg-white p-4 shadow-card transition hover:border-olive/40 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-latin text-[10px] font-bold uppercase tracking-brand text-charcoal/40">
                        {part.label}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] font-extrabold text-charcoal-deep">{part.title}</p>
                    </div>
                    <span className="shrink-0 font-latin text-[11px] font-bold tabular-nums text-charcoal/45">
                      {bn(completed)}/{bn(modules.length)}
                    </span>
                  </div>
                  <ProgressBar value={pct} tone={partTone[part.id]} className="mt-3" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Assessments ---------------- */}
      <section>
        <SectionTitle
          eyebrow="Assessments"
          title="আপনার জন্য খোলা অ্যাসেসমেন্ট"
          description="ট্রেনার যেসব লিংক শেয়ার করেছেন এবং বইয়ের নিজস্ব সেটগুলো এখানেই পাবেন।"
          action={
            <Link to="/assessment" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-olive-deep hover:underline">
              সব দেখুন <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {active.length === 0 ? (
          <EmptyState
            icon={<IconTrophy className="h-5 w-5" />}
            title="এখন কোনো শেয়ার করা অ্যাসেসমেন্ট নেই"
            description="ট্রেনার লিংক শেয়ার করলে এখানে দেখা যাবে। ইতিমধ্যে বইয়ের অধ্যায়ভিত্তিক দ্রুত যাচাই ও ফাইনাল সেট দিয়ে অনুশীলন করতে পারেন।"
            action={
              <Link to="/assessment">
                <Button variant="outline" size="sm">
                  অ্যাসেসমেন্ট লাইব্রেরি <IconArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.slice(0, 3).map((act) => {
              const quiz = findQuiz(act.quizId);
              return (
                <Card key={act.slug} className="flex flex-col p-5" interactive>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge tone="sunset">সক্রিয়</Badge>
                    <span className="text-[11px] font-semibold text-charcoal/45">{bnDate(act.date)}</span>
                  </div>
                  <h3 className="text-[14px] font-extrabold leading-snug text-charcoal-deep">{act.quizTitle}</h3>
                  <p className="mt-1 flex-1 text-[12px] leading-relaxed text-charcoal-soft">
                    {act.purpose || act.message || "ট্রেনারের নির্ধারিত মূল্যায়ন"} · {bn(quiz?.questions.length ?? 0)} প্রশ্ন
                    {act.durationMinutes ? ` · ${bn(act.durationMinutes)} মিনিট` : ""}
                  </p>
                  <Link to={`/assessment/take/${act.quizId}?slug=${encodeURIComponent(act.slug)}`} className="mt-4">
                    <Button size="sm" variant="primary" block>
                      শুরু করুন <IconArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------- Recent results ---------------- */}
      <section>
        <SectionTitle eyebrow="Results" title="সাম্প্রতিক ফলাফল" />
        {recent.length === 0 ? (
          <EmptyState
            icon={<IconAward className="h-5 w-5" />}
            title="এখনো কোনো অ্যাসেসমেন্ট দেননি"
            description="একটি দ্রুত যাচাই দিয়ে শুরু করুন — ফলাফল, ব্যাখ্যা ও দুর্বল অধ্যায়ের তালিকা সাথে সাথে পাবেন।"
            action={
              <Link to="/assessment">
                <Button variant="accent" size="sm">
                  প্রথম অ্যাসেসমেন্ট <IconArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-card">
            <table className="w-full text-left text-[12.5px]">
              <thead className="bg-shell-deep/50 text-[11px] uppercase tracking-wide text-charcoal/50">
                <tr>
                  <th className="px-4 py-2.5 font-bold">অ্যাসেসমেন্ট</th>
                  <th className="hidden px-4 py-2.5 font-bold sm:table-cell">সময়</th>
                  <th className="px-4 py-2.5 text-right font-bold">স্কোর</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id} className="border-t border-charcoal/8">
                    <td className="px-4 py-3">
                      <Link to={`/assessment/result/${a.id}`} className="font-bold text-charcoal-deep hover:text-olive-deep">
                        {a.quizTitle}
                      </Link>
                      <p className="text-[11px] text-charcoal/45">{bnDateTime(a.submittedAt)}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-charcoal-soft sm:table-cell">
                      {bn(Math.round(a.durationSeconds / 60))} মিনিট
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "inline-flex min-w-[54px] justify-center rounded-md px-2 py-1 font-latin text-[11.5px] font-extrabold",
                          a.passed ? "bg-forest-tint text-forest" : "bg-clay-tint text-clay",
                        )}
                      >
                        {bn(a.percent)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------------- Downloads ---------------- */}
      <section className="rounded-2xl border border-olive/25 bg-olive-wash p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-latin text-[10.5px] font-bold uppercase tracking-brand text-olive-deep">Offline</p>
            <h2 className="mt-1 text-[15px] font-extrabold text-charcoal-deep">{bookMeta.title}</h2>
            <p className="mt-1 text-[12px] text-charcoal-soft">
              মাঠে ইন্টারনেট না থাকলেও পড়ার জন্য পুরো বইটি ডাউনলোড করে রাখুন।
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/shanta-life-ebook.pdf"
              download
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-charcoal px-4 text-[12.5px] font-bold text-white transition hover:bg-charcoal-deep"
            >
              <IconFilePdf className="h-4 w-4" /> PDF
            </a>
            <a
              href="/shanta-life-ebook.docx"
              download
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-charcoal/20 bg-white px-4 text-[12.5px] font-bold text-charcoal transition hover:border-olive"
            >
              <IconFileWord className="h-4 w-4" /> Word
            </a>
            <Link
              to="/book"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-charcoal/20 bg-white px-4 text-[12.5px] font-bold text-charcoal transition hover:border-olive"
            >
              <IconBook className="h-4 w-4" /> অনলাইন বই
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
