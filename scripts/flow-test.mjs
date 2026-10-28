/**
 * Interaction test for the learner + trainer flows, driven through jsdom.
 *
 * 1. learner answers a quick check (identity → questions → submit → result)
 * 2. progress marking persists in localStorage
 * 3. trainer creates a share link and opens it in a fresh session
 * 4. deep links resolve (SPA routing)
 *
 * Requires jsdom: `npm i jsdom --no-save`. Usage: node scripts/flow-test.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outfile = path.join(root, "node_modules", ".cache", "flow-app.mjs");

await build({
  entryPoints: [path.join(root, "src/App.tsx")],
  bundle: true,
  outfile,
  format: "esm",
  platform: "node",
  jsx: "automatic",
  packages: "external",
  alias: { "@": path.join(root, "src") },
  loader: { ".json": "json", ".png": "dataurl", ".jpg": "dataurl" },
  logLevel: "error",
});

let failures = 0;
const check = (label, ok, extra = "") => {
  if (ok) console.log(`✓ ${label}`);
  else {
    failures += 1;
    console.error(`✗ ${label}${extra ? ` — ${extra}` : ""}`);
  }
};

async function boot(initialPath, seed = null) {
  const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
    url: `http://localhost:3000${initialPath}`,
    pretendToBeVisual: true,
  });
  const { window } = dom;
  if (seed) window.localStorage.setItem("sli_learning_hub_v1", seed);

  globalThis.window = window;
  globalThis.document = window.document;
  try {
    Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
  } catch {
    /* node's own navigator is fine */
  }
  globalThis.localStorage = window.localStorage;
  globalThis.sessionStorage = window.sessionStorage;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  globalThis.Event = window.Event;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  const [{ createRoot }, { act }, React] = await Promise.all([
    import("react-dom/client"),
    import("react"),
    import("react"),
  ]);
  const { default: App } = await import(`${outfile}?t=${Date.now()}`);

  const container = window.document.getElementById("root");
  const root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(App));
  });

  const wait = (ms = 30) => act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });

  return { window, container, act, wait, root };
}

const text = (node) => node.textContent.replace(/\s+/g, " ");
const q = (container, sel) => container.querySelector(sel);
const qa = (container, sel) => Array.from(container.querySelectorAll(sel));
const byText = (container, selector, needle) =>
  qa(container, selector).find((el) => text(el).includes(needle));

function click(el, act) {
  return act(async () => {
    el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

function setValue(el, value, act) {
  const view = el.ownerDocument.defaultView;
  const proto = el.tagName === "SELECT" ? view.HTMLSelectElement.prototype : view.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  return act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new view.Event("input", { bubbles: true }));
    el.dispatchEvent(new view.Event("change", { bubbles: true }));
  });
}

/* ------------------------------------------------------------------ */
/* Flow 1 — take a quick check end to end                              */
/* ------------------------------------------------------------------ */
{
  const { window, container, act, wait, root } = await boot("/assessment/take/check-endowment");
  await wait();
  check("quiz intro renders", text(container).includes("শুরু করুন"));

  const nameInput = q(container, 'input[autocomplete="name"]');
  const mobileInput = q(container, 'input[autocomplete="tel"]');
  check("identity fields present", Boolean(nameInput && mobileInput));

  await setValue(nameInput, "মো. আরিফুল ইসলাম", act);
  await setValue(mobileInput, "01712345678", act);

  const startBtn = byText(container, "button", "শুরু করুন");
  await click(startBtn, act);
  await wait();
  check("question screen opened", text(container).includes("Question"), text(container).slice(0, 120));

  const options = qa(container, "button[aria-pressed]");
  check("options rendered", options.length >= 3, `found ${options.length}`);
  await click(options[0], act);
  await wait();

  const submitBtn = byText(container, "button", "জমা দিন");
  check("submit available", Boolean(submitBtn));
  await click(submitBtn, act);
  await wait(60);

  const afterSubmit = text(container);
  check("result page reached", window.location.pathname.startsWith("/assessment/result/"), window.location.pathname);
  check("result shows review", afterSubmit.includes("উত্তরপত্র ও ব্যাখ্যা"), afterSubmit.slice(0, 160));

  const stored = JSON.parse(window.localStorage.getItem("sli_learning_hub_v1") || "{}");
  check("attempt persisted", (stored.attempts ?? []).length === 1);
  check("learner saved", stored.learner?.name === "মো. আরিফুল ইসলাম");
  check("sync queue filled", (stored.queue ?? []).some((x) => x.kind === "attempt"));
  await act(async () => root.unmount());
}

