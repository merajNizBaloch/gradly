"use client";

import { useEffect, useRef } from "react";
import { readLocalDraft, saveLocalDraft, type LocalDraft } from "./local-results";
import { defaultBands, defaultSchool, initialSubjects, type DesignSettings } from "./workspace-model";

const SCHOOL_KEY = "gradly-school-profile-v2";
const DESIGN_KEY = "gradly-design-v2";

const DEFAULT_DESIGN: DesignSettings = {
  template: "academic",
  theme: "academic-navy",
  paperSize: "a4",
  customWidth: "210",
  customHeight: "297",
};

const PLACEHOLDERS: Record<string, string> = {
  "student name": "e.g. Ayesha Khan",
  "father / guardian": "e.g. Muhammad Imran",
  "roll number": "e.g. 0148",
  "class & section": "e.g. Grade 8 — Section A",
  session: "e.g. 2025–26",
  exam: "e.g. Annual Examination",
};

function safeJson<T extends object>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

function workspaceForm() {
  return document.querySelector<HTMLElement>("main > header.no-print + div > section.no-print");
}

function findField(labelText: string) {
  const form = workspaceForm();
  if (!form) return null;
  const label = Array.from(form.querySelectorAll("label")).find(
    (item) => item.querySelector("span")?.textContent?.trim().toLowerCase() === labelText,
  );
  return label?.querySelector<HTMLInputElement>("input") || null;
}

function applyPlaceholders() {
  for (const [label, placeholder] of Object.entries(PLACEHOLDERS)) {
    const input = findField(label);
    if (input && !input.placeholder) input.placeholder = placeholder;
  }
}

function blankInitialDraft(): LocalDraft {
  return {
    school: safeJson(SCHOOL_KEY, defaultSchool),
    design: safeJson(DESIGN_KEY, DEFAULT_DESIGN),
    student: "",
    father: "",
    roll: "",
    klass: "",
    session: "",
    exam: "",
    dob: "",
    attendance: 0,
    position: 0,
    photo: "",
    subjects: initialSubjects.map((item) => ({ ...item, obtained: 0 })),
    bands: defaultBands.map((item) => ({ ...item })),
    teacherRemarks: "",
    principalRemarks: "",
    teacherSignature: "",
    principalSignature: "",
    editingReportId: undefined,
  };
}

async function persistBatchBlankDraft() {
  const existing = await readLocalDraft();
  const base = existing || blankInitialDraft();

  await saveLocalDraft({
    ...base,
    student: "",
    father: "",
    roll: "",
    // Batch-entry fields intentionally remain unchanged:
    // klass, session, exam, subject names/max marks, bands, school and design.
    dob: "",
    attendance: 0,
    position: 0,
    photo: "",
    subjects: (base.subjects?.length ? base.subjects : initialSubjects).map((item) => ({
      ...item,
      obtained: 0,
    })),
    teacherRemarks: "",
    principalRemarks: "",
    teacherSignature: "",
    principalSignature: "",
    editingReportId: undefined,
  });
}

function isSavedCurrentRecord() {
  const form = workspaceForm();
  if (!form) return false;
  return Array.from(form.querySelectorAll("button")).some((button) =>
    /^Update browser save$/i.test(button.textContent?.replace(/\s+/g, " ").trim() || ""),
  );
}

function isNewStudentAction(button: HTMLButtonElement) {
  const text = button.textContent?.replace(/\s+/g, " ").trim() || "";
  return /^(?:Add new student|Start next student)$/i.test(text);
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not prepare the student photo."));
    };
    image.src = url;
  });
}

async function compressStudentPhoto(file: File) {
  const image = await loadImage(file);
  const maxWidth = 900;
  const maxHeight = 1200;
  const scale = Math.min(1, maxWidth / Math.max(1, image.naturalWidth), maxHeight / Math.max(1, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) return file;
  if (blob.size >= file.size && file.size < 900_000) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "student-photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

function isStudentPhotoInput(input: HTMLInputElement) {
  return input.type === "file" && input.accept.trim() === "image/*";
}

export default function WorkspaceProductivity() {
  const resettingRef = useRef(false);

  useEffect(() => {
    let active = true;
    const placeholderTimer = window.setTimeout(applyPlaceholders, 500);

    // A browser with no active draft should begin with a genuinely blank result,
    // not the internal demo values used by the workspace component.
    void readLocalDraft().then(async (draft) => {
      if (!active) return;
      const editing = new URL(window.location.href).searchParams.has("edit");
      if (draft || editing) return;
      await saveLocalDraft(blankInitialDraft());
      if (active) window.location.replace("/");
    });

    const onFocusIn = () => applyPlaceholders();

    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>("button");
      if (!button || !isNewStudentAction(button) || resettingRef.current) return;

      const saved = isSavedCurrentRecord();
      if (!saved) {
        const proceed = window.confirm("This result has not been saved yet. Start a new student and discard the current unsaved result?");
        if (!proceed) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }
      }

      // Own the reset before the older document-level helper sees the click.
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      resettingRef.current = true;
      button.disabled = true;

      void persistBatchBlankDraft()
        .then(() => window.location.replace("/"))
        .catch(() => {
          resettingRef.current = false;
          button.disabled = false;
          window.alert("Could not start a new student. Please try again.");
        });
    };

    const onChange = (event: Event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !isStudentPhotoInput(input)) return;
      if (input.dataset.gradlyPhotoOptimized === "1") {
        delete input.dataset.gradlyPhotoOptimized;
        return;
      }

      const file = input.files?.[0];
      if (!file || file.size > 5 * 1024 * 1024 || typeof DataTransfer === "undefined") return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      void compressStudentPhoto(file)
        .then((optimized) => {
          const transfer = new DataTransfer();
          transfer.items.add(optimized);
          input.files = transfer.files;
          input.dataset.gradlyPhotoOptimized = "1";
          input.dispatchEvent(new Event("change", { bubbles: true }));
        })
        .catch(() => {
          // If optimization fails, pass the original image through normally.
          const transfer = new DataTransfer();
          transfer.items.add(file);
          input.files = transfer.files;
          input.dataset.gradlyPhotoOptimized = "1";
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    };

    document.addEventListener("focusin", onFocusIn);
    window.addEventListener("click", onClick, true);
    window.addEventListener("change", onChange, true);

    return () => {
      active = false;
      window.clearTimeout(placeholderTimer);
      document.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("change", onChange, true);
    };
  }, []);

  return null;
}
