/**
 * Runs apps-script/Code.gs against an in-memory fake of the Sheets API.
 *
 * This catches the failures that only appear in production: header mapping on a
 * pre-existing tab, duplicate submissions, learner upserts, activation closing
 * and bootstrap payload shape. Usage: node scripts/backend-test.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.resolve(__dirname, "../apps-script/Code.gs"), "utf8");

/* ---------------------------- fake Sheets ---------------------------- */
class FakeSheet {
  constructor(name, rows = []) {
    this.name = name;
    this.rows = rows.map((r) => [...r]);
  }
  getName() {
    return this.name;
  }
  getLastRow() {
    return this.rows.length;
  }
  getLastColumn() {
    return this.rows.reduce((max, row) => Math.max(max, row.length), 0);
  }
  appendRow(values) {
    this.rows.push([...(values ?? [])]);
  }
  deleteRow(index) {
    this.rows.splice(index - 1, 1);
  }
  setFrozenRows() {}
  getRange(row, col, numRows = 1, numCols = 1) {
    const sheet = this;
    const read = () => {
      const out = [];
      for (let r = 0; r < numRows; r++) {
        const line = [];
        for (let c = 0; c < numCols; c++) line.push(sheet.rows[row - 1 + r]?.[col - 1 + c] ?? "");
        out.push(line);
      }
      return out;
    };
    const write = (values) => {
      for (let r = 0; r < numRows; r++) {
        const target = sheet.rows[row - 1 + r] ?? [];
        for (let c = 0; c < numCols; c++) target[col - 1 + c] = values[r]?.[c] ?? "";
        sheet.rows[row - 1 + r] = target;
      }
    };
    return {
      getValues: read,
      setValues: write,
      getValue: () => read()[0][0],
      setValue: (v) => write([[v]]),
      clearContent: () => write(Array.from({ length: numRows }, () => Array(numCols).fill(""))),
      setFontWeight: () => {},
    };
  }
}

class FakeSpreadsheet {
  constructor(sheets) {
    this.sheets = sheets;
  }
  getSheets() {
    return this.sheets;
  }
  getSheetByName(name) {
    return this.sheets.find((s) => s.getName() === name) ?? null;
  }
  insertSheet(name) {
    const sheet = new FakeSheet(name);
    this.sheets.push(sheet);
    return sheet;
  }
}

// A "Learning Hub" tab that already exists with different headers — the script
// must adapt to it instead of creating a duplicate tab.
const progressTab = new FakeSheet("Progress", [
  ["Employee Code", "Module", "State", "Notes"],
  ["sli-0001", "endowment", "completed", "পুরনো রেকর্ড"],
]);
const workbook = new FakeSpreadsheet([progressTab]);
let scriptProps = new Map();
/** e-mail "signed in" to Apps Script; empty = no owner to seed automatically */
let sessionEmail = "";
let uuidSeq = 0;
/** access token → identity returned by the fake Microsoft Graph */
const graphTokens = new Map();
graphTokens.set("outsider", { mail: "someone@shantalife.com", name: "Outsider" });
graphTokens.set("other-domain", { mail: "someone@gmail.com", name: "Outside Domain" });
graphTokens.set("owner-token", { mail: "Owner@ShantaLife.com", name: "Owner" });

