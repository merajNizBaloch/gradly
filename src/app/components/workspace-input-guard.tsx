"use client";

import { useEffect, useRef, useState } from "react";
import { readLocalDraft, saveLocalDraft, type LocalDraft } from "./local-results";
import { defaultBands, defaultSchool, initialSubjects, type DesignSettings } from "./workspace-model";

const DEFAULT_DESIGN: DesignSettings = {
  template: "academic",
  theme: "academic-navy",
  paperSize: "a4",
  customWidth: "210",
  customHeight: "297",
};

const SCHOOL_KEY = "gradly-school-profile-v2";
const DESIGN_KEY = "gradly-design-v2";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const TEXT_LIMITS: Record<string, number> = {
  "student name": 60,
  "father / guardian": 60,
  "roll number": 30,
  "class & section": 40,
  session: 20,
  exam: 50,
  "school name": 80,
  motto: 120,
  address: 160,
  contact: 60,
};

const REQUIRED_STUDENT_FIELDS = [
  "student name",
  "father / guardian",
  "roll number",
  "class & section",
  "session",
  "exam",
  "date of birth",
  "attendance %",
  "class position",
] as const;

type RequiredStudentField = (typeof REQUIRED_STUDENT_FIELDS)[number];

function workspaceForm() {
  return document.querySelector<HTMLElement>("main > header.no-print + div > section.no-print");
}

function currentStep() {
  const form = workspaceForm();
  if (!form) return 1;
  const marker = Array.from(form.querySelectorAll("p")).find((item) => /^Step\s+[123]\s+of\s+3$/i.test(item.textContent?.trim() || ""));
  const match = marker?.textContent?.match(/Step\s+([123])/i);
  return match ? Number(match[1]) : 1;
}

function fieldLabel(input: HTMLInputElement | HTMLTextAreaElement) {
  const span = input.closest("label")?.querySelector("span");
  return span?.textContent?.trim().toLowerCase() || "";
}

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function markInputs() {
  const form = workspaceForm();
  if (!form || currentStep() !== 2) return [] as HTMLInputElement[];
  return Array.from(form.querySelectorAll<HTMLInputElement>('input:not([type="file"])'));
}

function failInput(input: HTMLInputElement, message: string) {
  input.setCustomValidity(message);
  input.focus({ preventScroll: false });
  input.reportValidity();
}

function findStudentInput(labelText: string) {
  const form = workspaceForm();
  if (!form) return null;
  const label = Array.from(form.querySelectorAll("label")).find(
    (item) => item.querySelector("span")?.textContent?.trim().toLowerCase() === labelText,
  );
  return label?.querySelector<HTMLInputElement>("input") || null;
}

function validateStudent() {
  for (const label of REQUIRED_STUDENT_FIELDS) {
    const input = findStudentInput(label);
    if (!input) return false;
    input.setCustomValidity("");

    const value = input.value.trim();
    if (!value) {
      failInput(input, `${input.closest("label")?.querySelector("span")?.textContent?.trim() || "This field"} is required.`);
      return false;
    }

    const limit = TEXT_LIMITS[label];
    if (limit && value.length > limit) {
      failInput(input, `Use no more than ${limit} characters.`);
      return false;
    }

    if (label === "attendance %") {
      const attendance = Number(value);
      if (!Number.isInteger(attendance) || attendance < 0 || attendance > 100) {
        failInput(input, "Attendance must be a whole number from 0 to 100.");
        return false;
      }
    }

    if (label === "class position") {
      const position = Number(value);
      if (!Number.isInteger(position) || position < 1 || position > 9999) {
        failInput(input, "Class position must be a whole number from 1 to 9999.");
        return false;
      }
    }
  }
  return true;
}

function validateMarks() {
  const inputs = markInputs();
  if (inputs.length < 3 || inputs.length % 3 !== 0) return false;
  for (const input of inputs) input.setCustomValidity("");

  for (let index = 0; index < inputs.length; index += 3) {
    const name = inputs[index];
    const total = inputs[index + 1];
    const obtained = inputs[index + 2];
    if (!name || !total || !obtained) return false;

    if (!name.value.trim()) {
      failInput(name, "Subject name is required.");
      return false;
    }
    if (name.value.trim().length > 50) {
      failInput(name, "Subject name can contain at most 50 characters.");
      return false;
    }

    const totalValue = Number(total.value);
    if (!total.value.trim() || !Number.isInteger(totalValue) || totalValue < 1 || totalValue > 999) {
      failInput(total, "Maximum marks must be a whole number from 1 to 999.");
      return false;
    }

    const obtainedValue = Number(obtained.value);
    if (!obtained.value.trim() || !Number.isFinite(obtainedValue) || obtainedValue < 0 || obtainedValue > totalValue) {
      failInput(obtained, `Obtained marks must be between 0 and ${totalValue}.`);
      return false;
    }
  }

  return true;
}

function safeJson<T extends object>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

async function persistBlankStudentDraft() {
  const existing = await readLocalDraft();
  const base: LocalDraft = existing || {
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
    bands: defaultBands,
    teacherRemarks: "",
    principalRemarks: "",
    teacherSignature: "",
    principalSignature: "",
  };

  await saveLocalDraft({
    ...base,
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
    subjects: (base.subjects?.length ? base.subjects : initialSubjects).map((item) => ({ ...item, obtained: 0 })),
    teacherRemarks: "",
    principalRemarks: "",
    teacherSignature: "",
    principalSignature: "",
    editingReportId: undefined,
  });
}

