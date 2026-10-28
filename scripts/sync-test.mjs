/**
 * Sync-engine test for src/lib/hub.ts.
 *
 * Covers the failure mode that matters most in the field: writes made while the
 * sheet is unreachable (or while a flush is already running) must never be lost.
 *
 * Usage: node scripts/sync-test.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outfile = path.join(root, "node_modules", ".cache", "hub.mjs");

await build({
  entryPoints: [path.join(root, "src/lib/hub.ts")],
  bundle: true,
  outfile,
  format: "esm",
  platform: "node",
  jsx: "automatic",
  packages: "external",
  alias: { "@": path.join(root, "src") },
  loader: { ".json": "json" },
  logLevel: "error",
});

const store = new Map();
globalThis.window = {
  location: { search: "" },
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
};

const hub = await import(outfile);

let failures = 0;
const check = (label, ok, extra = "") => {
  if (ok) console.log(`✓ ${label}`);
  else {
    failures += 1;
    console.error(`✗ ${label}${extra ? ` — ${extra}` : ""}`);
  }
};
const settle = (ms = 60) => new Promise((r) => setTimeout(r, ms));

const calls = [];
let mode = "fail";

globalThis.fetch = async (url, options = {}) => {
  const payload = options.body ? JSON.parse(options.body) : { action: new URL(url).searchParams.get("action") };
  calls.push(payload.action);
  if (mode === "fail") throw new Error("offline");
  if (payload.action === "bootstrap") {
    return {
      json: async () => ({
        ok: true,
        quizzes: [],
        activations: [],
        supervisors: ["ফাতেমা বেগম"],
        zones: ["ঢাকা উত্তর"],
        progress: [],
        results: [],
      }),
    };
  }
  return { json: async () => ({ ok: true }) };
};

hub.setApiUrl("https://script.google.com/macros/s/TEST/exec");
hub.saveLearner({ name: "রহিম উদ্দিন", mobile: "01711111111", employeeId: "", supervisor: "", zone: "", designation: "" });
hub.markModule("endowment", "completed");
await settle();

check("queue keeps writes while offline", hub.getState().queue.length === 2, `queue=${hub.getState().queue.length}`);
check("sync status reports the error", hub.getState().sync.status === "error", hub.getState().sync.status);

mode = "ok";
hub.syncNow();
await settle();
check("queue drains once the sheet is reachable", hub.getState().queue.length === 0, `queue=${hub.getState().queue.length}`);
check("progress marked as synced", hub.getState().progress.endowment?.synced === true);
check("learner + progress both posted", calls.includes("registerLearner") && calls.includes("saveProgress"), calls.join(","));

/* A write that lands while a flush is in flight must not be dropped. */
mode = "slow";
let release;
const gate = new Promise((r) => (release = r));
globalThis.fetch = async (url, options = {}) => {
  const payload = options.body ? JSON.parse(options.body) : {};
  if (payload.action === "saveQuiz") await gate;
  return { json: async () => ({ ok: true }) };
};

hub.saveQuiz({
  id: "q-slow",
  title: "ধীর কুইজ",
  product: "Test",
  set: "Test",
  kind: "quiz",
  passMark: 60,
  questions: [],
  origin: "custom",
});
await settle(10);
hub.saveLists({ supervisors: ["নতুন সুপারভাইজার"], zones: [] });
await settle(10);
release();
await settle(80);

check("write queued mid-flight survives", hub.getState().queue.length === 0, `queue=${hub.getState().queue.length}`);
check("mid-flight write was delivered", hub.getState().supervisors.includes("নতুন সুপারভাইজার"), JSON.stringify(hub.getState().supervisors));

/* Bootstrap merges the sheet's catalogue without dropping local records. */
globalThis.fetch = async () => ({
  json: async () => ({
    ok: true,
    quizzes: [
      {
        id: "custom-1",
        title: "শিটের কুইজ",
        product: "Test",
        set: "Test",
        kind: "quiz",
        passMark: 60,
        questions: [],
        origin: "custom",
      },
    ],
    activations: [],
    supervisors: ["ফাতেমা বেগম", "আরিফ"],
    zones: ["ঢাকা উত্তর"],
    progress: [{ moduleId: "s4pp", status: "completed", minutes: 9, updatedAt: new Date().toISOString(), synced: true }],
    results: [],
  }),
});
const res = await hub.bootstrap();
check("bootstrap succeeds", res.ok === true, res.message);
check("remote quiz merged", hub.getState().customQuizzes.some((q) => q.id === "custom-1"));
check("remote progress merged", hub.getState().progress.s4pp?.status === "completed");
check("local quiz kept", hub.getState().customQuizzes.some((q) => q.id === "q-slow"));
check("remote supervisors merged", hub.getState().supervisors.length === 2);

if (failures) {
  console.error(`\n${failures} sync check(s) failed`);
  process.exit(1);
}
console.log("\nAll sync checks passed.");
