/**
 * Offline-first data layer for the Learning Hub.
 *
 * Every learner action is written to localStorage first and then replayed to
 * the Google Apps Script backend that lives inside the Learning Hub
 * spreadsheet. If the sheet is unreachable (classroom wifi, no deployment yet)
 * the app keeps working and the queue drains automatically on the next visit.
 */

import { useSyncExternalStore } from "react";
import { dateKey, isoDay, uid } from "@/lib/format";
import { BUILTIN_QUIZZES, MODULES } from "@/data/curriculum";
import type {
  Activation,
  Attempt,
  Catalog,
  Learner,
  ProgressEntry,
  Quiz,
  SyncStatus,
} from "@/lib/types";

const LS_KEY = "sli_learning_hub_v1";

/** The Learning Hub spreadsheet — every tab of the hub is created inside it. */
export const HUB_SHEET_ID = "1EYJwZDV99DPUcMWdC3LZP_7f1EyVJ2n-Yk_mb0k4Qnc";
export const HUB_SHEET_URL = `https://docs.google.com/spreadsheets/d/${HUB_SHEET_ID}/edit`;

type QueueItem =
  | { kind: "learner"; payload: Learner }
  | { kind: "progress"; payload: ProgressEntry[] }
  | { kind: "attempt"; payload: Attempt }
  | { kind: "quiz"; payload: Quiz }
  | { kind: "deleteQuiz"; payload: { id: string } }
  | { kind: "activation"; payload: Activation }
  | { kind: "close"; payload: { slug: string; closed: boolean } }
  | { kind: "lists"; payload: { supervisors: string[]; zones: string[] } };

type Settings = { apiUrl: string };

type State = {
  learner: Learner;
  progress: Record<string, ProgressEntry>;
  attempts: Attempt[];
  customQuizzes: Quiz[];
  activations: Activation[];
  supervisors: string[];
  zones: string[];
  settings: Settings;
  queue: QueueItem[];
  sync: { status: SyncStatus; lastSyncAt: string; error: string };
};

const emptyLearner: Learner = {
  name: "",
  mobile: "",
  employeeId: "",
  supervisor: "",
  zone: "",
  designation: "",
};

function readApiFromUrl(): string {
  if (typeof window === "undefined") return "";
  const fromQuery = new URLSearchParams(window.location.search).get("api");
  if (fromQuery) {
    try {
      const decoded = decodeURIComponent(fromQuery);
      window.localStorage.setItem("sli_hub_api", decoded);
      return decoded;
    } catch {
      return fromQuery;
    }
  }
  return window.localStorage.getItem("sli_hub_api") ?? "";
}

function defaultState(): State {
  return {
    learner: { ...emptyLearner },
    progress: {},
    attempts: [],
    customQuizzes: [],
    activations: [],
    supervisors: [],
    zones: [],
    settings: { apiUrl: readApiFromUrl() },
    queue: [],
    sync: { status: "idle", lastSyncAt: "", error: "" },
  };
}

function load(): State {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<State>;
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      learner: { ...base.learner, ...(parsed.learner ?? {}) },
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      sync: { ...base.sync, ...(parsed.sync ?? {}) },
      progress: parsed.progress ?? {},
      attempts: parsed.attempts ?? [],
      customQuizzes: parsed.customQuizzes ?? [],
      activations: parsed.activations ?? [],
      supervisors: parsed.supervisors ?? [],
      zones: parsed.zones ?? [],
      queue: parsed.queue ?? [],
    };
  } catch {
    return defaultState();
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function commit(next: State, persist = true) {
  state = next;
  if (persist && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* storage disabled — the app still works for this session */
    }
  }
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState(): State {
  return state;
}

/** Subscribe a component to a slice of the hub state. */
export function useHub<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

/* ------------------------------------------------------------------ */
/* Remote bridge                                                       */
/* ------------------------------------------------------------------ */

const TIMEOUT_MS = 15000;

export const hasRemote = (): boolean => Boolean(state.settings.apiUrl.trim());

async function remoteGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const base = state.settings.apiUrl.trim();
  if (!base) throw new Error("no-api");
  const url = new URL(base);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    const json = await res.json();
    if (!json || json.ok !== true) throw new Error(json?.error ?? "remote-error");
    return json as T;
  } finally {
    clearTimeout(timer);
  }
}

async function remotePost(payload: Record<string, unknown>): Promise<void> {
  const base = state.settings.apiUrl.trim();
  if (!base) throw new Error("no-api");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({ ok: true }));
    if (json && json.ok === false) throw new Error(json.error ?? "remote-error");
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Sync engine                                                         */
/* ------------------------------------------------------------------ */

let flushing = false;

