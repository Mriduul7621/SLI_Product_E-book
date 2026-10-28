/**
 * Headless smoke test for the Learning Hub.
 *
 * Bundles the SPA with esbuild, renders every route with react-dom/server and
 * asserts that the expected Bengali copy is present and that no render-time
 * error or `undefined`/`NaN`/`[object Object]` leaks into the markup.
 *
 * Usage: node scripts/smoke.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import React from "react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outfile = path.join(root, "node_modules", ".cache", "smoke-app.mjs");

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

/* ------------------------- minimal DOM stubs ------------------------- */
const storage = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
};

const location = { pathname: "/", search: "", origin: "http://localhost:3000", href: "http://localhost:3000/" };

globalThis.window = {
  location,
  history: { pushState: () => {}, replaceState: () => {} },
  localStorage: storage(),
  sessionStorage: storage(),
  addEventListener: () => {},
  removeEventListener: () => {},
  scrollTo: () => {},
  dispatchEvent: () => {},
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
};
globalThis.localStorage = window.localStorage;
globalThis.sessionStorage = window.sessionStorage;
globalThis.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  getElementById: () => null,
  body: { style: {} },
  documentElement: { scrollHeight: 0, clientHeight: 0 },
};

const { default: App } = await import(outfile);
const { renderToString } = await import("react-dom/server");

const CASES = [
  { path: "/", search: "", expect: ["শেখা শুরু করুন", "লার্নিং", "মোট মডিউল"], name: "Home" },
  { path: "/library", search: "", expect: ["কোর্স লাইব্রেরি", "শান্তা এন্ডোমেন্ট", "আন্ডাররাইটিং"], name: "Library" },
  { path: "/library/endowment", search: "", expect: ["এন্ডোমেন্ট", "সম্পন্ন হিসেবে চিহ্নিত করুন"], name: "Module reader" },
  { path: "/library/uwn-grid", search: "", expect: ["মেডিকেল", "আন্ডাররাইটিং"], name: "Module reader (Part II)" },
  { path: "/library/mastery-playbook", search: "", expect: ["নিড-বেজড", "আপত্তি"], name: "Mastery playbook" },
  { path: "/assessment", search: "", expect: ["নিজেকে যাচাই করুন", "শেয়ার করা"], name: "Assessment" },
  { path: "/assessment/take/check-endowment", search: "", expect: ["শুরু করুন", "এন্ডোমেন্ট"], name: "Quiz intro" },
  { path: "/assessment/take/set-final", search: "", expect: ["ফাইনাল সার্টিফিকেশন", "পাস মার্ক"], name: "Final set intro" },
  { path: "/assessment/result/nope", search: "", expect: ["ফলাফলটি পাওয়া যায়নি"], name: "Result (missing)" },
  { path: "/admin", search: "", expect: ["ট্রেনার অ্যাক্সেস"], name: "Admin gate" },
  { path: "/profile", search: "", expect: ["আপনার প্রোফাইল"], name: "Profile" },
  { path: "/somewhere-else", search: "", expect: ["পৃষ্ঠাটি পাওয়া যায়নি"], name: "404" },
];

let failures = 0;
for (const test of CASES) {
  location.pathname = test.path;
  location.search = test.search;
  try {
    const html = renderToString(React.createElement(App));
    const problems = [];
    for (const token of test.expect) {
      if (!html.includes(token)) problems.push(`missing “${token}”`);
    }
    for (const bad of ["undefined", "NaN", "[object Object]"]) {
      if (html.includes(bad)) problems.push(`leaked “${bad}”`);
    }
    if (problems.length) {
      failures += 1;
      console.error(`✗ ${test.name} (${test.path}) — ${problems.join(", ")}`);
    } else {
      console.log(`✓ ${test.name} (${test.path}) — ${(html.length / 1024).toFixed(1)} kB html`);
    }
  } catch (err) {
    failures += 1;
    console.error(`✗ ${test.name} (${test.path}) — render error: ${err?.message ?? err}`);
  }
}

if (failures) {
  console.error(`\n${failures} route(s) failed`);
  process.exit(1);
}
console.log("\nAll routes rendered cleanly.");
