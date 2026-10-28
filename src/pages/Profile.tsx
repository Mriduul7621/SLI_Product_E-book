import { useState } from "react";
import { Link, navigate } from "@/lib/router";
import { MODULES, PARTS } from "@/data/curriculum";
import {
  averageScore,
  completionRate,
  saveLearner,
  streakDays,
  useHub,
} from "@/lib/hub";
import { bn, bnDate, bnDateTime } from "@/lib/format";
import { IconAward, IconCheck, IconCheckCircle, IconChevronRight, IconStar, IconTrophy } from "@/components/icons";
import { Badge, Button, Card, Field, Input, ProgressBar, ProgressRing, SectionTitle, Select, Stat, toast } from "@/components/hub/ui";
import type { Learner } from "@/lib/types";

export default function Profile() {
  const learner = useHub((s) => s.learner);
  const progress = useHub((s) => s.progress);
  const attempts = useHub((s) => s.attempts);
  const supervisors = useHub((s) => s.supervisors);
  const zones = useHub((s) => s.zones);

  const [form, setForm] = useState<Learner>({ ...learner });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rate = completionRate();
  const streak = streakDays();
  const avg = averageScore();
  const done = MODULES.filter((m) => progress[m.id]?.status === "completed").length;
  const finalPassed = attempts.some((a) => a.quizId === "set-final" && a.passed);

  const badges = [
    { id: "first", label: "প্রথম পদক্ষেপ", desc: "একটি অ্যাসেসমেন্ট সম্পন্ন", earned: attempts.length > 0, icon: IconCheckCircle },
    { id: "five", label: "পাঁচ মডিউল", desc: "৫টি মডিউল পড়া শেষ", earned: done >= 5, icon: IconStar },
    { id: "half", label: "অর্ধেক পথ", desc: "কোর্সের ৫০% সম্পন্ন", earned: rate >= 50, icon: IconAward },
    { id: "streak", label: "নিয়মিত শিক্ষার্থী", desc: "৩ দিন টানা শেখা", earned: streak >= 3, icon: IconTrophy },
    { id: "certified", label: "সার্টিফায়েড", desc: "ফাইনাল সেটে পাস", earned: finalPassed, icon: IconAward },
  ];

  const save = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "নাম লিখুন";
    if (form.mobile && !/^01[3-9]\d{8}$/.test(form.mobile.trim()))
      next.mobile = "১১ ডিজিটের সঠিক নম্বর দিন";
    setErrors(next);
    if (Object.keys(next).length) return;
    saveLearner({ ...form, name: form.name.trim(), mobile: form.mobile.trim() });
    toast("প্রোফাইল সংরক্ষিত হয়েছে");
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-charcoal/10 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-olive to-sunset text-[1.35rem] font-extrabold text-white">
            {(form.name || "শা").trim().slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-latin text-[10.5px] font-bold uppercase tracking-brand text-olive">My profile</p>
            <h1 className="mt-1 text-[1.5rem] font-extrabold tracking-tight text-charcoal-deep">
              {form.name || "আপনার প্রোফাইল"}
            </h1>
            <p className="mt-1 text-[12.5px] text-charcoal-soft">
              {[form.designation, form.zone, form.supervisor].filter(Boolean).join(" · ") ||
                "পদবি, জোন ও সুপারভাইজার যোগ করলে রিপোর্ট আরও নির্ভুল হয়।"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin">
              <Button size="sm" variant="outline">
                অ্যাডমিন
              </Button>
            </Link>
            <Link to="/library">
              <Button size="sm" variant="primary">
                পড়া চালিয়ে যান
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat value={`${bn(rate)}%`} label="কোর্স অগ্রগতি" hint={`${bn(done)}/${bn(MODULES.length)} মডিউল`} tone="olive" />
        <Stat value={bn(attempts.length)} label="অ্যাসেসমেন্ট" hint={`গড় ${bn(avg)}%`} tone="steel" />
        <Stat value={`${bn(streak)} দিন`} label="টানা শেখা" tone="sunset" />
        <Stat value={bn(attempts.filter((a) => a.passed).length)} label="উত্তীর্ণ" hint="পাস মার্ক অর্জিত" tone="forest" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="p-5 sm:p-6">
          <SectionTitle eyebrow="Details" title="তথ্য হালনাগাদ করুন" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="পূর্ণ নাম" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="যেমন: মো. আরিফুল ইসলাম"
                autoComplete="name"
              />
            </Field>
            <Field label="মোবাইল" error={errors.mobile} hint="01XXXXXXXXX">
              <Input
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="01712345678"
                inputMode="numeric"
                autoComplete="tel"
              />
            </Field>
            <Field label="এমপ্লয়ি আইডি">
              <Input
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                placeholder="SLI-1042"
              />
            </Field>
            <Field label="পদবি">
              <Input
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="ফিল্ড অফিসার"
              />
            </Field>
            <Field label="সুপারভাইজার">
              {supervisors.length ? (
                <Select
                  value={form.supervisor}
                  onChange={(e) => setForm({ ...form, supervisor: e.target.value })}
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
                  value={form.supervisor}
                  onChange={(e) => setForm({ ...form, supervisor: e.target.value })}
                  placeholder="সুপারভাইজারের নাম"
                />
              )}
            </Field>
            <Field label="জোন">
              {zones.length ? (
                <Select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}>
                  <option value="">— নির্বাচন করুন —</option>
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={form.zone}
                  onChange={(e) => setForm({ ...form, zone: e.target.value })}
                  placeholder="ঢাকা উত্তর"
                />
              )}
            </Field>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-[11px] leading-relaxed text-charcoal/45">
              তথ্য শুধু প্রশিক্ষণ রিপোর্টে ব্যবহার হবে।
            </p>
            <Button variant="primary" onClick={save}>
              <IconCheck className="h-4 w-4" /> সংরক্ষণ
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <SectionTitle eyebrow="Progress" title="পার্টভিত্তিক অগ্রগতি" />
            <div className="flex flex-wrap items-center gap-6">
              <ProgressRing value={rate} size={118} caption="সম্পূর্ণ" />
              <div className="min-w-[180px] flex-1 space-y-3">
                {PARTS.map((part) => {
                  const modules = MODULES.filter((m) => m.part === part.id);
                  const c = modules.filter((m) => progress[m.id]?.status === "completed").length;
                  return (
                    <div key={part.id}>
                      <div className="mb-1 flex items-center justify-between text-[11.5px]">
                        <span className="font-bold text-charcoal-deep">{part.title}</span>
                        <span className="font-latin tabular-nums text-charcoal/45">
                          {bn(c)}/{bn(modules.length)}
                        </span>
                      </div>
                      <ProgressBar
                        value={(c / modules.length) * 100}
                        tone={part.id === "products" ? "olive" : part.id === "underwriting" ? "sunset" : part.id === "mastery" ? "plum" : "steel"}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionTitle eyebrow="Badges" title="অর্জন" />
            <div className="grid gap-2 sm:grid-cols-2">
              {badges.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      b.earned ? "border-olive/30 bg-olive-wash" : "border-charcoal/10 bg-white opacity-60"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                        b.earned ? "bg-olive text-white" : "bg-charcoal/10 text-charcoal/40"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-extrabold text-charcoal-deep">{b.label}</p>
                      <p className="text-[10.5px] text-charcoal-soft">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <SectionTitle
          eyebrow="History"
          title="ফলাফলের ইতিহাস"
          action={
            attempts.length > 0 ? (
              <Badge tone="charcoal">{bn(attempts.length)}টি রেকর্ড</Badge>
            ) : undefined
          }
        />
        {attempts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-charcoal/20 p-8 text-center">
            <p className="text-[13px] font-bold text-charcoal-deep">এখনো কোনো ফলাফল নেই</p>
            <Link to="/assessment" className="mt-3 inline-block">
              <Button size="sm" variant="accent">
                প্রথম অ্যাসেসমেন্ট দিন
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-charcoal/8">
            {attempts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-latin text-[11px] font-extrabold ${
                    a.passed ? "bg-forest-tint text-forest" : "bg-clay-tint text-clay"
                  }`}
                >
                  {bn(a.percent)}%
                </span>
                <div className="min-w-0 flex-1">
                  <Link to={`/assessment/result/${a.id}`} className="text-[12.5px] font-extrabold text-charcoal-deep hover:text-olive-deep">
                    {a.quizTitle}
                  </Link>
                  <p className="text-[10.5px] text-charcoal/45">
                    {bnDateTime(a.submittedAt)} · {bn(a.score)}/{bn(a.total)} সঠিক
                  </p>
                </div>
                <Badge tone={a.synced ? "forest" : "sunset"}>{a.synced ? "শিটে" : "লোকাল"}</Badge>
                <button
                  type="button"
                  onClick={() => navigate(`/assessment/result/${a.id}`)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-charcoal/15 text-charcoal/50 transition hover:border-olive hover:text-olive-deep"
                  aria-label="ফলাফল দেখুন"
                >
                  <IconChevronRight className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[11px] text-charcoal/45">
          সর্বশেষ পাঠ: {attempts[0] ? bnDate(attempts[0].submittedAt) : "—"}
        </p>
      </Card>
    </div>
  );
}