async function flushOnce(): Promise<void> {
  if (flushing || !hasRemote() || state.queue.length === 0) return;
  flushing = true;
  commit({ ...state, sync: { ...state.sync, status: "syncing", error: "" } });

  const pending: QueueItem[] = [...state.queue];
  const sent: QueueItem[] = [];
  let failure = "";

  for (const item of pending) {
    try {
      if (item.kind === "learner") {
        await remotePost({ action: "registerLearner", learner: { ...item.payload, learnerId: learnerKey() } });
      } else if (item.kind === "progress") {
        await remotePost({
          action: "saveProgress",
          learnerId: learnerKey(),
          learner: state.learner,
          entries: item.payload,
        });
      } else if (item.kind === "attempt") {
        await remotePost({ action: "submit", attempt: item.payload });
      } else if (item.kind === "quiz") {
        await remotePost({ action: "saveQuiz", quiz: item.payload });
      } else if (item.kind === "deleteQuiz") {
        await remotePost({ action: "deleteQuiz", id: item.payload.id });
      } else if (item.kind === "activation") {
        await remotePost({ action: "activate", activation: item.payload });
      } else if (item.kind === "close") {
        await remotePost({
          action: item.payload.closed ? "closeActivation" : "reopenActivation",
          slug: item.payload.slug,
        });
      } else if (item.kind === "lists") {
        await remotePost({ action: "saveLists", ...item.payload });
      }
      sent.push(item);
      if (item.kind === "attempt") {
        commit({
          ...state,
          attempts: state.attempts.map((a) => (a.id === item.payload.id ? { ...a, synced: true } : a)),
        });
      } else if (item.kind === "progress") {
        const ids = item.payload.map((p) => p.moduleId);
        const progress = { ...state.progress };
        ids.forEach((id) => {
          if (progress[id]) progress[id] = { ...progress[id], synced: true };
        });
        commit({ ...state, progress });
      }
    } catch (err) {
      failure = err instanceof Error ? err.message : String(err);
      break;
    }
  }

  flushing = false;
  // Re-read the live queue: items enqueued while this flush was running must
  // survive, and successfully sent items are matched by identity.
  const left = state.queue.filter((q) => !sent.includes(q));
  commit({
    ...state,
    queue: left,
    sync: {
      status: failure ? "error" : "idle",
      lastSyncAt: failure ? state.sync.lastSyncAt : new Date().toISOString(),
      error: failure,
    },
  });

  // Anything enqueued while this flush was in flight gets its own pass.
  if (!failure && left.length) {
    setTimeout(() => void flushOnce(), 0);
  }
}

export function syncNow(): void {
  void flushOnce();
}

function enqueue(item: QueueItem) {
  const next = { ...state, queue: [...state.queue.filter((q) => !sameMutation(q, item)), item] };
  commit(next);
  void flushOnce();
}

/** Collapses repeated progress pushes for the same module into one. */
function sameMutation(a: QueueItem, b: QueueItem): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "progress" && b.kind === "progress") {
    return a.payload[0]?.moduleId === b.payload[0]?.moduleId;
  }
  if (a.kind === "learner") return true;
  if (a.kind === "lists") return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Public actions                                                      */
/* ------------------------------------------------------------------ */

export function learnerKey(): string {
  const { employeeId, mobile, name } = state.learner;
  return (employeeId || mobile || name || "guest").trim().toLowerCase();
}

export function saveLearner(learner: Learner): void {
  commit({ ...state, learner });
  enqueue({ kind: "learner", payload: learner });
}

export function setApiUrl(apiUrl: string): void {
  const trimmed = apiUrl.trim();
  if (typeof window !== "undefined") {
    if (trimmed) window.localStorage.setItem("sli_hub_api", trimmed);
    else window.localStorage.removeItem("sli_hub_api");
  }
  commit({ ...state, settings: { ...state.settings, apiUrl: trimmed } });
}

export function markModule(moduleId: string, status: ProgressEntry["status"]): void {
  const previous = state.progress[moduleId];
  const module = MODULES.find((m) => m.id === moduleId);
  const entry: ProgressEntry = {
    moduleId,
    moduleTitle: module?.title ?? "",
    status,
    minutes: module?.minutes ?? 0,
    updatedAt: new Date().toISOString(),
    synced: false,
  };
  if (previous?.status === "completed" && status !== "completed") return;
  commit({ ...state, progress: { ...state.progress, [moduleId]: entry } });
  enqueue({ kind: "progress", payload: [entry] });
}

export function recordAttempt(attempt: Attempt): void {
  commit({
    ...state,
    attempts: [attempt, ...state.attempts.filter((a) => a.id !== attempt.id)].slice(0, 500),
  });
  // remember the learner's identity from the attempt so the profile stays fresh
  if (!state.learner.name && attempt.learnerName) {
    saveLearner({ ...state.learner, name: attempt.learnerName, mobile: attempt.mobile });
  }
  enqueue({ kind: "attempt", payload: attempt });
}

export function saveQuiz(quiz: Quiz): void {
  commit({ ...state, customQuizzes: [quiz, ...state.customQuizzes.filter((q) => q.id !== quiz.id)] });
  enqueue({ kind: "quiz", payload: quiz });
}

export function deleteQuiz(id: string): void {
  commit({ ...state, customQuizzes: state.customQuizzes.filter((q) => q.id !== id) });
  enqueue({ kind: "deleteQuiz", payload: { id } });
}

