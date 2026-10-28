import { useMemo, useState } from "react";
import { Link, navigate, useRoute } from "@/lib/router";
import { MODULES, PARTS, TOTAL_MINUTES, QUESTION_POOL, bookMeta } from "@/data/curriculum";
import type { Part } from "@/lib/types";
import { bestScoreFor, useHub } from "@/lib/hub";
import { bn } from "@/lib/format";
import {
  IconArrowRight,
  IconBook,
  IconClock,
  IconFilePdf,
  IconFileWord,
  IconTrophy,
} from "@/components/icons";
import { Badge, Button, Card, EmptyState, ProgressBar, SearchInput, SectionTitle } from "@/components/hub/ui";
import { cn } from "@/utils/cn";

const partTone: Record<Part, "olive" | "sunset" | "steel" | "plum"> = {
  foundation: "steel",
  products: "olive",
  underwriting: "sunset",
  mastery: "plum",
};

type Filter = "all" | Part;

export default function Library() {
  const { search } = useRoute();
  const initial = (search.get("part") ?? "all") as Filter;
  const [filter, setFilter] = useState<Filter>(PARTS.some((p) => p.id === initial) ? initial : "all");
  const [query, setQuery] = useState("");
  const progress = useHub((s) => s.progress);
  const attempts = useHub((s) => s.attempts);

  const modules = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MODULES.filter((m) => (filter === "all" ? true : m.part === filter)).filter((m) =>
      q
        ? [m.title, m.titleEn, m.tagline, m.number].join(" ").toLowerCase().includes(q)
        : true,
    );
  }, [filter, query, attempts]);

  const completed = MODULES.filter((m) => progress[m.id]?.status === "completed").length;

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-charcoal/10 bg-white p-6 shadow-card sm:p-8">
        <div
          className="absolute inset-x-0 top-0 h-1 rule-brand"
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <p className="font-latin text-[10.5px] font-bold uppercase tracking-brand text-olive">
              Learning Library
            </p>
            <h1 className="mt-2 text-[1.6rem] font-extrabold leading-tight tracking-tight text-charcoal-deep sm:text-[1.9rem]">
              কোর্স লাইব্রেরি
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-charcoal-soft">
              {bn(MODULES.length)}টি মডিউল · {bn(TOTAL_MINUTES)} মিনিট পড়া · {bn(QUESTION_POOL)}টি মূল্যায়ন প্রশ্ন।
              প্রতিটি মডিউল শেষে দ্রুত যাচাই দিয়ে নিজের বোঝাটা নিশ্চিত করুন।
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/book">
                <Button variant="primary" size="sm">
                  <IconBook className="h-3.5 w-3.5" /> পুরো ই-বুক পড়ুন
                </Button>
              </Link>
              <a href="/shanta-life-ebook.pdf" download>
                <Button variant="outline" size="sm">
                  <IconFilePdf className="h-3.5 w-3.5" /> PDF
                </Button>
              </a>
              <a href="/shanta-life-ebook.docx" download>
                <Button variant="outline" size="sm">
                  <IconFileWord className="h-3.5 w-3.5" /> Word
                </Button>
              </a>
            </div>
          </div>
          <div className="w-full max-w-xs rounded-2xl border border-olive/25 bg-olive-wash p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[12px] font-bold text-charcoal-deep">কোর্স অগ্রগতি</p>
              <p className="font-latin text-[12px] font-extrabold tabular-nums text-olive-deep">
                {bn(completed)}/{bn(MODULES.length)}
              </p>
            </div>
            <ProgressBar value={(completed / MODULES.length) * 100} className="mt-2.5" />
            <p className="mt-3 text-[11.5px] leading-relaxed text-charcoal-soft">
              {bookMeta.subtitle}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="পার্ট ফিল্টার" className="flex flex-wrap gap-1.5">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="সব মডিউল" />
            {PARTS.map((p) => (
              <FilterChip
                key={p.id}
                active={filter === p.id}
                onClick={() => setFilter(p.id)}
                label={p.title}
              />
            ))}
          </div>
          <div className="w-full sm:w-64">
            <SearchInput value={query} onChange={setQuery} placeholder="মডিউল খুঁজুন…" />
          </div>
        </div>

        {filter !== "all" && (
          <p className="rounded-lg border border-charcoal/10 bg-white px-4 py-2.5 text-[12px] text-charcoal-soft">
            {PARTS.find((p) => p.id === filter)?.blurb}
          </p>
        )}
      </div>

      {modules.length === 0 ? (
        <EmptyState
          title="কোনো মডিউল খুঁজে পাওয়া যায়নি"
          description="অন্য শব্দ দিয়ে খুঁজুন বা ফিল্টার সরিয়ে নিন।"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setFilter("all");
                navigate("/library", { keepScroll: true });
              }}
            >
              ফিল্টার রিসেট
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((m) => {
            const entry = progress[m.id];
            const best = bestScoreFor(`check-${m.id}`);
            const isDone = entry?.status === "completed";
            return (
              <Card key={m.id} as="article" className="flex flex-col overflow-hidden" interactive>
                <Link to={`/library/${m.id}`} className="relative block h-40 overflow-hidden">
                  <img
                    src={m.image ?? "/assets/img/scene-intro.jpg"}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/75 via-charcoal-deep/10 to-transparent"
                    aria-hidden="true"
                  />
                  <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 font-latin text-[10.5px] font-extrabold text-charcoal-deep">
                    {m.number}
                  </span>
                  {isDone && (
                    <span className="absolute right-3 top-3 rounded-full bg-forest px-2 py-0.5 text-[10px] font-bold text-white">
                      সম্পন্ন
                    </span>
                  )}
                  <p className="absolute inset-x-3 bottom-2.5 font-latin text-[10px] uppercase tracking-brand text-white/70">
                    {m.titleEn}
                  </p>
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={partTone[m.part]}>{PARTS.find((p) => p.id === m.part)?.label}</Badge>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal/45">
                      <IconClock className="h-3 w-3" /> {bn(m.minutes)} মিনিট
                    </span>
                    {best !== null && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-olive-deep">
                        <IconTrophy className="h-3 w-3" /> {bn(best)}%
                      </span>
                    )}
                  </div>
                  <h2 className="text-[14px] font-extrabold leading-snug text-charcoal-deep">{m.title}</h2>
                  <p className="mt-1 flex-1 text-[12px] leading-relaxed text-charcoal-soft">{m.tagline}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <ProgressBar
                      value={isDone ? 100 : entry?.status === "in_progress" ? 45 : 0}
                      tone={partTone[m.part]}
                      className="max-w-[120px]"
                    />
                    <Link
                      to={`/library/${m.id}`}
                      className="inline-flex items-center gap-1 text-[12px] font-extrabold text-sunset-deep hover:underline"
                    >
                      {isDone ? "আবার পড়ুন" : entry ? "চালিয়ে যান" : "পড়ুন"}
                      <IconArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SectionTitle
        eyebrow="Assessment"
        title="পড়া শেষ? নিজেকে যাচাই করুন"
        description="প্রতিটি মডিউলের জন্য দ্রুত যাচাই, পার্টভিত্তিক সেট এবং ফাইনাল সার্টিফিকেশন টেস্ট।"
        action={
          <Link to="/assessment">
            <Button size="sm" variant="accent">
              অ্যাসেসমেন্টে যান <IconArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        }
      />
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-2 text-[12px] font-bold transition",
        active
          ? "border-charcoal bg-charcoal text-white shadow-sm"
          : "border-charcoal/15 bg-white text-charcoal-soft hover:border-olive hover:text-olive-deep",
      )}
    >
      {label}
    </button>
  );
}