/* ------------------------------------------------------------------ */
/* Flow 2 — mark a module complete                                     */
/* ------------------------------------------------------------------ */
{
  const { window, container, act, wait, root } = await boot("/library/uwn-grid");
  await wait();
  const btn = byText(container, "button", "সম্পন্ন হিসেবে চিহ্নিত করুন");
  check("module complete button present", Boolean(btn));
  if (btn) {
    await click(btn, act);
    await wait();
  }
  const stored = JSON.parse(window.localStorage.getItem("sli_learning_hub_v1") || "{}");
  check("module progress persisted", stored.progress?.["uwn-grid"]?.status === "completed");
  check("navigated to next module", window.location.pathname.startsWith("/library/"), window.location.pathname);
  await act(async () => root.unmount());
}

/* ------------------------------------------------------------------ */
/* Flow 3 — trainer creates a share link                               */
/* ------------------------------------------------------------------ */
{
  const { window, container, act, wait, root } = await boot("/admin");
  await wait();
  const pin = q(container, 'input[type="password"]');
  await setValue(pin, "2468", act);
  await click(byText(container, "button", "প্রবেশ করুন"), act);
  await wait();
  check("admin unlocked", text(container).includes("ট্রেনার ড্যাশবোর্ড"));

  await click(byText(container, "button", "শেয়ার লিংক"), act);
  await wait();
  const newLink = byText(container, "button", "নতুন লিংক");
  check("activations tab open", Boolean(newLink));
  if (newLink) {
    await click(newLink, act);
    await wait();
    const dialog = q(container, '[role="dialog"]');
    check("create modal open", Boolean(dialog));
    const createBtn = dialog && byText(dialog, "button", "লিংক তৈরি");
    if (createBtn) {
      await click(createBtn, act);
      await wait(60);
    }
  }
  const stored = JSON.parse(window.localStorage.getItem("sli_learning_hub_v1") || "{}");
  const acts = stored.activations ?? [];
  check("activation stored", acts.length === 1, JSON.stringify(acts.map((a) => a.slug)));
  check("activation has slug", Boolean(acts[0]?.slug));
  await act(async () => root.unmount());
}