export function saveActivation(activation: Activation): void {
  commit({
    ...state,
    activations: [activation, ...state.activations.filter((a) => a.slug !== activation.slug)],
  });
  enqueue({ kind: "activation", payload: activation });
}

export function setActivationStatus(slug: string, closed: boolean): void {
  commit({
    ...state,
    activations: state.activations.map((a) =>
      a.slug === slug ? { ...a, status: closed ? "closed" : "active" } : a,
    ),
  });
  enqueue({ kind: "close", payload: { slug, closed } });
}

export function saveLists(lists: { supervisors?: string[]; zones?: string[] }): void {
  const next = {
    supervisors: lists.supervisors ?? state.supervisors,
    zones: lists.zones ?? state.zones,
  };
  commit({ ...state, ...next });
  enqueue({ kind: "lists", payload: next });
}

export function resetLocal(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(LS_KEY);
  commit(defaultState());
}

/* ------------------------------------------------------------------ */
/* Bootstrap from the sheet                                            */
/* ------------------------------------------------------------------ */

export async function bootstrap(): Promise<{ ok: boolean; message: string }> {
  if (!hasRemote()) return { ok: false, message: "Apps Script URL সেট করা নেই" };
  try {
    const data = await remoteGet<Catalog & { ok: boolean; learner?: Learner; progress?: ProgressEntry[]; results?: Attempt[] }>(
      "bootstrap",
      { learnerId: learnerKey() },
    );
    const remoteQuizzes = (data.quizzes ?? []).filter((q) => q?.id && q.origin !== "builtin");
    const mergedQuizzes = [
      ...remoteQuizzes,
      ...state.customQuizzes.filter((q) => !remoteQuizzes.some((r) => r.id === q.id)),
    ];
    const progress: Record<string, ProgressEntry> = { ...state.progress };
    (data.progress ?? []).forEach((p) => {
      const local = progress[p.moduleId];
      if (!local || (local.status !== "completed" && p.status === "completed")) {
        progress[p.moduleId] = { ...p, synced: true };
      }
    });
    const attempts = [...state.attempts];
    (data.results ?? []).forEach((r) => {
      if (!attempts.some((a) => a.id === r.id)) attempts.push({ ...r, synced: true });
    });
    attempts.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

    commit({
      ...state,
      customQuizzes: mergedQuizzes,
      activations: data.activations ?? state.activations,
      supervisors: data.supervisors?.length ? data.supervisors : state.supervisors,
      zones: data.zones?.length ? data.zones : state.zones,
      progress,
      attempts,
      sync: { status: "idle", lastSyncAt: new Date().toISOString(), error: "" },
    });
    void flushOnce();
    return { ok: true, message: "Learning Hub শিটের সাথে সংযুক্ত" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    commit({ ...state, sync: { ...state.sync, status: "error", error: message } });
    return { ok: false, message };
  }
}

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await remoteGet<{ ok: boolean; app?: string; sheets?: string[] }>("health");
    return { ok: true, message: `${res.app ?? "Apps Script"} · ট্যাব: ${(res.sheets ?? []).length}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

/* ------------------------------------------------------------------ */
/* Derived selectors                                                   */
/* ------------------------------------------------------------------ */

export function allQuizzes(): Quiz[] {
  return [...state.customQuizzes, ...BUILTIN_QUIZZES];
}

export function findQuiz(id: string): Quiz | undefined {
  return allQuizzes().find((q) => q.id === id);
}

export function progressOf(moduleId: string): ProgressEntry | undefined {
  return state.progress[moduleId];
}

export function completionRate(): number {
  const done = MODULES.filter((m) => state.progress[m.id]?.status === "completed").length;
  return MODULES.length ? Math.round((done / MODULES.length) * 100) : 0;
}

export function nextModule() {
  const started = MODULES.find((m) => state.progress[m.id]?.status === "in_progress");
  if (started) return started;
  return MODULES.find((m) => state.progress[m.id]?.status !== "completed") ?? MODULES[0];
}

export function averageScore(): number {
  const scored = state.attempts.filter((a) => a.total > 0);
  if (!scored.length) return 0;
  return Math.round(scored.reduce((s, a) => s + a.percent, 0) / scored.length);
}

/** Consecutive days (ending today or yesterday) with any learning activity. */
export function streakDays(): number {
  const days = new Set<string>();
  Object.values(state.progress).forEach((p) => {
    if (p.status !== "not_started") days.add(isoDay(p.updatedAt));
  });
  state.attempts.forEach((a) => days.add(isoDay(a.submittedAt)));
  if (!days.size) return 0;
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function bestScoreFor(quizId: string): number | null {
  const scored = state.attempts.filter((a) => a.quizId === quizId);
  if (!scored.length) return null;
  return Math.max(...scored.map((a) => a.percent));
}

export function attemptsFor(quizId: string): Attempt[] {
  return state.attempts.filter((a) => a.quizId === quizId);
}

export function activeActivations(): Activation[] {
  return state.activations.filter((a) => a.status === "active");
}

export function newAttemptId(): string {
  return uid("att");
}
