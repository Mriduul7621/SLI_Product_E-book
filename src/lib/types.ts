/**
 * Shared domain types for Shanta Life Learning Hub.
 * The same shapes travel through the UI, the offline store and the
 * Google Apps Script backend, so a record written locally can be
 * replayed into the sheet without translation.
 */

export type ModuleStatus = "not_started" | "in_progress" | "completed";

export type Part = "foundation" | "products" | "underwriting" | "mastery";

export type Question = {
  id: string;
  prompt: string;
  options: string[];
  /** index into `options` */
  correct: number;
  explanation?: string;
  type?: "MCQ" | "TrueFalse";
};

export type Quiz = {
  id: string;
  title: string;
  /** product / module grouping used for filters and reporting */
  product: string;
  set: string;
  kind: "quiz" | "survey";
  passMark: number;
  questions: Question[];
  /** "builtin" quizzes ship with the app; "custom" ones live in the sheet */
  origin: "builtin" | "custom";
  createdAt?: string;
};

export type Activation = {
  slug: string;
  quizId: string;
  quizTitle: string;
  purpose: string;
  date: string;
  message: string;
  durationMinutes: number;
  status: "active" | "closed";
  createdAt: string;
};

export type Learner = {
  name: string;
  mobile: string;
  employeeId: string;
  supervisor: string;
  zone: string;
  designation: string;
  joinedAt?: string;
};

export type ProgressEntry = {
  moduleId: string;
  moduleTitle?: string;
  status: ModuleStatus;
  minutes: number;
  updatedAt: string;
  synced: boolean;
};

export type Attempt = {
  id: string;
  quizId: string;
  quizTitle: string;
  learnerName: string;
  mobile: string;
  employeeId: string;
  supervisor: string;
  zone: string;
  score: number;
  total: number;
  percent: number;
  passed: boolean;
  answers: Record<string, number>;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  /** activation slug when the learner arrived through a share link */
  sourceSlug?: string;
  synced: boolean;
};

export type LearningModule = {
  id: string;
  number: string;
  title: string;
  titleEn: string;
  tagline: string;
  part: Part;
  minutes: number;
  image?: string;
  quizId?: string;
};

export type Catalog = {
  quizzes: Quiz[];
  activations: Activation[];
  supervisors: string[];
  zones: string[];
};

export type SyncStatus = "idle" | "syncing" | "error" | "offline";
