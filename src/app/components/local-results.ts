import type { Band, DesignSettings, SchoolSettings, Subject } from "./workspace-model";

export const LOCAL_RESULTS_KEY = "gradly-local-results-v1";
export const LOCAL_DRAFT_KEY = "gradly-local-draft-v1";

const DB_NAME = "gradly-offline-db";
const DB_VERSION = 2;
const RESULTS_STORE = "results";
const DRAFTS_STORE = "drafts";
const CURRENT_DRAFT_ID = "current";
const MIGRATION_FLAG = "gradly-results-migrated-to-idb-v1";
let migrationChecked = false;

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
  teacherSignature?: string;
  principalSignature?: string;
  totals: ResultTotals;
};

export type LocalDraft = Omit<LocalResult, "report_id" | "created_at" | "updated_at" | "totals"> & {
  editingReportId?: string;
};

type StoredDraft = LocalDraft & {
  id: string;
  updated_at: string;
};

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function normalizeResult(result: LocalResult): LocalResult {
  return {
    ...result,
    photo: result.photo || "",
    teacherSignature: result.teacherSignature || "",
    principalSignature: result.principalSignature || "",
  };
}

function normalizeDraft(draft: LocalDraft): LocalDraft {
  return {
    ...draft,
    photo: draft.photo || "",
    teacherSignature: draft.teacherSignature || "",
    principalSignature: draft.principalSignature || "",
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RESULTS_STORE)) {
        const store = db.createObjectStore(RESULTS_STORE, { keyPath: "report_id" });
        store.createIndex("updated_at", "updated_at", { unique: false });
      }
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open browser database."));
    request.onblocked = () => reject(new Error("Browser storage upgrade is blocked. Close other Gradly tabs and try again."));
  });
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Browser database request failed."));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Browser database transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("Browser database transaction was cancelled."));
  });
}

async function migrateLegacyLocalStorageResults() {
  if (migrationChecked || typeof window === "undefined") return;
  migrationChecked = true;

  const storage = browserStorage();
  if (!storage || storage.getItem(MIGRATION_FLAG) === "yes") return;

  try {
    const parsed = JSON.parse(storage.getItem(LOCAL_RESULTS_KEY) || "[]");
    if (!Array.isArray(parsed) || parsed.length === 0) {
      try { storage.setItem(MIGRATION_FLAG, "yes"); } catch {}
      return;
    }

    const legacyResults = parsed.filter(
      (item): item is LocalResult => Boolean(item && typeof item.report_id === "string"),
    );

    if (legacyResults.length) {
      const db = await openDb();
      const transaction = db.transaction(RESULTS_STORE, "readwrite");
      const store = transaction.objectStore(RESULTS_STORE);
      legacyResults.forEach((result) => store.put(normalizeResult(result)));
      await transactionDone(transaction);
      db.close();
    }

    storage.removeItem(LOCAL_RESULTS_KEY);
    try { storage.setItem(MIGRATION_FLAG, "yes"); } catch {}
  } catch {
    migrationChecked = false;
  }
}

async function migrateLegacyDraftIfNeeded() {
  const storage = browserStorage();
  if (!storage) return;

  const legacyRaw = storage.getItem(LOCAL_DRAFT_KEY);
  if (!legacyRaw) return;

  try {
    const parsed = JSON.parse(legacyRaw);
    if (!parsed || typeof parsed !== "object") {
      storage.removeItem(LOCAL_DRAFT_KEY);
      return;
    }

    const db = await openDb();
    try {
      const transaction = db.transaction(DRAFTS_STORE, "readwrite");
      const store = transaction.objectStore(DRAFTS_STORE);
      const current = await requestToPromise(store.get(CURRENT_DRAFT_ID));
      if (!current) {
        store.put({
          id: CURRENT_DRAFT_ID,
          updated_at: new Date().toISOString(),
          ...normalizeDraft(parsed as LocalDraft),
        } satisfies StoredDraft);
      }
      await transactionDone(transaction);
      storage.removeItem(LOCAL_DRAFT_KEY);
    } finally {
      db.close();
    }
  } catch {
    // Keep the legacy draft if migration fails so text data is not lost.
  }
}

