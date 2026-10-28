import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, navigate, useRoute } from "@/lib/router";
import {
  bootstrap,
  findQuiz,
  hasRemote,
  learnerKey,
  newAttemptId,
  recordAttempt,
  saveLearner,
  useHub,
} from "@/lib/hub";
import { bn, mmss } from "@/lib/format";
import {
  IconArrowRight,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconTrophy,
} from "@/components/icons";
import { Alert, Badge, Button, Card, Field, Input, Select, Spinner, toast } from "@/components/hub/ui";
import { cn } from "@/utils/cn";
import type { Attempt, Learner } from "@/lib/types";

export default function TakeQuiz({ quizId, slug: slugProp }: { quizId: string; slug?: string }) {
  const { search } = useRoute();
  const slug = slugProp ?? search.get("slug") ?? "";
  const learner = useHub((s) => s.learner);
  const custom = useHub((s) => s.customQuizzes);
  const activations = useHub((s) => s.activations);
  const supervisors = useHub((s) => s.supervisors);
  const zones = useHub((s) => s.zones);

  const [retrying, setRetrying] = useState(false);
  const quiz = useMemo(() => findQuiz(quizId), [quizId, custom]);
  const activation = activations.find((a) => a.slug === slug);

  const [phase, setPhase] = useState<"intro" | "running">("intro");
  const [identity, setIdentity] = useState<Learner>({ ...learner });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const startedAtRef = useRef<string>("");
  const submittedRef = useRef(false);

  // A quiz that lives in the sheet may not be in memory yet on a hard refresh.
  useEffect(() => {
    if (quiz || !hasRemote()) return;
    let cancelled = false;
    setRetrying(true);
    void bootstrap().then(() => {
      if (!cancelled) setRetrying(false);
    });
    return () => {
      cancelled = true;
    };
  }, [quiz]);

  const total = quiz?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;

  const submit = useCallback(
    (auto = false) => {
      if (!quiz || submittedRef.current) return;
      submittedRef.current = true;

      let score = 0;
      quiz.questions.forEach((q) => {
        if (answers[q.id] === q.correct) score += 1;
      });
      const percent = total ? Math.round((score / total) * 100) : 0;
      const submittedAt = new Date().toISOString();
      const startedAt = startedAtRef.current || submittedAt;
      const duration = Math.max(1, Math.round((Date.parse(submittedAt) - Date.parse(startedAt)) / 1000));

      const attempt: Attempt = {
        id: newAttemptId(),
        quizId: quiz.id,
        quizTitle: quiz.title,
        learnerName: identity.name.trim(),
        mobile: identity.mobile.trim(),
        employeeId: identity.employeeId.trim(),
        supervisor: identity.supervisor,
        zone: identity.zone,
        score,
        total,
        percent,
        passed: percent >= quiz.passMark,
        answers,
        startedAt,
        submittedAt,
        durationSeconds: duration,
        sourceSlug: slug || undefined,
        synced: false,
      };

      recordAttempt(attempt);
      saveLearner({ ...identity, name: identity.name.trim() });
      if (auto) toast("সময় শেষ — উত্তর স্বয়ংক্রিয়ভাবে জমা হয়েছে", "info");
      navigate(`/assessment/result/${attempt.id}`, { replace: true });
    },
    [quiz, answers, total, identity, slug],
  );

  // Countdown timer for scheduled activations.
  useEffect(() => {
    if (phase !== "running" || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      submit(true);
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, secondsLeft, submit]);

  if (!quiz) {
    return (
      <Card className="p-10 text-center">
        {retrying ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner />
            <p className="text-[13px] font-semibold text-charcoal-soft">প্রশ্নগুলো লোড হচ্ছে…</p>
          </div>
        ) : (
          <>
            <p className="text-[15px] font-extrabold text-charcoal-deep">এই অ্যাসেসমেন্টটি পাওয়া যায়নি</p>
            <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-charcoal-soft">
              লিংকটি পুরনো হতে পারে, অথবা ট্রেনার কুইজটি মুছে দিয়েছেন। অ্যাসেসমেন্ট লাইব্রেরি থেকে নতুন করে শুরু করুন।
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="primary" size="sm" onClick={() => navigate("/assessment")}>
                অ্যাসেসমেন্ট লাইব্রেরি
              </Button>
            </div>
          </>
        )}
      </Card>
    );
  }

  if (activation?.status === "closed" && phase === "intro") {
    return (
      <Card className="p-10 text-center">
        <Badge tone="clay">বন্ধ</Badge>
        <p className="mt-3 text-[15px] font-extrabold text-charcoal-deep">এই অ্যাসেসমেন্টটি বন্ধ হয়ে গেছে</p>
        <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-charcoal-soft">
          “{activation.quizTitle}” — {activation.purpose || "নির্ধারিত সময়সীমা"}। নতুন লিংকের জন্য ট্রেনারের সাথে যোগাযোগ করুন।
        </p>
        <div className="mt-5 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => navigate("/assessment")}>
            অন্য অ্যাসেসমেন্ট দেখুন
          </Button>
        </div>
      </Card>
    );
  }

  /* ---------------- Intro / identity ------------- */
  if (phase === "intro") {
    const start = () => {
      const next: Record<string, string> = {};
      if (!identity.name.trim()) next.name = "আপনার নাম লিখুন";
      if (!/^01[3-9]\d{8}$/.test(identity.mobile.trim()))
        next.mobile = "১১ ডিজিটের সচল মোবাইল নম্বর দিন (যেমন 01712345678)";
      setErrors(next);
      if (Object.keys(next).length) return;

      startedAtRef.current = new Date().toISOString();
      submittedRef.current = false;
      if (activation && activation.durationMinutes > 0) setSecondsLeft(activation.durationMinutes * 60);
      setPhase("running");
      window.scrollTo({ top: 0 });
    };

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center gap-2 text-[11.5px] font-semibold text-charcoal/50">
          <Link to="/assessment" className="hover:text-olive-deep">
            অ্যাসেসমেন্ট
          </Link>
          <IconChevronRight className="h-3 w-3" />
          <span className="text-charcoal-deep">শুরু করুন</span>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-charcoal/10 bg-gradient-to-br from-olive-wash to-shell p-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="olive">{quiz.set || quiz.product}</Badge>
              {activation && <Badge tone="sunset">ট্রেনার নির্ধারিত</Badge>}
            </div>
            <h1 className="text-[1.35rem] font-extrabold leading-snug text-charcoal-deep">{quiz.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] font-semibold text-charcoal-soft">
              <span className="inline-flex items-center gap-1.5">
                <IconTrophy className="h-4 w-4 text-olive" /> {bn(total)}টি প্রশ্ন
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconCheck className="h-4 w-4 text-forest" /> পাস মার্ক {bn(quiz.passMark)}%
              </span>
              {activation && activation.durationMinutes > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <IconClock className="h-4 w-4 text-sunset-deep" /> {bn(activation.durationMinutes)} মিনিট
                </span>
              )}
            </div>
          </div>

          <div className="space-y-5 p-6">
            <Alert tone="steel" title="শুরুর আগে জেনে নিন">
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>প্রতিটি প্রশ্নে একটিই সঠিক উত্তর — নিশ্চিত না হলে সেরা যুক্তিটি বেছে নিন।</li>
                <li>উত্তর জমা দিলেই স্কোর ও প্রতিটি প্রশ্নের ব্যাখ্যা দেখতে পাবেন।</li>
                <li>আপনার নাম ও মোবাইল নম্বর ট্রেনারের রিপোর্টে যাবে, তাই সঠিক তথ্য দিন।</li>
              </ul>
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="পূর্ণ নাম" required error={errors.name}>
                <Input
                  value={identity.name}
                  onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                  placeholder="যেমন: মো. আরিফুল ইসলাম"
                  autoComplete="name"
                />
              </Field>
              <Field label="মোবাইল নম্বর" required error={errors.mobile} hint="১১ ডিজিট, 01XXXXXXXXX">
                <Input
                  value={identity.mobile}
                  onChange={(e) => setIdentity({ ...identity, mobile: e.target.value })}
                  placeholder="01712345678"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </Field>
              <Field label="এমপ্লয়ি আইডি">
                <Input
                  value={identity.employeeId}
                  onChange={(e) => setIdentity({ ...identity, employeeId: e.target.value })}
                  placeholder="যেমন: SLI-1042"
                />
              </Field>
              <Field label="পদবি">
                <Input
                  value={identity.designation}
                  onChange={(e) => setIdentity({ ...identity, designation: e.target.value })}
                  placeholder="যেমন: ফিল্ড অফিসার"
                />
              </Field>
              <Field label="সুপারভাইজার">
                {supervisors.length ? (
                  <Select
                    value={identity.supervisor}
                    onChange={(e) => setIdentity({ ...identity, supervisor: e.target.value })}
                  >
                    <option value="">— নির্বাচন করুন —</option>
                    {supervisors.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    value={identity.supervisor}
                    onChange={(e) => setIdentity({ ...identity, supervisor: e.target.value })}
                    placeholder="সুপারভাইজারের নাম"
                  />
                )}
              </Field>
              <Field label="জোন">
                {zones.length ? (
                  <Select value={identity.zone} onChange={(e) => setIdentity({ ...identity, zone: e.target.value })}>
                    <option value="">— নির্বাচন করুন —</option>
                    {zones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    value={identity.zone}
                    onChange={(e) => setIdentity({ ...identity, zone: e.target.value })}
                    placeholder="যেমন: ঢাকা উত্তর"
                  />
                )}
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-charcoal/10 pt-4">
              <p className="text-[11.5px] text-charcoal/50">
                আইডি: <span className="font-latin">{learnerKey()}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigate("/assessment")}>
                  বাতিল
                </Button>
                <Button variant="primary" onClick={start}>
                  শুরু করুন <IconArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /* ---------------- Running ------------- */
  const question = quiz.questions[index];
  const isLast = index === total - 1;
  const progress = Math.round(((index + 1) / total) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-24">
      <div className="sticky top-16 z-20 rounded-xl border border-charcoal/10 bg-shell/95 p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[12px] font-extrabold text-charcoal-deep">{quiz.title}</p>
            <p className="text-[11px] text-charcoal/50">
              প্রশ্ন {bn(index + 1)} / {bn(total)} · উত্তর দেওয়া {bn(answeredCount)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {secondsLeft !== null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-latin text-[12px] font-extrabold tabular-nums",
                  secondsLeft <= 60 ? "bg-clay-tint text-clay" : "bg-charcoal/5 text-charcoal",
                )}
              >
                <IconClock className="h-3.5 w-3.5" /> {mmss(secondsLeft)}
              </span>
            )}
            <Button size="sm" variant="accent" onClick={() => submit(false)}>
              জমা দিন
            </Button>
          </div>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-charcoal/10">
          <div className="h-full bg-olive transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <p className="font-latin text-[10.5px] font-bold uppercase tracking-brand text-olive">
          Question {bn(index + 1)}
        </p>
        <h2 className="mt-2 text-[15px] font-extrabold leading-[1.75] text-charcoal-deep">{question.prompt}</h2>

        <div className="mt-5 space-y-2">
          {question.options.map((option, i) => {
            const selected = answers[question.id] === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: i }))}
                aria-pressed={selected}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-[13px] leading-relaxed transition",
                  selected
                    ? "border-olive bg-olive-wash text-charcoal-deep shadow-sm"
                    : "border-charcoal/12 bg-white text-charcoal hover:border-olive/45 hover:bg-olive-wash/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border font-latin text-[11px] font-extrabold",
                    selected ? "border-olive bg-olive text-white" : "border-charcoal/20 text-charcoal/60",
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0">{option}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <IconChevronLeft className="h-4 w-4" /> আগের
        </Button>

        <div className="hidden flex-wrap justify-center gap-1 sm:flex">
          {quiz.questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`প্রশ্ন ${i + 1}`}
              className={cn(
                "h-7 w-7 rounded-md font-latin text-[11px] font-bold transition",
                i === index
                  ? "bg-charcoal text-white"
                  : answers[q.id] !== undefined
                    ? "bg-olive-tint text-olive-deep"
                    : "bg-white text-charcoal/50 ring-1 ring-charcoal/10 hover:ring-olive/40",
              )}
            >
              {bn(i + 1)}
            </button>
          ))}
        </div>

        {isLast ? (
          <Button variant="accent" onClick={() => submit(false)}>
            জমা দিন <IconCheck className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}>
            পরের <IconChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {answeredCount < total && isLast && (
        <p className="text-center text-[11.5px] text-charcoal/50">
          এখনো {bn(total - answeredCount)}টি প্রশ্নের উত্তর বাকি — জমা দিলে সেগুলো ভুল হিসেবে গণ্য হবে।
        </p>
      )}
    </div>
  );
}
