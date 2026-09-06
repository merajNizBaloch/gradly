"use client";

import { useEffect, useRef, useState } from "react";

type ReviewData = {
  teacher: string;
  principal: string;
  teacherSignature: string;
  principalSignature: string;
};

const STORAGE_KEY = "gradly-review-package";

function emptyReview(): ReviewData {
  return { teacher: "", principal: "", teacherSignature: "", principalSignature: "" };
}

function parseReview(value: unknown): ReviewData {
  if (typeof value !== "string" || !value.trim()) return emptyReview();
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return {
        teacher: typeof parsed.teacher === "string" ? parsed.teacher : "",
        principal: typeof parsed.principal === "string" ? parsed.principal : "",
        teacherSignature: typeof parsed.teacherSignature === "string" ? parsed.teacherSignature : "",
        principalSignature: typeof parsed.principalSignature === "string" ? parsed.principalSignature : "",
      };
    }
  } catch {
    return { ...emptyReview(), principal: value.trim() };
  }
  return emptyReview();
}

function loadStored(): ReviewData {
  if (typeof window === "undefined") return emptyReview();
  try {
    return parseReview(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return emptyReview();
  }
}

function saveStored(value: ReviewData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Local storage is only a convenience; the API payload is the durable copy.
  }
}

function findSidebar(): HTMLElement | null {
  return document.querySelector<HTMLElement>("section.no-print.space-y-4");
}

function ensureRemarksPanel(sidebar: HTMLElement, values: ReviewData, onChange: (next: ReviewData) => void) {
  let panel = sidebar.querySelector<HTMLElement>("[data-gradly-review-remarks]");
  if (panel) return panel;

  panel = document.createElement("div");
  panel.setAttribute("data-gradly-review-remarks", "true");
  panel.className = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm";
  panel.innerHTML = `
    <div class="mb-4 flex items-center gap-2 text-sm font-bold">
      <span class="grid h-8 w-8 place-items-center rounded-lg bg-gray-50 text-base text-[#17365D]">✎</span>
      <span>Remarks</span>
    </div>
    <div class="space-y-3">
      <label class="block">
        <span class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Teacher remarks</span>
        <textarea data-gradly-teacher-remarks rows="4" placeholder="Write the class teacher's comments about progress, effort, conduct or improvement areas." class="w-full resize-y border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#17365D]"></textarea>
      </label>
      <label class="block">
        <span class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Principal remarks</span>
        <textarea data-gradly-principal-remarks rows="4" placeholder="Write the principal's final academic or conduct remarks." class="w-full resize-y border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#17365D]"></textarea>
      </label>
      <p class="text-[10px] leading-4 text-gray-400">Remarks and signatures are saved with the result and shown on the printed/exported report.</p>
    </div>
  `;

  const signaturePanel = Array.from(sidebar.children).find((node) => node instanceof HTMLElement && node.textContent?.toLowerCase().includes("signatures"));
  sidebar.insertBefore(panel, signaturePanel?.nextSibling || null);

  const teacher = panel.querySelector<HTMLTextAreaElement>("[data-gradly-teacher-remarks]");
  const principal = panel.querySelector<HTMLTextAreaElement>("[data-gradly-principal-remarks]");
  if (teacher) teacher.value = values.teacher;
  if (principal) principal.value = values.principal;

  const emit = () => {
    const next = {
      ...currentReview(),
      teacher: teacher?.value.trim() || "",
      principal: principal?.value.trim() || "",
    };
    saveStored(next);
    reviewState.next = next;
    onChange(next);
  };
  teacher?.addEventListener("input", emit);
  principal?.addEventListener("input", emit);

  return panel;
}

const reviewState: { next: ReviewData } = { next: emptyReview() };

function currentReview(): ReviewData {
  return reviewState.next;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read signature image."));
    reader.readAsDataURL(file);
  });
}

function findSignatureInputs(sidebar: HTMLElement): { teacher: HTMLInputElement | null; principal: HTMLInputElement | null } {
  const panel = Array.from(sidebar.children).find((node) => node instanceof HTMLElement && node.textContent?.toLowerCase().includes("signatures")) as HTMLElement | undefined;
  if (!panel) return { teacher: null, principal: null };
  const inputs = Array.from(panel.querySelectorAll<HTMLInputElement>("input[type='file']"));
  return { teacher: inputs[0] || null, principal: inputs[1] || null };
}