export function createLocalReportId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GRD-${stamp}-${random}`;
}

export async function readLocalResults(): Promise<LocalResult[]> {
  await migrateLegacyLocalStorageResults();
  const db = await openDb();
  try {
    const transaction = db.transaction(RESULTS_STORE, "readonly");
    const results = await requestToPromise(transaction.objectStore(RESULTS_STORE).getAll());
    return (Array.isArray(results) ? results : [])
      .filter((item): item is LocalResult => Boolean(item && typeof item.report_id === "string"))
      .map(normalizeResult)
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  } finally {
    db.close();
  }
}

export async function getLocalResult(reportId: string): Promise<LocalResult | null> {
  await migrateLegacyLocalStorageResults();
  const db = await openDb();
  try {
    const transaction = db.transaction(RESULTS_STORE, "readonly");
    const result = await requestToPromise(transaction.objectStore(RESULTS_STORE).get(reportId));
    return result ? normalizeResult(result as LocalResult) : null;
  } finally {
    db.close();
  }
}

export async function saveLocalResult(result: LocalResult): Promise<LocalResult> {
  await migrateLegacyLocalStorageResults();
  const existing = await getLocalResult(result.report_id);
  const saved = normalizeResult({
    ...result,
    created_at: existing?.created_at || result.created_at,
    updated_at: new Date().toISOString(),
  });

  const db = await openDb();
  try {
    const transaction = db.transaction(RESULTS_STORE, "readwrite");
    transaction.objectStore(RESULTS_STORE).put(saved);
    await transactionDone(transaction);
  } catch (error) {
    if (error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "UnknownError")) {
      throw new Error("Browser storage is full. Remove older saved results or reduce image sizes.");
    }
    throw error;
  } finally {
    db.close();
  }

  window.dispatchEvent(new CustomEvent("gradly-local-results-changed"));
  return saved;
}

export async function deleteLocalResult(reportId: string) {
  await migrateLegacyLocalStorageResults();
  const db = await openDb();
  try {
    const transaction = db.transaction(RESULTS_STORE, "readwrite");
    transaction.objectStore(RESULTS_STORE).delete(reportId);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
  window.dispatchEvent(new CustomEvent("gradly-local-results-changed"));
}

export async function saveLocalDraft(draft: LocalDraft) {
  const db = await openDb();
  try {
    const transaction = db.transaction(DRAFTS_STORE, "readwrite");
    transaction.objectStore(DRAFTS_STORE).put({
      id: CURRENT_DRAFT_ID,
      updated_at: new Date().toISOString(),
      ...normalizeDraft(draft),
    } satisfies StoredDraft);
    await transactionDone(transaction);
  } catch {
    // Draft persistence is best-effort and should never interrupt typing.
  } finally {
    db.close();
  }
}

export async function readLocalDraft(): Promise<LocalDraft | null> {
  await migrateLegacyDraftIfNeeded();
  const db = await openDb();
  try {
    const transaction = db.transaction(DRAFTS_STORE, "readonly");
    const stored = await requestToPromise(transaction.objectStore(DRAFTS_STORE).get(CURRENT_DRAFT_ID));
    if (!stored) return null;
    const { id: _id, updated_at: _updatedAt, ...draft } = stored as StoredDraft;
    return normalizeDraft(draft);
  } finally {
    db.close();
  }
}

export async function clearLocalDraft() {
  browserStorage()?.removeItem(LOCAL_DRAFT_KEY);
  const db = await openDb();
  try {
    const transaction = db.transaction(DRAFTS_STORE, "readwrite");
    transaction.objectStore(DRAFTS_STORE).delete(CURRENT_DRAFT_ID);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}