/* ------------------------------------------------------------------ */
/* Flow 4 — share link resolves to the quiz                            */
/* ------------------------------------------------------------------ */
{
  const seed = JSON.stringify({
    learner: { name: "", mobile: "", employeeId: "", supervisor: "", zone: "", designation: "" },
    progress: {},
    attempts: [],
    customQuizzes: [],
    activations: [
      {
        slug: "demo-link-1",
        quizId: "set-products",
        quizTitle: "প্রোডাক্ট মাস্টারি — সেট ১",
        purpose: "সাপ্তাহিক যাচাই",
        date: "2026-10-28",
        message: "",
        durationMinutes: 10,
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ],
    supervisors: [],
    zones: [],
    settings: { apiUrl: "" },
    queue: [],
    sync: { status: "idle", lastSyncAt: "", error: "" },
  });
  const { window, container, act, wait, root } = await boot("/?slug=demo-link-1", seed);
  await wait(80);
  check("share link keeps the shareable URL", window.location.pathname === "/" && window.location.search.includes("slug=demo-link-1"), `${window.location.pathname}${window.location.search}`);
  const t = text(container);
  check("share link shows quiz title", t.includes("প্রোডাক্ট মাস্টারি"), t.slice(0, 160));
  check("timer shown for timed activation", t.includes("মিনিট"));
  await act(async () => root.unmount());
}

/* ------------------------------------------------------------------ */
/* Flow 5 — closed activation is blocked                               */
/* ------------------------------------------------------------------ */
{
  const seed = JSON.stringify({
    learner: { name: "", mobile: "", employeeId: "", supervisor: "", zone: "", designation: "" },
    progress: {},
    attempts: [],
    customQuizzes: [],
    activations: [
      {
        slug: "closed-1",
        quizId: "check-endowment",
        quizTitle: "শান্তা এন্ডোমেন্ট — দ্রুত যাচাই",
        purpose: "শেষ হয়েছে",
        date: "2026-10-20",
        message: "",
        durationMinutes: 0,
        status: "closed",
        createdAt: new Date().toISOString(),
      },
    ],
    supervisors: [],
    zones: [],
    settings: { apiUrl: "" },
    queue: [],
    sync: { status: "idle", lastSyncAt: "", error: "" },
  });
  const { container, act, wait, root } = await boot("/assessment/take/check-endowment?slug=closed-1", seed);
  await wait();
  check("closed activation blocked", text(container).includes("বন্ধ হয়ে গেছে"), text(container).slice(0, 120));
  await act(async () => root.unmount());
}

/* ------------------------------------------------------------------ */
/* Flow 6 — trainer edits a custom quiz                                */
/* ------------------------------------------------------------------ */
{
  const customQuiz = {
    id: "quiz-edit",
    title: "পুরনো শিরোনাম",
    product: "Test",
    set: "Custom",
    kind: "quiz",
    passMark: 60,
    origin: "custom",
    questions: [{ id: "q1", prompt: "প্রশ্ন?", options: ["ক", "খ"], correct: 0, explanation: "" }],
  };
  const seed = JSON.stringify({
    learner: { name: "", mobile: "", employeeId: "", supervisor: "", zone: "", designation: "" },
    progress: {},
    attempts: [],
    customQuizzes: [customQuiz],
    activations: [],
    supervisors: [],
    zones: [],
    settings: { apiUrl: "" },
    queue: [],
    sync: { status: "idle", lastSyncAt: "", error: "" },
  });
  const { window, container, act, wait, root } = await boot("/admin", seed);
  await wait();
  await setValue(q(container, 'input[type="password"]'), "2468", act);
  await click(byText(container, "button", "প্রবেশ করুন"), act);
  await wait();
  await click(byText(container, "button", "কুইজ ব্যাংক"), act);
  await wait();

  const editBtn = byText(container, "button", "সম্পাদনা");
  check("edit button present for custom quiz", Boolean(editBtn));
  if (editBtn) {
    await click(editBtn, act);
    await wait();
    const dialog = q(container, '[role="dialog"]');
    const titleInput = dialog && dialog.querySelector("input");
    check("editor opened with title", Boolean(titleInput));
    if (titleInput) {
      await setValue(titleInput, "নতুন শিরোনাম", act);
      const saveBtn = byText(dialog, "button", "সংরক্ষণ করুন");
      await click(saveBtn, act);
      await wait(60);
    }
  }
  const stored = JSON.parse(window.localStorage.getItem("sli_learning_hub_v1") || "{}");
  check("edited quiz saved", stored.customQuizzes?.[0]?.title === "নতুন শিরোনাম", JSON.stringify(stored.customQuizzes?.[0]?.title));
  check("edited quiz queued for sync", (stored.queue ?? []).some((x) => x.kind === "quiz"));
  await act(async () => root.unmount());
}

if (failures) {
  console.error(`\n${failures} interaction check(s) failed`);
  process.exit(1);
}
console.log("\nAll interaction flows passed.");
