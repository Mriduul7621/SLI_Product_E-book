import { Suspense, lazy, useEffect, useState } from "react";
import { bootstrap, hasRemote, useHub } from "@/lib/hub";
import AppShell from "@/components/hub/AppShell";
import { Toaster, Button, Card, Spinner } from "@/components/hub/ui";
import { Link, useRoute } from "@/lib/router";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import ModuleReader from "@/pages/ModuleReader";
import Assessment from "@/pages/Assessment";
import TakeQuiz from "@/pages/TakeQuiz";
import Result from "@/pages/Result";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";

// The full e-book pulls in every chapter component, so it loads on demand.
const Book = lazy(() => import("@/pages/Book"));

/**
 * A trainer share link (`?slug=…`) opens the assigned quiz directly, without a
 * redirect — the URL stays shareable even before the sheet has been synced.
 */
function ShareEntry({ slug }: { slug: string }) {
  const activations = useHub((s) => s.activations);
  const [checked, setChecked] = useState(!hasRemote());
  const activation = activations.find((a) => a.slug === slug);

  useEffect(() => {
    if (activation || !hasRemote()) return;
    let cancelled = false;
    void bootstrap().finally(() => {
      if (!cancelled) setChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [activation, slug]);

  if (activation) return <TakeQuiz quizId={activation.quizId} slug={slug} />;

  if (!checked) {
    return (
      <Card className="flex flex-col items-center gap-3 p-14 text-center">
        <Spinner />
        <p className="text-[13px] font-semibold text-charcoal-soft">আপনার অ্যাসেসমেন্ট লোড হচ্ছে…</p>
      </Card>
    );
  }

  return (
    <Card className="p-10 text-center">
      <p className="text-[15px] font-extrabold text-charcoal-deep">লিংকটি পাওয়া যায়নি</p>
      <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-charcoal-soft">
        এই অ্যাসেসমেন্ট লিংকটি সঠিক নয়, মেয়াদ শেষ, অথবা এখনো শিটে সিঙ্ক হয়নি। ট্রেনারের কাছে নতুন লিংক চান।
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Link to="/assessment">
          <Button size="sm" variant="primary">
            অ্যাসেসমেন্ট লাইব্রেরি
          </Button>
        </Link>
        <Link to="/">
          <Button size="sm" variant="outline">
            হোম
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function BookFallback() {
  return (
    <Card className="flex items-center justify-center gap-3 p-16">
      <Spinner />
      <p className="text-[13px] font-semibold text-charcoal-soft">ই-বুক প্রস্তুত হচ্ছে…</p>
    </Card>
  );
}

export default function App() {
  const { route, search } = useRoute();

  const shareSlug = search.get("slug");

  let page: React.ReactNode;
  if (shareSlug && route.name !== "take" && route.name !== "result") {
    page = <ShareEntry slug={shareSlug} />;
  } else switch (route.name) {
    case "home":
      page = <Home />;
      break;
    case "library":
      page = <Library />;
      break;
    case "module":
      page = <ModuleReader id={route.id} />;
      break;
    case "book":
      page = (
        <Suspense fallback={<BookFallback />}>
          <Book />
        </Suspense>
      );
      break;
    case "assessment":
      page = <Assessment />;
      break;
    case "take":
      page = <TakeQuiz quizId={route.quizId} />;
      break;
    case "result":
      page = <Result attemptId={route.attemptId} />;
      break;
    case "profile":
      page = <Profile />;
      break;
    case "admin":
      page = <Admin />;
      break;
    default:
      page = (
        <Card className="p-12 text-center">
          <p className="font-latin text-[3rem] font-extrabold leading-none text-olive/30">৪০৪</p>
          <p className="mt-2 text-[15px] font-extrabold text-charcoal-deep">পৃষ্ঠাটি পাওয়া যায়নি</p>
          <p className="mt-1 text-[12.5px] text-charcoal-soft">
            লিংকটি হয়তো বদলে গেছে। হোম থেকে আবার শুরু করুন।
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link to="/">
              <Button size="sm" variant="primary">
                হোমে ফিরুন
              </Button>
            </Link>
            <Link to="/library">
              <Button size="sm" variant="outline">
                লাইব্রেরি
              </Button>
            </Link>
          </div>
        </Card>
      );
  }

  return (
    <AppShell>
      {page}
      <Toaster />
    </AppShell>
  );
}