const context = {
  console,
  SpreadsheetApp: {
    getActiveSpreadsheet: () => workbook,
    openById: () => workbook,
  },
  ContentService: {
    MimeType: { JSON: "application/json" },
    createTextOutput: (text) => ({
      text,
      setMimeType() {
        return this;
      },
      getContent() {
        return text;
      },
    }),
  },
  Session: { getEffectiveUser: () => ({ getEmail: () => sessionEmail }) },
  PropertiesService: {
    getScriptProperties: () => {
      if (!scriptProps) scriptProps = new Map();
      return {
        getProperty: (k) => (scriptProps.has(k) ? scriptProps.get(k) : null),
        setProperty: (k, v) => scriptProps.set(k, String(v)),
        deleteProperty: (k) => scriptProps.delete(k),
        getProperties: () => Object.fromEntries(scriptProps),
      };
    },
  },
  UrlFetchApp: {
    fetch: (url, options = {}) => {
      const auth = String(options.headers?.Authorization ?? "");
      const token = auth.replace(/^Bearer\s+/i, "");
      const known = graphTokens.get(token);
      const body = known
        ? { mail: known.mail, userPrincipalName: known.mail, displayName: known.name }
        : { error: { code: "InvalidAuthenticationToken" } };
      return {
        getResponseCode: () => (known ? 200 : 401),
        getContentText: () => JSON.stringify(body),
      };
    },
  },
  Utilities: {
    getUuid: () => `uuid-${(uuidSeq += 1).toString(16).padStart(4, "0")}-0000-4000-8000-000000000000`,
    formatDate: (date, _tz, pattern) => {
      const p = (n) => String(n).padStart(2, "0");
      if (pattern === "yyyy-MM-dd") return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
      return date.toISOString();
    },
  },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Logger: { log: () => {} },
  Date,
  JSON,
  Math,
  Number,
  String,
  Object,
  Array,
  Error,
  RegExp,
};
context.globalThis = context;

vm.createContext(context);
vm.runInContext(source, context, { filename: "Code.gs" });

/* ------------------------------ helpers ------------------------------ */
let failures = 0;
const check = (label, ok, extra = "") => {
  if (ok) console.log(`✓ ${label}`);
  else {
    failures += 1;
    console.error(`✗ ${label}${extra ? ` — ${extra}` : ""}`);
  }
};

const get = (params) => JSON.parse(context.doGet({ parameter: params }).text);
const post = (payload) => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(payload) } }).text);
const tab = (name) => workbook.getSheets().find((s) => s.getName() === name);

/* -------------------------------- tests ------------------------------ */
check("setup runs", context.setupHubSheets() === "OK — " + workbook.getSheets().length + " টি ট্যাব প্রস্তুত");
const names = workbook.getSheets().map((s) => s.getName());
for (const expected of ["Learners", "Quizzes", "Activations", "Responses", "Supervisors", "Zones", "Meta"]) {
  check(`tab created: ${expected}`, names.includes(expected));
}
check("existing Progress tab reused (not duplicated)", names.filter((n) => n.toLowerCase() === "progress").length === 1);

// quiz
post({
  action: "saveQuiz",
  quiz: {
    id: "quiz-1",
    title: "প্রোডাক্ট যাচাই",
    product: "Endowment",
    set: "Set 1",
    kind: "quiz",
    passMark: 70,
    origin: "custom",
    questions: [
      { id: "q1", prompt: "প্রশ্ন এক?", options: ["ক", "খ"], correct: 1, explanation: "ব্যাখ্যা" },
      { id: "q2", prompt: "প্রশ্ন এক?", options: ["ক", "খ"], correct: 0 },
    ],
  },
});
const quizzesTab = tab("Quizzes");
check("quiz row written", quizzesTab.getLastRow() === 2);
check("duplicate question deduped", JSON.parse(quizzesTab.rows[1][6]).length === 1, quizzesTab.rows[1][6]);

// activation
const activation = {
  slug: "demo-1",
  quizId: "quiz-1",
  quizTitle: "প্রোডাক্ট যাচাই",
  purpose: "সাপ্তাহিক",
  date: "2026-10-28",
  message: "মনোযোগ দিন",
  durationMinutes: 15,
  status: "active",
};
check("activation saved", post({ action: "activate", activation }).ok);

// learner + progress (adapting to the pre-existing Progress headers)
post({
  action: "saveProgress",
  learnerId: "01711111111",
  learner: { name: "রহিম উদ্দিন", mobile: "01711111111" },
  entries: [{ moduleId: "endowment", status: "completed", minutes: 12, updatedAt: "2026-10-28T04:00:00.000Z" }],
});
check("progress appended to existing tab", progressTab.getLastRow() === 3);
check("progress mapped to 'Employee Code' column", progressTab.rows[2][0] === "01711111111", JSON.stringify(progressTab.rows[2]));
check("progress mapped to 'Module' column", progressTab.rows[2][1] === "endowment");
check("progress mapped to 'State' column", progressTab.rows[2][2] === "completed");
check("existing row untouched", progressTab.rows[1][0] === "sli-0001");

