import { useEffect, useMemo } from "react";
import ebookRaw from "@/data/ebookContent.json";
import masteryRaw from "@/data/sales/mastery.json";
import Chapter from "@/components/Chapter";
import { FrameworkSection, IntroSection } from "@/components/OtherSections";
import { MockTestSection, NeedBasedSection, NoNeedSection, ObjectionMethodSection } from "@/components/Mastery";
import { Link, navigate } from "@/lib/router";
import { MODULES, PARTS, chapterJson, moduleById } from "@/data/curriculum";
import { bestScoreFor, markModule, useHub } from "@/lib/hub";
import { bn } from "@/lib/format";
import {
  IconArrowRight,
  IconCheck,
  IconCheckCircle,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconTrophy,
} from "@/components/icons";
import { Badge, Button, Card, ProgressBar, toast } from "@/components/hub/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
const ebook = ebookRaw as any;
const mastery = masteryRaw as any;

const partTone = {
  foundation: "steel",
  products: "olive",
  underwriting: "sunset",
  mastery: "plum",
} as const;

export default function ModuleReader({ id }: { id: string }) {
  const module = moduleById(id);
  const progress = useHub((s) => s.progress);
  const entry = progress[id];
  const best = bestScoreFor(`check-${id}`);

  const index = MODULES.findIndex((m) => m.id === id);
  const prev = index > 0 ? MODULES[index - 1] : null;
  const next = index >= 0 && index < MODULES.length - 1 ? MODULES[index + 1] : null;
  const chapter = chapterJson(id);

  useEffect(() => {
    if (module && entry?.status !== "completed") markModule(id, "in_progress");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const body = useMemo(() => {
    if (id === "introduction") {
      return (
        <div className="space-y-10">
          <IntroSection data={ebook.introduction} />
          <FrameworkSection items={ebook.framework} />
          <Card className="p-5">
            <h3 className="mb-2 text-[14px] font-extrabold text-charcoal-deep">কীভাবে এই কোর্স ব্যবহার করবেন</h3>
            <ul className="space-y-2 text-[12.5px] leading-relaxed text-charcoal-soft">
              <li className="flex gap-2">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                প্রতিটি মডিউল শেষে “সম্পন্ন” চিহ্নিত করুন — অগ্রগতি Learning Hub শিটে সংরক্ষিত হবে।
              </li>
              <li className="flex gap-2">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                অধ্যায়ের শেষে “দ্রুত যাচাই” দিন; ৭০%-এর নিচে পেলে ব্যাখ্যা পড়ে আবার চেষ্টা করুন।
              </li>
              <li className="flex gap-2">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                পার্ট I শেষ করে পার্ট II-এ যান — আন্ডাররাইটিং জ্ঞান প্রোডাক্ট জ্ঞানের উপর দাঁড়িয়ে।
              </li>
            </ul>
          </Card>
        </div>
      );
    }

    if (id === "mastery-playbook") {
      return (
        <div className="space-y-12">
          <NeedBasedSection data={mastery.needBased} />
          <ObjectionMethodSection data={mastery.objectionMethod} />
          <MockTestSection data={mastery.mockTest} />
          <NoNeedSection data={mastery.noNeed} />
        </div>
      );
    }

    if (chapter) return <Chapter chapter={chapter} />;

    return (
      <Card className="p-6">
        <p className="text-[13px] text-charcoal-soft">এই মডিউলের কনটেন্ট এখনো যুক্ত হয়নি।</p>
      </Card>
    );
  }, [id, chapter]);

  if (!module) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[15px] font-extrabold text-charcoal-deep">মডিউলটি পাওয়া যায়নি</p>
        <p className="mt-1 text-[12.5px] text-charcoal-soft">লাইব্রেরি থেকে সঠিক মডিউল বেছে নিন।</p>
        <div className="mt-5 flex justify-center">
          <Button onClick={() => navigate("/library")} variant="primary" size="sm">
            লাইব্রেরিতে ফিরুন
          </Button>
        </div>
      </Card>
    );
  }

  const completed = entry?.status === "completed";

  return (
    <div className="pb-24">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[11.5px] font-semibold text-charcoal/50">
        <Link to="/library" className="hover:text-olive-deep">
          লাইব্রেরি
        </Link>
        <IconChevronRight className="h-3 w-3" />
        <span>{PARTS.find((p) => p.id === module.part)?.title}</span>
        <IconChevronRight className="h-3 w-3" />
        <span className="text-charcoal-deep">{module.number}</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={partTone[module.part]}>{PARTS.find((p) => p.id === module.part)?.title}</Badge>
        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-charcoal/50">
          <IconClock className="h-3.5 w-3.5" /> {bn(module.minutes)} মিনিট
        </span>
        {completed && <Badge tone="forest">সম্পন্ন</Badge>}
        {best !== null && (
          <Badge tone="olive">
            <IconTrophy className="h-3 w-3" /> সেরা {bn(best)}%
          </Badge>
        )}
      </div>

      {body}

      <div className="mt-10 rounded-2xl border border-charcoal/12 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13.5px] font-extrabold text-charcoal-deep">
              {completed ? "এই মডিউলটি সম্পন্ন হয়েছে" : "পড়া শেষ হয়েছে?"}
            </p>
            <p className="mt-1 text-[12px] text-charcoal-soft">
              {completed
                ? "চাইলে আবার পড়তে পারেন, অথবা পরের মডিউলে এগিয়ে যান।"
                : "সম্পন্ন চিহ্নিত করলে অগ্রগতি সংরক্ষিত হবে এবং পরের ধাপ খুলে যাবে।"}
            </p>
            <ProgressBar value={completed ? 100 : 45} className="mt-3 max-w-xs" />
          </div>
          <div className="flex flex-wrap gap-2">
            {module.quizId && (
              <Link to={`/assessment/take/${module.quizId}`}>
                <Button variant="outline" size="md">
                  <IconTrophy className="h-4 w-4" /> দ্রুত যাচাই
                </Button>
              </Link>
            )}
            {!completed ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  markModule(id, "completed");
                  toast("অগ্রগতি সংরক্ষিত হয়েছে");
                  if (next) navigate(`/library/${next.id}`);
                }}
              >
                <IconCheckCircle className="h-4 w-4" /> সম্পন্ন হিসেবে চিহ্নিত করুন
              </Button>
            ) : (
              next && (
                <Button variant="primary" size="md" onClick={() => navigate(`/library/${next.id}`)}>
                  পরের মডিউল <IconArrowRight className="h-4 w-4" />
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {prev ? (
          <Link
            to={`/library/${prev.id}`}
            className="group inline-flex items-center gap-2 rounded-xl border border-charcoal/12 bg-white px-4 py-3 text-[12.5px] font-bold text-charcoal transition hover:border-olive"
          >
            <IconChevronLeft className="h-4 w-4 text-charcoal/40 group-hover:text-olive" />
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-charcoal/40">আগের</span>
              <span className="block truncate">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/library/${next.id}`}
            className="group inline-flex items-center gap-2 rounded-xl border border-charcoal/12 bg-white px-4 py-3 text-right text-[12.5px] font-bold text-charcoal transition hover:border-olive sm:justify-self-end"
          >
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-charcoal/40">পরের</span>
              <span className="block truncate">{next.title}</span>
            </span>
            <IconChevronRight className="h-4 w-4 text-charcoal/40 group-hover:text-olive" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