function syncSignatureUi(sidebar: HTMLElement, values: ReviewData) {
  const panel = Array.from(sidebar.children).find((node) => node instanceof HTMLElement && node.textContent?.toLowerCase().includes("signatures")) as HTMLElement | undefined;
  if (!panel) return;

  const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>("button"));
  const teacherButton = buttons[0];
  const principalButton = buttons[1];
  if (teacherButton) teacherButton.textContent = values.teacherSignature ? "Teacher signature added" : "Teacher signature";
  if (principalButton) principalButton.textContent = values.principalSignature ? "Principal signature added" : "Principal signature";
}

function syncPreview(values: ReviewData) {
  const paper = document.querySelector<HTMLElement>(".gradly-paper");
  if (!paper) return;

  const legacySection = Array.from(paper.querySelectorAll<HTMLElement>("div")).find((node) =>
    node.textContent?.includes("Principal's Remarks") &&
    !node.hasAttribute("data-gradly-remarks-preview") &&
    !node.hasAttribute("data-gradly-signatures-preview"),
  );
  if (legacySection) {
    const candidate = legacySection.parentElement === paper ? legacySection : legacySection.closest(".border.p-4") || legacySection;
    if (candidate && !candidate.hasAttribute("data-gradly-remarks-preview")) {
      candidate.setAttribute("data-gradly-auto-remarks", "true");
      candidate.style.display = "none";
    }
  }

  let remarksSection = paper.querySelector<HTMLElement>("[data-gradly-remarks-preview]");
  if (!remarksSection) {
    remarksSection = document.createElement("div");
    remarksSection.setAttribute("data-gradly-remarks-preview", "true");
    remarksSection.style.cssText = "margin-top:20px;border:1px solid #d9e0e7;background:#f8fafb;padding:16px;";
    const anchor = Array.from(paper.querySelectorAll<HTMLElement>("div")).find((node) => node.textContent?.includes("Official Verification"));
    if (anchor?.parentElement) anchor.parentElement.insertBefore(remarksSection, anchor.parentElement.firstChild);
    else paper.appendChild(remarksSection);
  }

  const signatureState = `${values.teacherSignature.length}:${values.principalSignature.length}`;
  if (remarksSection.dataset.signatureState !== `${values.teacher}|${values.principal}|${signatureState}`) {
    remarksSection.dataset.signatureState = `${values.teacher}|${values.principal}|${signatureState}`;
    remarksSection.innerHTML = `
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#17365D">Teacher's Remarks</div>
      <div style="margin-top:4px;font-size:14px;font-weight:500;line-height:1.6;color:#17202a;white-space:pre-wrap">${escapeHtml(values.teacher || "—")}</div>
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid #d9e0e7;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#17365D">Principal's Remarks</div>
      <div style="margin-top:4px;font-size:14px;font-weight:500;line-height:1.6;color:#17202a;white-space:pre-wrap">${escapeHtml(values.principal || "—")}</div>
    `;
  }

  let signatures = paper.querySelector<HTMLElement>("[data-gradly-signatures-preview]");
  if (!signatures) {
    signatures = document.createElement("div");
    signatures.setAttribute("data-gradly-signatures-preview", "true");
    signatures.style.cssText = "margin-top:22px;display:grid;grid-template-columns:1fr 1fr;gap:40px;padding-top:18px;";
    const existingFooter = Array.from(paper.querySelectorAll<HTMLElement>("div")).find((node) =>
      node.textContent?.trim() === "Class Teacher" || node.textContent?.trim() === "Principal / Head",
    );
    if (existingFooter?.parentElement) existingFooter.parentElement.replaceWith(signatures);
    else paper.appendChild(signatures);
  }

  const teacherHtml = values.teacherSignature
    ? `<img src="${values.teacherSignature}" alt="Teacher signature" style="display:block;width:150px;height:46px;object-fit:contain;margin:0 auto 5px;"/><div style="border-top:1px solid #17365D;padding-top:7px;font-size:12px;text-align:center;">Class Teacher</div>`
    : `<div style="height:46px;"></div><div style="border-top:1px solid #17365D;padding-top:7px;font-size:12px;text-align:center;">Class Teacher</div>`;
  const principalHtml = values.principalSignature
    ? `<img src="${values.principalSignature}" alt="Principal signature" style="display:block;width:150px;height:46px;object-fit:contain;margin:0 auto 5px;"/><div style="border-top:1px solid #17365D;padding-top:7px;font-size:12px;text-align:center;">Principal / Head</div>`
    : `<div style="height:46px;"></div><div style="border-top:1px solid #17365D;padding-top:7px;font-size:12px;text-align:center;">Principal / Head</div>`;
  const nextSignatureMarkup = teacherHtml + principalHtml;
  if (signatures.dataset.markup !== nextSignatureMarkup) {
    signatures.dataset.markup = nextSignatureMarkup;
    signatures.innerHTML = teacherHtml + principalHtml;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '\"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function installFetchBridge(getReview: () => ReviewData) {
  const key = "__gradlyReviewFetchBridge";
  const current = window as Window & { [key]?: boolean };
  if (current[key]) return;
  current[key] = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    const target = input instanceof Request ? input.url : String(input);

    if (!target.includes("/api/results") || !["POST", "PUT"].includes(method) || typeof init?.body !== "string") {
      return originalFetch(input, init);
    }

    try {
      const payload = JSON.parse(init.body);
      const currentPayloadReview = parseReview(payload.remarks);
      const next = getReview();
      payload.remarks = JSON.stringify({
        teacher: next.teacher || currentPayloadReview.teacher,
        principal: next.principal || currentPayloadReview.principal,
        teacherSignature: next.teacherSignature || currentPayloadReview.teacherSignature,
        principalSignature: next.principalSignature || currentPayloadReview.principalSignature,
      });
      return originalFetch(input, { ...init, body: JSON.stringify(payload) });
    } catch {
      return originalFetch(input, init);
    }
  };
}

