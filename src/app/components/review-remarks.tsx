"use client";

import { useEffect, useRef, useState } from "react";

type ReviewRemarks = {
  teacher: string;
  principal: string;
};

const REMARKS_STORAGE_KEY = "gradly-review-remarks";

function parseRemarks(value: unknown): ReviewRemarks {
  if (typeof value !== "string") return { teacher: "", principal: "" };

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return {
        teacher: typeof parsed.teacher === "string" ? parsed.teacher : "",
        principal: typeof parsed.principal === "string" ? parsed.principal : "",
      };
    }
  } catch {
    if (value.trim()) return { teacher: "", principal: value.trim() };
  }

  return { teacher: "", principal: "" };
}

function loadStoredRemarks(): ReviewRemarks {
  if (typeof window === "undefined") return { teacher: "", principal: "" };
  try {
    return parseRemarks(window.localStorage.getItem(REMARKS_STORAGE_KEY));
  } catch {
    return { teacher: "", principal: "" };
  }
}

function saveStoredRemarks(value: ReviewRemarks) {
  try {
    window.localStorage.setItem(REMARKS_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Local storage is only a convenience; the actual save goes through the API payload.
  }
}

function findSidebar(): HTMLElement | null {
  return document.querySelector<HTMLElement>("section.no-print.space-y-4");
}

function ensureRemarksPanel(
  sidebar: HTMLElement,
  values: ReviewRemarks,
  onChange: (next: ReviewRemarks) => void,
) {
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
      <p class="text-[10px] leading-4 text-gray-400">These remarks are saved with the result and shown on the printed/exported report.</p>
    </div>
  `;

  const signaturePanel = Array.from(sidebar.children).find((node) =>
    node instanceof HTMLElement && node.textContent?.toLowerCase().includes("signatures"),
  );
  sidebar.insertBefore(panel, signaturePanel?.nextSibling || null);

  const teacher = panel.querySelector<HTMLTextAreaElement>("[data-gradly-teacher-remarks]");
  const principal = panel.querySelector<HTMLTextAreaElement>("[data-gradly-principal-remarks]");
  if (teacher) teacher.value = values.teacher;
  if (principal) principal.value = values.principal;

  const emit = () => {
    const next = {
      teacher: teacher?.value.trim() || "",
      principal: principal?.value.trim() || "",
    };
    saveStoredRemarks(next);
    onChange(next);
  };

  teacher?.addEventListener("input", emit);
  principal?.addEventListener("input", emit);

  return panel;
}

function syncPreview(remarks: ReviewRemarks) {
  const paper = document.querySelector<HTMLElement>(".gradly-paper");
  if (!paper) return;

  const legacySection = Array.from(paper.querySelectorAll<HTMLElement>("div")).find(
    (node) =>
      node !== paper.querySelector("[data-gradly-remarks-preview]") &&
      node.textContent?.includes("Principal's Remarks") &&
      !node.closest("[data-gradly-remarks-preview]"),
  );
  if (legacySection) {
    const candidate = legacySection.parentElement === paper ? legacySection : legacySection.closest(".border.p-4") || legacySection;
    if (candidate) {
      candidate.setAttribute("data-gradly-auto-remarks", "true");
      candidate.style.display = "none";
    }
  }

  let section = paper.querySelector<HTMLElement>("[data-gradly-remarks-preview]");
  if (!section) {
    section = document.createElement("div");
    section.setAttribute("data-gradly-remarks-preview", "true");
    section.style.cssText = "margin-top:20px;border:1px solid #d9e0e7;background:#f8fafb;padding:16px;";

    const official = paper.querySelector<HTMLElement>("[data-gradly-remarks-anchor]") ||
      Array.from(paper.querySelectorAll<HTMLElement>("div")).find((node) =>
        node.textContent?.includes("Principal's Remarks"),
      );
    if (official?.parentElement) official.parentElement.insertBefore(section, official);
    else paper.appendChild(section);
  }

  section.innerHTML = `
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#17365D">Teacher's Remarks</div>
    <div style="margin-top:4px;font-size:14px;font-weight:500;line-height:1.6;color:#17202a">${escapeHtml(remarks.teacher || "—")}</div>
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid #d9e0e7;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#17365D">Principal's Remarks</div>
    <div style="margin-top:4px;font-size:14px;font-weight:500;line-height:1.6;color:#17202a">${escapeHtml(remarks.principal || "—")}</div>
  `;
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

function installFetchBridge(getRemarks: () => ReviewRemarks) {
  const bridgeKey = "__gradlyRemarksFetchBridge";
  const current = window as Window & { [bridgeKey]?: boolean };
  if (current[bridgeKey]) return;
  current[bridgeKey] = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    const target = input instanceof Request ? input.url : String(input);

    if (!target.includes("/api/results") || !["POST", "PUT"].includes(method) || typeof init?.body !== "string") {
      return originalFetch(input, init);
    }

    try {
      const payload = JSON.parse(init.body);
      payload.remarks = JSON.stringify(getRemarks());
      return originalFetch(input, { ...init, body: JSON.stringify(payload) });
    } catch {
      return originalFetch(input, init);
    }
  };
}

export default function ReviewRemarks() {
  const [remarks, setRemarks] = useState<ReviewRemarks>(loadStoredRemarks);
  const remarksRef = useRef(remarks);
  remarksRef.current = remarks;

  useEffect(() => {
    installFetchBridge(() => remarksRef.current);

    const editId = new URLSearchParams(window.location.search).get("edit");
    let active = true;

    if (editId) {
      fetch(`/api/results/${encodeURIComponent(editId)}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!active || !data?.result) return;
          const loaded = parseRemarks(data.result.remarks);
          setRemarks(loaded);
          remarksRef.current = loaded;
          saveStoredRemarks(loaded);
          syncPreview(loaded);
          const sidebar = findSidebar();
          if (sidebar) ensureRemarksPanel(sidebar, loaded, setRemarks);
        })
        .catch(() => undefined);
    }

    const sync = () => {
      const sidebar = findSidebar();
      if (sidebar) {
        ensureRemarksPanel(sidebar, remarksRef.current, (next) => {
          setRemarks(next);
          remarksRef.current = next;
          syncPreview(next);
        });
      }
      syncPreview(remarksRef.current);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(sync, 500);

    return () => {
      active = false;
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    syncPreview(remarks);
  }, [remarks]);

  return <span aria-hidden="true" className="hidden" />;
}
