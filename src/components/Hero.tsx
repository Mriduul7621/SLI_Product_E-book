import { IconDownload } from "./icons";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-6 py-12 text-white shadow-lg sm:px-10 sm:py-16">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-400/20 blur-2xl" />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 text-xs font-bold tracking-wide backdrop-blur">
          শান্তা লাইফ ইনস্যুরেন্স পিএলসি · ফিল্ড ফোর্স ট্রেনিং
        </p>
        <h1 className="mb-4 text-3xl font-extrabold leading-tight sm:text-5xl">
          গল্পে গল্পে শিখি <br className="hidden sm:block" /> শান্তা লাইফের বিমা প্রোডাক্ট
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-emerald-50 sm:text-base">
          সেলস অফিসার, ইউনিট ম্যানেজার ও ফাইন্যান্সিয়াল কনসালট্যান্টদের জন্য তৈরি সম্পূর্ণ ই-বুক — বাস্তব গল্প,
          সহজ ব্যাখ্যা, রেড অ্যালার্ট, কুইজ ও গোল্ডেন রুলসহ প্রতিটি প্রোডাক্টের নিখুঁত ক্যালকুলেশন।
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#introduction"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-700 shadow transition hover:bg-emerald-50"
          >
            পড়া শুরু করুন
          </a>
          <a
            href="/shanta-life-ebook.pdf"
            download
            className="flex items-center gap-2 rounded-xl bg-emerald-900/40 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-emerald-900/60"
          >
            <IconDownload className="h-4 w-4" /> PDF নামান
          </a>
          <a
            href="/shanta-life-ebook.docx"
            download
            className="flex items-center gap-2 rounded-xl bg-emerald-900/40 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-emerald-900/60"
          >
            <IconDownload className="h-4 w-4" /> Word নামান
          </a>
        </div>
      </div>
    </section>
  );
}
