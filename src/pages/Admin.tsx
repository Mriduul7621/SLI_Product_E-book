import { useMemo, useState } from "react";
import { Link, navigate } from "@/lib/router";
import {
  HUB_SHEET_ID,
  HUB_SHEET_URL,
  allQuizzes,
  bootstrap,
  deleteQuiz,
  resetLocal,
  saveActivation,
  saveLists,
  saveQuiz,
  setActivationStatus,
  setApiUrl,
  syncNow,
  testConnection,
  useHub,
} from "@/lib/hub";
import { BUILTIN_QUIZZES } from "@/data/curriculum";
import { bn, bnDate, bnDateTime, slugify, uid } from "@/lib/format";
import {
  IconArrowRight,
  IconCheck,
  IconCloud,
  IconCopy,
  IconExternal,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconTrophy,
  IconUsers,
} from "@/components/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  ProgressBar,
  SectionTitle,
  Select,
  Spinner,
  Stat,
  Tabs,
  toast,
} from "@/components/hub/ui";
import { cn } from "@/utils/cn";
import type { Activation, Attempt, Question, Quiz } from "@/lib/types";

const PIN_KEY = "sli_hub_admin_pin";
const DEFAULT_PIN = "2468";

type AdminTab = "overview" | "bank" | "links" | "results" | "lists" | "settings";

export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(PIN_KEY) === "ok");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="p-6 sm:p-8">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-charcoal text-white">
            <IconUsers className="h-5 w-5" />
          </div>
          <h1 className="text-[1.2rem] font-extrabold text-charcoal-deep">ট্রেনার অ্যাক্সেস</h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-charcoal-soft">
            কুইজ তৈরি, শেয়ার লিংক ও ফলাফল দেখতে পিন দিন। এটি শুধু স্ক্রিন-লেভেল গার্ড — আসল নিয়ন্ত্রণ Google Sheet-এর
            শেয়ার সেটিংসে।
          </p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (pin.trim() === DEFAULT_PIN) {
                sessionStorage.setItem(PIN_KEY, "ok");
                setUnlocked(true);
                setError("");
              } else {
                setError("পিনটি সঠিক নয়");
              }
            }}
          >
            <Field label="পিন" error={error} hint={`ডিফল্ট পিন: ${DEFAULT_PIN}`}>
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                type="password"
                inputMode="numeric"
                placeholder="••••"
                autoFocus
              />
            </Field>
            <Button type="submit" block variant="primary">
              প্রবেশ করুন
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const attempts = useHub((s) => s.attempts);
  const activations = useHub((s) => s.activations);
  const custom = useHub((s) => s.customQuizzes);
  const supervisors = useHub((s) => s.supervisors);
  const zones = useHub((s) => s.zones);

  const stats = useMemo(() => {
    const scored = attempts.filter((a) => a.total > 0);
    return {
      total: attempts.length,
      avg: scored.length ? Math.round(scored.reduce((s, a) => s + a.percent, 0) / scored.length) : 0,
      passRate: scored.length
        ? Math.round((scored.filter((a) => a.passed).length / scored.length) * 100)
        : 0,
      learners: new Set(attempts.map((a) => a.mobile || a.learnerName)).size,
    };
  }, [attempts]);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-charcoal/10 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-latin text-[10.5px] font-bold uppercase tracking-brand text-olive">Admin console</p>
            <h1 className="mt-1.5 text-[1.5rem] font-extrabold tracking-tight text-charcoal-deep">
              ট্রেনার ড্যাশবোর্ড
            </h1>
            <p className="mt-1 text-[12.5px] text-charcoal-soft">
              কুইজ ব্যাংক, শেয়ার লিংক, ফলাফল — সব এক জায়গায়। ডেটা যায় Learning Hub শিটে।
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/assessment">
              <Button size="sm" variant="outline">
                <IconTrophy className="h-3.5 w-3.5" /> লার্নার ভিউ
              </Button>
            </Link>
            <a href={HUB_SHEET_URL} target="_blank" rel="noreferrer">
              <Button size="sm" variant="primary">
                <IconExternal className="h-3.5 w-3.5" /> শিট খুলুন
              </Button>
            </a>
          </div>
        </div>
      </header>

      <Tabs<AdminTab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "সারসংক্ষেপ" },
          { id: "bank", label: "কুইজ ব্যাংক", badge: bn(BUILTIN_QUIZZES.length + custom.length) },
          { id: "links", label: "শেয়ার লিংক", badge: bn(activations.length) },
          { id: "results", label: "ফলাফল", badge: bn(attempts.length) },
          { id: "lists", label: "তালিকা" },
          { id: "settings", label: "সেটিংস" },
        ]}
      />

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat value={bn(stats.total)} label="মোট সাবমিশন" icon={<IconTrophy className="h-4 w-4" />} />
            <Stat value={`${bn(stats.avg)}%`} label="গড় স্কোর" tone="olive" icon={<IconCheck className="h-4 w-4" />} />
            <Stat value={`${bn(stats.passRate)}%`} label="পাসের হার" tone="forest" icon={<IconCheck className="h-4 w-4" />} />
            <Stat value={bn(stats.learners)} label="অংশগ্রহণকারী" tone="steel" icon={<IconUsers className="h-4 w-4" />} />
          </div>

          <ConnectionCard />

          <Card className="p-5">
            <SectionTitle eyebrow="Recent" title="সাম্প্রতিক সাবমিশন" />
            {attempts.length === 0 ? (
              <EmptyState
                title="এখনো কোনো সাবমিশন নেই"
                description="একটি শেয়ার লিংক তৈরি করে ফিল্ড ফোর্সের সাথে পাঠান — ফলাফল এখানে জমা হবে।"
                action={
                  <Button size="sm" variant="accent" onClick={() => setTab("links")}>
                    লিংক তৈরি করুন <IconArrowRight className="h-3.5 w-3.5" />
                  </Button>
                }
              />
            ) : (
              <ResultTable rows={attempts.slice(0, 8)} compact />
            )}
          </Card>
        </div>
      )}

      {tab === "bank" && <QuizBank />}
      {tab === "links" && <ShareLinks />}
      {tab === "results" && (
        <Card className="p-5">
          <SectionTitle
            eyebrow="Results"
            title="সব ফলাফল"
            description="নাম, স্কোর ও সময় অনুযায়ী দেখুন। CSV ডাউনলোড করে এক্সেলে রিপোর্ট বানাতে পারবেন।"
            action={<ExportButton />}
          />
          {attempts.length === 0 ? (
            <EmptyState title="কোনো ফলাফল নেই" description="অংশগ্রহণকারীরা সাবমিট করলে এখানে দেখা যাবে।" />
          ) : (
            <ResultTable rows={attempts} />
          )}
        </Card>
      )}
      {tab === "lists" && <ListEditor />}
      {tab === "settings" && <SettingsPanel />}

      <p className="text-center text-[11px] text-charcoal/40">
        শিট আইডি: <span className="font-latin">{HUB_SHEET_ID}</span> · সুপারভাইজার {bn(supervisors.length)} · জোন{" "}
        {bn(zones.length)}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Connection                                                          */