export default function WorkspaceInputGuard() {
  const [message, setMessage] = useState("");
  const messageTimer = useRef<number | null>(null);

  useEffect(() => {
    const showMessage = (text: string) => {
      setMessage(text);
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
      messageTimer.current = window.setTimeout(() => setMessage(""), 2800);
    };

    const applyRules = (control: Element | null) => {
      if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;

      const label = fieldLabel(control);
      if (control instanceof HTMLTextAreaElement) {
        control.maxLength = 300;
        return;
      }

      if (TEXT_LIMITS[label]) control.maxLength = TEXT_LIMITS[label];
      if (REQUIRED_STUDENT_FIELDS.includes(label as RequiredStudentField)) control.required = true;

      if (label === "attendance %") {
        control.min = "0";
        control.max = "100";
        control.step = "1";
        control.inputMode = "numeric";
      } else if (label === "class position") {
        control.min = "1";
        control.max = "9999";
        control.step = "1";
        control.inputMode = "numeric";
      }

      if (currentStep() === 2 && workspaceForm()?.contains(control)) {
        const inputs = markInputs();
        const index = inputs.indexOf(control);
        if (index >= 0) {
          if (index % 3 === 0) {
            control.maxLength = 50;
            control.required = true;
          } else if (index % 3 === 1) {
            control.min = "1";
            control.max = "999";
            control.step = "1";
            control.required = true;
            control.inputMode = "numeric";
          } else {
            const total = Number(inputs[index - 1]?.value || 0);
            control.min = "0";
            control.max = String(Math.max(0, total));
            control.step = "1";
            control.required = true;
            control.inputMode = "numeric";
          }
        }
      }

      if (/width mm|height mm/i.test(control.placeholder)) {
        control.min = "80";
        control.max = "500";
      }
    };

    const applyVisibleRules = () => {
      workspaceForm()?.querySelectorAll("input, textarea").forEach((control) => applyRules(control));
      document
        .querySelectorAll('[class*="z-[150]"] input, [class*="z-[160]"] input, [class*="z-[120]"] input')
        .forEach((control) => applyRules(control));
    };

    const onFocusIn = (event: FocusEvent) => applyRules(event.target as Element);

    const onInput = (event: Event) => {
      const control = event.target;
      if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
      control.setCustomValidity("");
      applyRules(control);

      if (control.maxLength > 0 && control.value.length > control.maxLength) {
        control.value = control.value.slice(0, control.maxLength);
      }

      if (control instanceof HTMLInputElement && control.type === "number" && control.value !== "") {
        const value = Number(control.value);
        const min = control.min === "" ? -Infinity : Number(control.min);
        const max = control.max === "" ? Infinity : Number(control.max);
        if (Number.isFinite(value) && value > max) control.value = String(max);
        if (Number.isFinite(value) && value < min) control.value = String(min);
      }
    };

    const block = (event: MouseEvent, text: string) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showMessage(text);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest("button");
      if (!button) return;

      const text = button.textContent?.replace(/\s+/g, " ").trim() || "";
      const step = currentStep();
      const navButton = button.closest("aside nav") ? button : null;

      if (navButton) {
        const navButtons = Array.from(navButton.parentElement?.querySelectorAll("button") || []);
        const destination = navButtons.indexOf(navButton) + 1;
        if (destination > step) {
          if (step === 1 && !validateStudent()) return block(event, "Complete every required student field before continuing.");
          if (step === 1 && destination === 3) return block(event, "Complete the Marks step before Finalize.");
          if (step === 2 && destination === 3 && !validateMarks()) return block(event, "Complete all subject and marks fields before Finalize.");
        }
      }

      if (/^Next\b/i.test(text)) {
        if (step === 1 && !validateStudent()) return block(event, "Complete every required student field before continuing.");
        if (step === 2 && !validateMarks()) return block(event, "Complete all subject and marks fields before Finalize.");
      }

      if (/^Start next student$/i.test(text)) {
        window.setTimeout(() => {
          for (const label of ["student name", "father / guardian", "roll number", "class & section", "session", "exam", "date of birth"] as const) {
            const input = findStudentInput(label);
            if (input && input.value !== "") setNativeInputValue(input, "");
          }
          applyVisibleRules();
        }, 0);

        window.setTimeout(() => {
          void persistBlankStudentDraft().then(() => {
            if (new URL(window.location.href).searchParams.has("edit")) window.location.replace("/");
          });
        }, 450);
      }

      window.requestAnimationFrame(applyVisibleRules);
    };

    const onChange = (event: Event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "file") return;
      const file = input.files?.[0];
      if (!file || file.size <= MAX_IMAGE_BYTES) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      input.value = "";
      showMessage("Image files must be 5 MB or smaller.");
    };

    applyVisibleRules();
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onChange, true);
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onChange, true);
      document.removeEventListener("click", onClick, true);
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      className="no-print fixed left-1/2 top-[78px] z-[250] w-[min(92vw,460px)] -translate-x-1/2 border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-black text-amber-800 shadow-xl"
      role="status"
    >
      {message}
    </div>
  );
}