// second progress update must update, not duplicate
post({
  action: "saveProgress",
  learnerId: "01711111111",
  learner: { name: "রহিম উদ্দিন" },
  entries: [{ moduleId: "endowment", status: "in_progress", minutes: 4 }],
});
check("progress upsert (no duplicate row)", progressTab.getLastRow() === 3, `rows=${progressTab.getLastRow()}`);
check("progress status updated", progressTab.rows[2][2] === "in_progress");

// submission
const attempt = {
  id: "att-1",
  learnerName: "রহিম উদ্দিন",
  mobile: "01711111111",
  employeeId: "SLI-2",
  supervisor: "ফাতেমা বেগম",
  zone: "ঢাকা উত্তর",
  quizId: "quiz-1",
  quizTitle: "প্রোডাক্ট যাচাই",
  score: 1,
  total: 2,
  percent: 50,
  passed: false,
  answers: { q1: 1, q2: 1 },
  startedAt: "2026-10-28T03:50:00.000Z",
  submittedAt: "2026-10-28T04:00:00.000Z",
  durationSeconds: 600,
};
check("submission accepted", post({ action: "submit", attempt }).ok);
check("response row written", tab("Responses").getLastRow() === 2);
check("learner auto-registered", tab("Learners").getLastRow() === 2, `rows=${tab("Learners").getLastRow()}`);

// replaying the same attempt must not duplicate
post({ action: "submit", attempt });
check("duplicate submission rejected", tab("Responses").getLastRow() === 2, `rows=${tab("Responses").getLastRow()}`);

// bootstrap payload
const boot = get({ action: "bootstrap", learnerId: "sli-2" }); // employeeId of the same learner
check("bootstrap ok", boot.ok === true);
check("bootstrap returns quiz with questions", boot.quizzes?.[0]?.questions?.length === 1);
check("bootstrap returns activation", boot.activations?.[0]?.slug === "demo-1");
check("bootstrap resolves learner by any alias (employeeId → progress)", boot.progress?.length === 1, JSON.stringify(boot.progress));
// progress written under the mobile number must still be found after the
// employee ID is added — this used to silently orphan history.
post({ action: "saveProgress", learnerId: "01711111111", learner: { name: "রহিম উদ্দিন" }, entries: [{ moduleId: "s4pp", status: "in_progress", minutes: 3 }] });
const boot2 = get({ action: "bootstrap", learnerId: "sli-2" });
check("progress written under mobile is found via employeeId", boot2.progress?.length === 2, JSON.stringify(boot2.progress));
check("bootstrap returns learner results", boot.results?.length === 1);
check("bootstrap results carry answers", boot.results[0].answers.q1 === 1);

// lists
post({ action: "saveLists", supervisors: ["ফাতেমা বেগম", "আরিফ"], zones: ["ঢাকা উত্তর"] });
const lists = get({ action: "supervisors" });
check("supervisors saved", lists.supervisors.length === 2, JSON.stringify(lists.supervisors));
check("zones saved", lists.zones.length === 1);

// close / reopen
post({ action: "closeActivation", slug: "demo-1" });
check("activation closed", get({ action: "bootstrap" }).activations[0].status === "closed");
post({ action: "reopenActivation", slug: "demo-1" });
check("activation reopened", get({ action: "bootstrap" }).activations[0].status === "active");

// health
const health = get({ action: "health" });
check("health ok", health.ok === true && health.version === "3.0.0");
check("health counts responses", health.responses === 1, `responses=${health.responses}`);

// delete
post({ action: "deleteQuiz", id: "quiz-1" });
check("quiz deleted", tab("Quizzes").getLastRow() === 1, `rows=${tab("Quizzes").getLastRow()}`);

// unknown action
check("unknown action is reported", get({ action: "nope" }).ok === false);
check("bad post payload is reported", JSON.parse(context.doPost({}).text).ok === false);