/* ------------------------------------------------------------------ */

function ConnectionCard() {
  const apiUrl = useHub((s) => s.settings.apiUrl);
  const queue = useHub((s) => s.queue.length);
  const status = useHub((s) => s.sync.status);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setBusy(true);
    const res = await testConnection();
    setBusy(false);
    toast(res.message, res.ok ? "success" : "error");
    if (res.ok) {
      await bootstrap();
      syncNow();
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-9 w-9 place-items-center rounded-lg",
                apiUrl ? "bg-forest-tint text-forest" : "bg-sunset-soft text-sunset-deep",
              )}
            >
              <IconCloud className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-extrabold text-charcoal-deep">
                {apiUrl ? "Google Sheet সংযুক্ত" : "লোকাল মোড"}
              </p>
              <p className="text-[11px] text-charcoal-soft">
                {apiUrl ? "সব সাবমিশন সরাসরি শিটে যাচ্ছে" : "ডেটা শুধু এই ব্রাউজারে — URL বসিয়ে সিঙ্ক চালু করুন"}
              </p>
            </div>
          </div>
          {queue > 0 && (
            <p className="mt-3 text-[11.5px] font-semibold text-sunset-deep">
              {bn(queue)}টি রেকর্ড অপেক্ষমাণ{status === "error" ? " · শেষ চেষ্টা ব্যর্থ" : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void check()} disabled={!apiUrl || busy}>
            {busy ? <Spinner className="h-3.5 w-3.5" /> : <IconRefresh className="h-3.5 w-3.5" />} কানেকশন টেস্ট
          </Button>
          <Button size="sm" variant="primary" onClick={() => syncNow()} disabled={!apiUrl || queue === 0}>
            সিঙ্ক করুন
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Quiz bank                                                           */
/* ------------------------------------------------------------------ */

function QuizBank() {
  const custom = useHub((s) => s.customQuizzes);
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState<string>(BUILTIN_QUIZZES[0]?.id ?? "");
  const [confirmDelete, setConfirmDelete] = useState<string>("");
  const [editing, setEditing] = useState<Quiz | null>(null);

  const all = allQuizzes();
  const source = all.find((q) => q.id === sourceId);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle
          eyebrow="Quiz bank"
          title="কুইজ ব্যাংক"
          description={`বইয়ের ${bn(BUILTIN_QUIZZES.length)}টি প্রস্তুত সেট ছাড়াও নিজের কুইজ তৈরি করে শেয়ার করতে পারেন।`}
          action={
            <Button size="sm" variant="accent" onClick={() => setOpen(true)}>
              <IconPlus className="h-3.5 w-3.5" /> নতুন কুইজ
            </Button>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {all.map((q) => (
            <div key={q.id} className="rounded-xl border border-charcoal/12 bg-white p-4">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <Badge tone={q.origin === "custom" ? "plum" : "olive"}>
                  {q.origin === "custom" ? "কাস্টম" : "বিল্ট-ইন"}
                </Badge>
                <span className="font-latin text-[10.5px] font-bold text-charcoal/40">
                  {bn(q.questions.length)} প্রশ্ন
                </span>
              </div>
              <p className="text-[12.5px] font-extrabold leading-snug text-charcoal-deep">{q.title}</p>
              <p className="mt-0.5 text-[11px] text-charcoal-soft">
                {q.product} · পাস {bn(q.passMark)}%
              </p>
              <div className="mt-3 flex gap-1.5">
                <Link to={`/assessment/take/${q.id}`} className="flex-1">
                  <Button size="sm" variant="outline" block>
                    প্রিভিউ
                  </Button>
                </Link>
                {q.origin === "custom" && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setEditing(q)}
                      aria-label={`${q.title} সম্পাদনা করুন`}
                    >
                      সম্পাদনা
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setConfirmDelete(q.id)}
                      aria-label={`${q.title} মুছুন`}
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {custom.length === 0 && (
        <Alert tone="steel" title="কাস্টম কুইজ কীভাবে বানাবেন">
          “নতুন কুইজ” চাপুন → বিল্ট-ইন সেট থেকে প্রশ্ন নিন বা নিজে লিখুন → শেয়ার লিংক তৈরি করে টিমকে পাঠান।
          কাস্টম কুইজ শিটের <span className="font-latin">Quizzes</span> ট্যাবে জমা থাকে।
        </Alert>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="নতুন কুইজ তৈরি করুন"
        wide
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              বাতিল
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const base: Quiz = source
                  ? { ...source, title: `${source.title} (কপি)` }
                  : {
                      id: "",
                      title: "নতুন কুইজ",
                      product: "সাধারণ",
                      set: "কাস্টম",
                      kind: "quiz",
                      passMark: 70,
                      questions: [],
                      origin: "custom",
                    };
                const quiz: Quiz = {
                  ...base,
                  id: uid("quiz"),
                  origin: "custom",
                  createdAt: new Date().toISOString(),
                };
                saveQuiz(quiz);
                setOpen(false);
                setEditing(quiz);
                toast("কুইজ তৈরি হয়েছে — এখন প্রশ্ন যোগ করুন");
              }}
            >
              <IconCheck className="h-3.5 w-3.5" /> কুইজ তৈরি করুন
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="কোন সেট থেকে শুরু করবেন?"
            hint="যেকোনো সেট কপি করে তারপর প্রশ্ন সম্পাদনা করতে পারবেন।"
          >
            <Select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              <option value="__blank">ফাঁকা কুইজ (নিজে প্রশ্ন লিখব)</option>
              {all.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} — {q.questions.length} প্রশ্ন
                </option>
              ))}
            </Select>
          </Field>
          {source && (
            <div className="rounded-xl border border-charcoal/10 bg-shell p-3 text-[11.5px] leading-relaxed text-charcoal-soft">
              <p className="font-bold text-charcoal-deep">প্রশ্নের সংখ্যা: {bn(source.questions.length)}</p>
              <p className="mt-1">পাস মার্ক: {bn(source.passMark)}% · ধরন: {source.kind === "quiz" ? "কুইজ" : "সার্ভে"}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {source.questions.slice(0, 3).map((q) => (
                  <li key={q.id} className="line-clamp-1">
                    {q.prompt}
                  </li>
                ))}
                {source.questions.length > 3 && <li>…আরও {bn(source.questions.length - 3)}টি</li>}
              </ul>
            </div>
          )}
        </div>
      </Modal>

      <QuizEditor quiz={editing} onClose={() => setEditing(null)} />

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete("")}
        title="কুইজ মুছে ফেলবেন?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete("")}>
              না
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                deleteQuiz(confirmDelete);
                setConfirmDelete("");
                toast("কুইজ মুছে ফেলা হয়েছে", "info");
              }}
            >
              হ্যাঁ, মুছুন
            </Button>
          </>
        }
      >
        <p className="text-[12.5px] leading-relaxed text-charcoal-soft">
          এই কুইজটি শিট থেকেও মুছে যাবে। পুরনো ফলাফল সংরক্ষিত থাকবে।
        </p>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quiz editor                                                         */
