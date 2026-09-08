import type { Band, DesignSettings, SchoolSettings, Subject } from "./workspace-model";

export const LOCAL_RESULTS_KEY = "gradly-local-results-v1";
export const LOCAL_DRAFT_KEY = "gradly-local-draft-v1";

export type ResultTotals = {
  total: number;
  obtained: number;
  percent: number;
  result: "PASS" | "FAIL";
  grade: string;
};

export type LocalResult = {
  report_id: string;
  created_at: string;
  updated_at: string;
  school: SchoolSettings;
  design: DesignSettings;
  student: string;
  father: string;
  roll: string;
  klass: string;
  session: string;
  exam: string;
  dob: string;
  attendance: number;
  position: number;
  photo: string;
  subjects: Subject[];
  bands: Band[];
  teacherRemarks: string;
  principalRemarks: string;
  totals: ResultTotals;
};

export type LocalDraft = Omit<LocalResult, "report_id" | "created_at" | "updated_at" | "totals">;

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function createLocalReportId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GRD-${stamp}-${random}`;
}

export function readLocalResults(): LocalResult[] {
  const storage = browserStorage();
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(LOCAL_RESULTS_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is LocalResult => Boolean(item && typeof item.report_id === "string"))
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  } catch {
    return [];
  }
}

export function getLocalResult(reportId: string) {
  return readLocalResults().find((item) => item.report_id === reportId) || null;
}

export function saveLocalResult(result: LocalResult) {
  const storage = browserStorage();
  if (!storage) throw new Error("Browser storage is not available.");

  const current = readLocalResults();
  const existing = current.find((item) => item.report_id === result.report_id);
  const saved: LocalResult = {
    ...result,
    created_at: existing?.created_at || result.created_at,
    updated_at: new Date().toISOString(),
  };
  const next = [saved, ...current.filter((item) => item.report_id !== result.report_id)];

  try {
    storage.setItem(LOCAL_RESULTS_KEY, JSON.stringify(next));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new Error("Browser storage is full. Remove older saved results or use a smaller student photo.");
    }
    throw error;
  }
  window.dispatchEvent(new CustomEvent("gradly-local-results-changed"));
  return saved;
}

export function deleteLocalResult(reportId: string) {
  const storage = browserStorage();
  if (!storage) return;
  const next = readLocalResults().filter((item) => item.report_id !== reportId);
  storage.setItem(LOCAL_RESULTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("gradly-local-results-changed"));
}

export function saveLocalDraft(draft: LocalDraft) {
  const storage = browserStorage();
  if (!storage) return;
  try {
    storage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Draft persistence is best-effort; explicit result saving reports storage errors.
  }
}

export function readLocalDraft(): LocalDraft | null {
  const storage = browserStorage();
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(LOCAL_DRAFT_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed as LocalDraft : null;
  } catch {
    return null;
  }
}

export function clearLocalDraft() {
  browserStorage()?.removeItem(LOCAL_DRAFT_KEY);
}