async function restoreSavedReview(review: ReviewData) {
  reviewState.next = review;
  saveStored(review);

  const sidebar = findSidebar();
  if (!sidebar) return;

  ensureRemarksPanel(sidebar, review, (next) => {
    reviewState.next = next;
    saveStored(next);
    syncPreview(next);
  });
  syncSignatureUi(sidebar, review);
  syncPreview(review);
}

export default function ReviewRemarks() {
  const [review, setReview] = useState<ReviewData>(loadStored);
  const reviewRef = useRef(review);
  reviewRef.current = review;
  reviewState.next = review;

  useEffect(() => {
    installFetchBridge(() => reviewRef.current);

    const setup = () => {
      const sidebar = findSidebar();
      if (!sidebar) return;

      ensureRemarksPanel(sidebar, reviewRef.current, (next) => {
        setReview(next);
        reviewRef.current = next;
        reviewState.next = next;
        saveStored(next);
        syncPreview(next);
      });

      const { teacher, principal } = findSignatureInputs(sidebar);
      const handleFile = async (role: "teacherSignature" | "principalSignature", input: HTMLInputElement) => {
        const file = input.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        const dataUrl = await fileToDataUrl(file);
        const next = { ...reviewRef.current, [role]: dataUrl };
        setReview(next);
        reviewRef.current = next;
        reviewState.next = next;
        saveStored(next);
        syncSignatureUi(sidebar, next);
        syncPreview(next);
      };

      if (teacher && !teacher.dataset.gradlyBound) {
        teacher.dataset.gradlyBound = "true";
        teacher.addEventListener("change", () => void handleFile("teacherSignature", teacher));
      }
      if (principal && !principal.dataset.gradlyBound) {
        principal.dataset.gradlyBound = "true";
        principal.addEventListener("change", () => void handleFile("principalSignature", principal));
      }
      syncSignatureUi(sidebar, reviewRef.current);
      syncPreview(reviewRef.current);
    };

    const editId = new URLSearchParams(window.location.search).get("edit");
    let active = true;
    if (editId) {
      fetch(`/api/results/${encodeURIComponent(editId)}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!active || !data?.result) return;
          restoreSavedReview(parseReview(data.result.remarks));
        })
        .catch(() => undefined);
    }

    setup();
    const observer = new MutationObserver(setup);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(setup, 600);

    return () => {
      active = false;
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    syncPreview(review);
  }, [review]);

  return <span aria-hidden="true" className="hidden" />;
}