/* ------------------------------------------------------------------ */

function QuizEditor({ quiz, onClose }: { quiz: Quiz | null; onClose: () => void }) {
  const [draft, setDraft] = useState<Quiz | null>(quiz);
  const [error, setError] = useState("");

  // Re-sync whenever a different quiz is opened.
  const [draftId, setDraftId] = useState<string | null>(quiz?.id ?? null);
  if (quiz && quiz.id !== draftId) {
    setDraftId(quiz.id);
    setDraft(quiz);
    setError("");
  }
  if (!quiz || !draft) return null;

  const patch = (changes: Partial<Quiz>) => setDraft({ ...draft, ...changes });

  const patchQuestion = (index: number, changes: Partial<Question>) => {
    const questions = draft.questions.map((q, i) => (i === index ? { ...q, ...changes } : q));
    patch({ questions });
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= draft.questions.length) return;
    const questions = [...draft.questions];
    const [item] = questions.splice(index, 1);
    questions.splice(target, 0, item);
    patch({ questions });
  };

  const addQuestion = () => {
    patch({
      questions: [
        ...draft.questions,
        {
          id: uid("q"),
          prompt: "",
          options: ["", "", "", ""],
          correct: 0,
          explanation: "",
          type: "MCQ",
        },
      ],
    });
  };

  const save = () => {
    if (!draft.title.trim()) {
      setError("কুইজের একটি শিরোনাম দিন");
      return;
    }
    if (draft.questions.length === 0) {
      setError("অন্তত একটি প্রশ্ন যোগ করুন");
      return;
    }
    for (let i = 0; i < draft.questions.length; i++) {
      const q = draft.questions[i];
      const filled = q.options.filter((o) => o.trim());
      if (!q.prompt.trim()) {
        setError(`প্রশ্ন ${i + 1}: প্রশ্নের লেখা দিন`);
        return;
      }
      if (filled.length < 2) {
        setError(`প্রশ্ন ${i + 1}: অন্তত দুটি উত্তর লিখুন`);
        return;
      }
      if (!q.options[q.correct]?.trim()) {
        setError(`প্রশ্ন ${i + 1}: সঠিক উত্তর হিসেবে খালি ঘর বাছা হয়েছে`);
        return;
      }
    }
    setError("");
    saveQuiz({ ...draft, questions: draft.questions.map((q, i) => ({ ...q, id: q.id || `q${i + 1}` })) });
    toast("কুইজ সংরক্ষিত হয়েছে");
    onClose();
  };

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="কুইজ সম্পাদনা"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            বাতিল
          </Button>
          <Button variant="primary" size="sm" onClick={save}>
            <IconCheck className="h-3.5 w-3.5" /> সংরক্ষণ করুন
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="শিরোনাম" required>
            <Input value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
          <Field label="প্রোডাক্ট / বিষয়">
            <Input value={draft.product} onChange={(e) => patch({ product: e.target.value })} />
          </Field>
          <Field label="পাস মার্ক (%)" hint="০–১০০">
            <Input
              type="number"
              min={0}
              max={100}
              value={draft.passMark}
              onChange={(e) =>
                patch({ passMark: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
              }
            />
          </Field>
          <Field label="সেট / গ্রুপ">
            <Input value={draft.set} onChange={(e) => patch({ set: e.target.value })} />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-charcoal/10 pt-4">
          <p className="text-[12.5px] font-extrabold text-charcoal-deep">
            প্রশ্ন ({bn(draft.questions.length)})
          </p>
          <Button size="sm" variant="outline" onClick={addQuestion}>
            <IconPlus className="h-3.5 w-3.5" /> প্রশ্ন যোগ
          </Button>
        </div>

        {draft.questions.length === 0 && (
          <p className="rounded-lg border border-dashed border-charcoal/20 px-4 py-6 text-center text-[12.5px] text-charcoal-soft">
            এখনো কোনো প্রশ্ন নেই — “প্রশ্ন যোগ” চাপুন।
          </p>
        )}

        <ol className="space-y-4">
          {draft.questions.map((q, index) => (
            <li key={q.id} className="rounded-xl border border-charcoal/12 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-latin text-[11px] font-extrabold text-charcoal/45">
                  প্রশ্ন {bn(index + 1)}
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => move(index, -1)} aria-label="উপরে সরান">
                    ↑
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => move(index, 1)} aria-label="নিচে সরান">
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => patch({ questions: draft.questions.filter((_, i) => i !== index) })}
                    aria-label="প্রশ্ন মুছুন"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <textarea
                value={q.prompt}
                onChange={(e) => patchQuestion(index, { prompt: e.target.value })}
                rows={2}
                placeholder="প্রশ্নের লেখা"
                className="w-full rounded-lg border border-charcoal/20 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
              />

              <div className="mt-2 space-y-2">
                {q.options.map((option, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => patchQuestion(index, { correct: oi })}
                      aria-label={`বিকল্প ${oi + 1} সঠিক হিসেবে চিহ্নিত করুন`}
                      aria-pressed={q.correct === oi}
                      className={
                        q.correct === oi
                          ? "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-[11px] font-bold text-white"
                          : "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-charcoal/20 text-[11px] font-bold text-charcoal/50"
                      }
                    >
                      {String.fromCharCode(65 + oi)}
                    </button>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const options = [...q.options];
                        options[oi] = e.target.value;
                        patchQuestion(index, { options });
                      }}
                      placeholder={`বিকল্প ${String.fromCharCode(65 + oi)}`}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-2 flex gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => patchQuestion(index, { options: [...q.options, ""] })}
                >
                  <IconPlus className="h-3 w-3" /> বিকল্প
                </Button>
                {q.options.length > 2 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const options = q.options.slice(0, -1);
                      patchQuestion(index, { options, correct: Math.min(q.correct, options.length - 1) });
                    }}
                  >
                    শেষটি বাদ
                  </Button>
                )}
              </div>

              <textarea
                value={q.explanation ?? ""}
                onChange={(e) => patchQuestion(index, { explanation: e.target.value })}
                rows={2}
                placeholder="ব্যাখ্যা (ফলাফলে দেখা যাবে)"
                className="mt-2 w-full rounded-lg border border-charcoal/20 bg-white px-3 py-2 text-[12.5px] outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
              />
            </li>
          ))}
        </ol>

        {error && <Alert tone="clay">{error}</Alert>}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Share links                                                         */
