import { cn } from "@/utils/cn";
import type { NavItem } from "./Layout";
import { IconArrowRight } from "./icons";

export type ContentCard = NavItem & {
  title: string;
  meta?: string;
  image?: string;
  accent: "olive" | "sunset" | "charcoal";
};

export default function Contents({ items }: { items: ContentCard[] }) {
  return (
    <section
      id="contents"
      aria-labelledby="contents-title"
      className="relative border-b border-charcoal/10 bg-shell"
    >
      <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-latin text-[10.5px] font-bold uppercase tracking-brand text-olive">
              Contents
            </p>
            <h2
              id="contents-title"
              className="mt-2 text-[1.6rem] font-extrabold tracking-tight text-charcoal-deep sm:text-[1.9rem]"
            >
              সূচিপত্র
            </h2>
          </div>
          <p className="max-w-md text-[13px] leading-relaxed text-charcoal-soft">
            প্রতিটি অধ্যায় একটি বাস্তব ফিল্ড পরিস্থিতি দিয়ে শুরু — তারপর সহজ ব্যাখ্যা, সতর্কতা,
            আত্ম-মূল্যায়ন ও গোল্ডেন রুল।
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="group relative flex items-start gap-3.5 overflow-hidden rounded-xl border border-charcoal/10 bg-white p-4 shadow-[0_1px_0_rgba(60,60,59,0.04)] transition hover:-translate-y-0.5 hover:border-olive/40 hover:shadow-card"
            >
              <span
                className={cn(
                  "absolute inset-y-0 left-0 w-[3px] opacity-0 transition-opacity group-hover:opacity-100",
                  item.accent === "olive" && "bg-olive",
                  item.accent === "sunset" && "bg-sunset",
                  item.accent === "charcoal" && "bg-charcoal",
                )}
                aria-hidden="true"
              />
              <span className="mt-0.5 font-latin text-[11px] font-bold tabular-nums text-charcoal/30">
                {item.num}
              </span>
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="h-12 w-16 shrink-0 rounded-md object-cover ring-1 ring-charcoal/10"
                  width={64}
                  height={48}
                />
              ) : (
                <span
                  className="grid h-12 w-16 shrink-0 place-items-center rounded-md bg-olive-tint text-[11px] font-bold text-olive-deep"
                  aria-hidden="true"
                >
                  {item.kind === "appendix" ? "অ্যাপ" : "ভূমিকা"}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold leading-snug text-charcoal-deep">
                  {item.title}
                </span>
                {item.meta && (
                  <span className="mt-1 block truncate font-latin text-[10.5px] font-semibold uppercase tracking-[0.12em] text-charcoal/45">
                    {item.meta}
                  </span>
                )}
              </span>
              <IconArrowRight className="mt-1 h-4 w-4 shrink-0 text-charcoal/20 transition-transform group-hover:translate-x-0.5 group-hover:text-olive" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