/* --------------------------- admin auth ----------------------------- */
check("Admins tab starts empty", tab("Admins").getLastRow() === 1, JSON.stringify(tab("Admins").rows));
check("first run leaves admin writes open", get({ action: "bootstrap" }).adminRequired === false);
check("admin mutation allowed on an empty Admins list", post({ action: "deleteQuiz", id: "nope" }).ok === true);

tab("Admins").appendRow(["owner@shantalife.com", "Owner", new Date().toISOString()]);
check("bootstrap reports adminRequired once Admins is non-empty", get({ action: "bootstrap" }).adminRequired === true);
check(
  "admin mutation without a session is rejected",
  post({ action: "deleteQuiz", id: "nope" }).code === 401,
  JSON.stringify(post({ action: "deleteQuiz", id: "nope" })),
);
check("admin login rejects a bad Microsoft token", post({ action: "adminLogin", accessToken: "bad" }).ok === false);

graphTokens.set("good-token", { mail: "Trainer@ShantaLife.com", name: "ট্রেইনার" });
const outsider = post({ action: "adminLogin", accessToken: "outsider" });
check("non-listed account is refused", outsider.ok === false, JSON.stringify(outsider));

const ownerLogin = post({ action: "adminLogin", accessToken: "owner-token" });
check("listed account gets a session", ownerLogin.ok === true && ownerLogin.token?.length > 20, JSON.stringify(ownerLogin));
check("session carries the normalised email", ownerLogin.admin?.email === "owner@shantalife.com");
check("session expiry is ~8h ahead", Date.parse(ownerLogin.expiresAt) - Date.now() > 7.9 * 3600 * 1000);

const sess = { sessionToken: ownerLogin.token };
check("session validates via adminSession", post({ action: "adminSession", ...sess }).admin?.email === "owner@shantalife.com");
check("admin mutation accepted with a session", post({ action: "deleteQuiz", id: "nope", ...sess }).ok === true);
check("bogus session is rejected", post({ action: "deleteQuiz", id: "nope", sessionToken: "sess_forged" }).code === 401);

// domain gate (only when adminDomain is configured)
context.setAuthConfig("contoso.onmicrosoft.com", "client-123", "shantalife.com");
const cfgBoot = get({ action: "bootstrap" });
check("bootstrap exposes the public auth config", cfgBoot.auth?.clientId === "client-123" && cfgBoot.auth?.tenantId === "contoso.onmicrosoft.com");
check("bootstrap exposes the admin domain", cfgBoot.auth?.domain === "shantalife.com");
check("wrong-domain account is refused", post({ action: "adminLogin", accessToken: "other-domain" }).ok === false);
check("right-domain but unlisted account is refused", post({ action: "adminLogin", accessToken: "good-token" }).ok === false);

// an unlisted, right-domain account on an *empty* Admins list becomes the first admin
tab("Admins").rows = tab("Admins").rows.slice(0, 1);
const firstAdmin = post({ action: "adminLogin", accessToken: "owner-token" });
check("first sign-in seeds the Admins list", firstAdmin.ok === true && tab("Admins").getLastRow() === 2, JSON.stringify(tab("Admins").rows));

// expiry — rewrite the stored session far in the past
const storedKey = [...scriptProps.keys()].find((k) => k.endsWith(ownerLogin.token));
const stored = JSON.parse(scriptProps.get(storedKey));
scriptProps.set(storedKey, JSON.stringify({ ...stored, expiresAt: new Date(Date.now() - 1000).toISOString() }));
check("expired session is rejected", post({ action: "adminSession", ...sess }).ok === false);
check("expired session is deleted", !scriptProps.has(storedKey));

const secondLogin = post({ action: "adminLogin", accessToken: "owner-token" });
check("logout kills the session", post({ action: "adminLogout", sessionToken: secondLogin.token }).ok === true);
check("session gone after logout", post({ action: "adminSession", sessionToken: secondLogin.token }).ok === false);

if (failures) {
  console.error(`\n${failures} backend check(s) failed`);
  process.exit(1);
}
console.log("\nAll backend checks passed.");