/* ------------------------------------------------------------------ */

function ShareLinks() {
  const activations = useHub((s) => s.activations);
  const custom = useHub((s) => s.customQuizzes);
  const [open, setOpen] = useState(false);
  const [quizId, setQuizId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState("0");
  const quizzes = allQuizzes();

  const shareUrl = (slug: string) =>
    `${window.location.origin}${window.location.pathname}?slug=${encodeURIComponent(slug)}`;

  const create = () => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      toast("আগে একটি কুইজ বাছুন", "error");
      return;
    }
    const activation: Activation = {
      slug: `${slugify(quiz.title).slice(0, 22)}-${Math.random().toString(36).slice(2, 6)}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      purpose: purpose.trim(),
      date,
      message: message.trim(),
      durationMinutes: Number(duration) || 0,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    saveActivation(activation);
    setOpen(false);
    setPurpose("");
    setMessage("");
    toast("লিংক তৈরি হয়েছে — কপি করে শেয়ার করুন");
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle
          eyebrow="Activations"
          title="শেয়ার লিংক"
          description="লিংক খুললেই লার্নার সরাসরি কুইজে ঢুকবে — অ্যাপ ইনস্টল বা লগইন লাগবে না।"
          action={
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                setQuizId(quizzes[0]?.id ?? "");
                setOpen(true);
              }}
            >
              <IconPlus className="h-3.5 w-3.5" /> নতুন লিংক
            </Button>
          }
        />

        {activations.length === 0 ? (
          <EmptyState
            icon={<IconUsers className="h-5 w-5" />}
            title="এখনো কোনো শেয়ার লিংক নেই"
            description="লিংক তৈরি করলে সেটি শিটে জমা হবে এবং ফিল্ড ফোর্স যেকোনো ডিভাইস থেকে অংশ নিতে পারবে।"
            action={
              <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
                প্রথম লিংক তৈরি করুন
              </Button>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {activations.map((act) => {
              const url = shareUrl(act.slug);
              const quiz = quizzes.find((q) => q.id === act.quizId);
              return (
                <div
                  key={act.slug}
                  className="flex flex-col gap-3 rounded-xl border border-charcoal/12 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge tone={act.status === "active" ? "forest" : "charcoal"}>
                        {act.status === "active" ? "সক্রিয়" : "বন্ধ"}
                      </Badge>
                      <span className="text-[10.5px] font-semibold text-charcoal/45">{bnDate(act.date)}</span>
                      {act.durationMinutes > 0 && (
                        <span className="text-[10.5px] font-semibold text-charcoal/45">
                          {bn(act.durationMinutes)} মিনিট
                        </span>
                      )}
                      <span className="font-latin text-[10px] text-charcoal/35">/{act.slug}</span>
                    </div>
                    <p className="text-[13px] font-extrabold text-charcoal-deep">{act.quizTitle}</p>
                    <p className="text-[11.5px] text-charcoal-soft">
                      {act.purpose || "উদ্দেশ্য লেখা হয়নি"} · {bn(quiz?.questions.length ?? 0)} প্রশ্ন
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard
                          ?.writeText(url)
                          .then(() => toast("লিংক কপি হয়েছে"))
                          .catch(() => toast("কপি করা যায়নি — ম্যানুয়ালি কপি করুন", "error"));
                      }}
                    >
                      <IconCopy className="h-3.5 w-3.5" /> কপি
                    </Button>
                    <Link to={`/assessment/take/${act.quizId}?slug=${encodeURIComponent(act.slug)}`}>
                      <Button size="sm" variant="outline">
                        খুলুন
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant={act.status === "active" ? "danger" : "olive"}
                      onClick={() => {
                        setActivationStatus(act.slug, act.status === "active");
                        toast(act.status === "active" ? "লিংক বন্ধ করা হয়েছে" : "লিংক আবার চালু হয়েছে", "info");
                      }}
                    >
                      {act.status === "active" ? "বন্ধ" : "চালু"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="নতুন শেয়ার লিংক"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              বাতিল
            </Button>
            <Button variant="primary" size="sm" onClick={create}>
              <IconCheck className="h-3.5 w-3.5" /> লিংক তৈরি
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="কুইজ" required>
            <Select value={quizId} onChange={(e) => setQuizId(e.target.value)}>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} · {q.questions.length} প্রশ্ন
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="তারিখ" required>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="সময়সীমা (মিনিট)" hint="০ = কোনো সময়সীমা নেই">
              <Input
                type="number"
                min={0}
                max={180}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </Field>
          </div>
          <Field label="উদ্দেশ্য">
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="যেমন: সপ্তাহিক প্রোডাক্ট নলেজ চেক"
            />
          </Field>
          <Field label="লার্নারকে দেখানো বার্তা">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-charcoal/20 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
              placeholder="আজকের ১৫ মিনিটের মূল্যায়ন — মনোযোগ দিয়ে উত্তর দিন।"
            />
          </Field>
          {custom.length === 0 && (
            <Alert tone="steel">
              কাস্টম কুইজ নেই — কুইজ ব্যাংক থেকে প্রথমে একটি কুইজ তৈরি করতে পারেন, অথবা বিল্ট-ইন সেটই শেয়ার করুন।
            </Alert>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

function ResultTable({ rows, compact }: { rows: Attempt[]; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const filtered = rows.filter((r) =>
    query
      ? [r.learnerName, r.mobile, r.quizTitle, r.supervisor, r.zone]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      : true,
  );

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="max-w-xs">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম / মোবাইল / কুইজ খুঁজুন…"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-charcoal/10">
        <table className="w-full min-w-[640px] text-left text-[12px]">
          <thead className="bg-shell-deep/60 text-[10.5px] uppercase tracking-wide text-charcoal/50">
            <tr>
              <th className="px-3 py-2.5 font-bold">নাম</th>
              <th className="px-3 py-2.5 font-bold">কুইজ</th>
              <th className="px-3 py-2.5 font-bold">স্কোর</th>
              <th className="hidden px-3 py-2.5 font-bold sm:table-cell">সময়</th>
              <th className="px-3 py-2.5 font-bold">সিঙ্ক</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-charcoal/8 hover:bg-shell/60">
                <td className="px-3 py-2.5">
                  <p className="font-bold text-charcoal-deep">{r.learnerName || "—"}</p>
                  <p className="font-latin text-[10.5px] text-charcoal/45">{r.mobile || r.employeeId || "—"}</p>
                </td>
                <td className="max-w-[220px] px-3 py-2.5">
                  <Link to={`/assessment/result/${r.id}`} className="line-clamp-1 font-semibold text-charcoal hover:text-olive-deep">
                    {r.quizTitle}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 font-latin text-[11px] font-extrabold",
                      r.passed ? "bg-forest-tint text-forest" : "bg-clay-tint text-clay",
                    )}
                  >
                    {bn(r.percent)}%
                  </span>
                  <span className="ml-1.5 font-latin text-[10.5px] text-charcoal/40">
                    {bn(r.score)}/{bn(r.total)}
                  </span>
                </td>
                <td className="hidden px-3 py-2.5 text-charcoal-soft sm:table-cell">{bnDateTime(r.submittedAt)}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={r.synced ? "forest" : "sunset"}>{r.synced ? "শিটে" : "লোকাল"}</Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[12px] text-charcoal/45">
                  কোনো রেকর্ড মেলেনি
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExportButton() {
  const attempts = useHub((s) => s.attempts);
  const download = () => {
    const header = ["Name", "Mobile", "Employee ID", "Supervisor", "Zone", "Quiz", "Score", "Total", "Percent", "Passed", "Submitted At"];
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      header.join(","),
      ...attempts.map((a) =>
        [
          a.learnerName,
          a.mobile,
          a.employeeId,
          a.supervisor,
          a.zone,
          a.quizTitle,
          String(a.score),
          String(a.total),
          String(a.percent),
          a.passed ? "Yes" : "No",
          a.submittedAt,
        ]
          .map((v) => escape(v ?? ""))
          .join(","),
      ),
    ].join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learning-hub-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV ডাউনলোড হয়েছে");
  };
  return (
    <Button size="sm" variant="outline" onClick={download} disabled={!attempts.length}>
      <IconArrowRight className="h-3.5 w-3.5" /> CSV ডাউনলোড
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Lists (supervisors & zones)                                          */
/* ------------------------------------------------------------------ */

function ListEditor() {
  const supervisors = useHub((s) => s.supervisors);
  const zones = useHub((s) => s.zones);
  const [sup, setSup] = useState("");
  const [zone, setZone] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <SectionTitle eyebrow="Supervisors" title="সুপারভাইজার তালিকা" />
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const name = sup.trim();
            if (!name) return;
            if (supervisors.includes(name)) {
              toast("এই নাম আগেই আছে", "info");
              return;
            }
            saveLists({ supervisors: [...supervisors, name], zones });
            setSup("");
            toast("সুপারভাইজার যোগ হয়েছে");
          }}
        >
          <Input value={sup} onChange={(e) => setSup(e.target.value)} placeholder="নাম লিখুন" />
          <Button type="submit" variant="primary">
            <IconPlus className="h-4 w-4" />
          </Button>
        </form>
        <ul className="mt-4 space-y-1.5">
          {supervisors.map((name) => (
            <li key={name} className="flex items-center justify-between rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-[12.5px]">
              <span className="font-semibold text-charcoal-deep">{name}</span>
              <button
                type="button"
                aria-label={`${name} সরান`}
                onClick={() => saveLists({ supervisors: supervisors.filter((x) => x !== name), zones })}
                className="text-charcoal/35 transition hover:text-clay"
              >
                <IconTrash className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {!supervisors.length && <p className="text-[11.5px] text-charcoal/45">এখনো কেউ যোগ হয়নি।</p>}
        </ul>
      </Card>

      <Card className="p-5">
        <SectionTitle eyebrow="Zones" title="জোন তালিকা" />
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const name = zone.trim();
            if (!name) return;
            if (zones.includes(name)) {
              toast("এই জোন আগেই আছে", "info");
              return;
            }
            saveLists({ supervisors, zones: [...zones, name] });
            setZone("");
            toast("জোন যোগ হয়েছে");
          }}
        >
          <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="যেমন: ঢাকা উত্তর" />
          <Button type="submit" variant="primary">
            <IconPlus className="h-4 w-4" />
          </Button>
        </form>
        <ul className="mt-4 space-y-1.5">
          {zones.map((name) => (
            <li key={name} className="flex items-center justify-between rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-[12.5px]">
              <span className="font-semibold text-charcoal-deep">{name}</span>
              <button
                type="button"
                aria-label={`${name} সরান`}
                onClick={() => saveLists({ supervisors, zones: zones.filter((x) => x !== name) })}
                className="text-charcoal/35 transition hover:text-clay"
              >
                <IconTrash className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {!zones.length && <p className="text-[11.5px] text-charcoal/45">এখনো কোনো জোন যোগ হয়নি।</p>}
        </ul>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function SettingsPanel() {
  const apiUrl = useHub((s) => s.settings.apiUrl);
  const [value, setValue] = useState(apiUrl);
  const queue = useHub((s) => s.queue.length);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed && !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(trimmed)) {
      toast("URL শেষে /exec থাকতে হবে — Deploy → Web app লিংকটি দিন", "error");
      return;
    }
    setApiUrl(trimmed);
    if (!trimmed) {
      toast("লোকাল মোডে চলছে", "info");
      return;
    }
    setBusy(true);
    const res = await testConnection();
    setBusy(false);
    if (res.ok) {
      await bootstrap();
      syncNow();
      toast("সংযুক্ত হয়েছে — ডেটা শিটে যাচ্ছে");
    } else {
      toast(`সংযোগ ব্যর্থ: ${res.message}`, "error");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle
          eyebrow="Connection"
          title="Google Sheet সংযোগ"
          description="Learning Hub স্প্রেডশিটেই সব ডেটা থাকবে। Apps Script ওয়েব অ্যাপ ডিপ্লয় করে URL-টি এখানে বসান।"
        />
        <div className="space-y-3">
          <Field
            label="Apps Script Web App URL"
            hint="উদাহরণ: https://script.google.com/macros/s/AKfy…/exec"
          >
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://script.google.com/macros/s/…/exec"
              className="font-latin"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={() => void save()} disabled={busy}>
              {busy ? <Spinner className="h-3.5 w-3.5" /> : <IconCheck className="h-3.5 w-3.5" />} সেভ ও টেস্ট
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue("");
                setApiUrl("");
                toast("URL সরানো হয়েছে — লোকাল মোড", "info");
              }}
            >
              URL সরান
            </Button>
            <a href={HUB_SHEET_URL} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm">
                <IconExternal className="h-3.5 w-3.5" /> Learning Hub শিট
              </Button>
            </a>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle eyebrow="Backlog" title="অপেক্ষমাণ রেকর্ড" />
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[180px] flex-1">
            <ProgressBar value={queue === 0 ? 100 : 20} tone={queue === 0 ? "forest" : "sunset"} />
            <p className="mt-2 text-[11.5px] text-charcoal-soft">
              {queue === 0 ? "সব রেকর্ড সিঙ্ক হয়েছে" : `${bn(queue)}টি রেকর্ড এখনো শিটে যায়নি`}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => syncNow()} disabled={!apiUrl || queue === 0}>
            <IconRefresh className="h-3.5 w-3.5" /> এখনই সিঙ্ক
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle eyebrow="Setup" title="একবারের সেটআপ" />
        <ol className="space-y-2 text-[12.5px] leading-relaxed text-charcoal-soft">
          <li>
            <span className="font-bold text-charcoal-deep">১.</span> Learning Hub স্প্রেডশিট খুলুন →{" "}
            <span className="font-latin">Extensions → Apps Script</span>।
          </li>
          <li>
            <span className="font-bold text-charcoal-deep">২.</span> রিপোর{" "}
            <span className="font-latin">apps-script/Code.gs</span> পুরোটা পেস্ট করে Save দিন।
          </li>
          <li>
            <span className="font-bold text-charcoal-deep">৩.</span> ফাংশন ড্রপডাউন থেকে{" "}
            <span className="font-latin">setupHubSheets</span> রান করুন (প্রথমবার অনুমতি চাইবে)।
          </li>
          <li>
            <span className="font-bold text-charcoal-deep">৪.</span>{" "}
            <span className="font-latin">Deploy → New deployment → Web app</span>, Execute as <b>Me</b>, access{" "}
            <b>Anyone</b> → URL কপি করুন।
          </li>
          <li>
            <span className="font-bold text-charcoal-deep">৫.</span> সেই URL উপরের বক্সে বসিয়ে{" "}
            <b>সেভ ও টেস্ট</b> চাপুন।
          </li>
        </ol>
        <Alert tone="sunset">
          কোড বদলালে <span className="font-latin">Deploy → Manage deployments → Edit → New version</span> করতে ভুলবেন
          না; নাহলে পুরনো কোড চলবে।
        </Alert>
      </Card>

      <Card className="p-5">
        <SectionTitle eyebrow="Danger zone" title="লোকাল ডেটা রিসেট" />
        <p className="mb-3 text-[12px] leading-relaxed text-charcoal-soft">
          এই ব্রাউজারে জমে থাকা প্রোফাইল, অগ্রগতি ও ফলাফল মুছে যাবে। শিটের ডেটা অক্ষত থাকবে।
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (window.confirm("লোকাল ডেটা সব মুছে ফেলবেন?")) {
              resetLocal();
              toast("লোকাল ডেটা মুছে ফেলা হয়েছে", "info");
              navigate("/");
            }
          }}
        >
          <IconTrash className="h-3.5 w-3.5" /> রিসেট করুন
        </Button>
      </Card>
    </div>
  );
}
