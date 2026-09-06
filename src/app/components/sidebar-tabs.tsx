"use client";

import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ImagePlus,
  PenLine,
  Plus,
  Printer,
  School,
  Upload,
  UserRound,
  X,
  ZoomIn,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

type TabId = "student" | "marks" | "remarks";

type Profile = {
  name: string;
  motto: string;
  address: string;
  contact: string;
  logo: string;
  zoom: number;
  x: number;
  y: number;
  removeWhite: boolean;
};

const STORAGE_KEY = "gradly-school-profile";

const defaultProfile: Profile = {
  name: "Horizon Grammar School",
  motto: "Excellence · Character · Future",
  address: "Main Campus · Quetta, Balochistan",
  contact: "+92 300 0000000 · info@school.edu",
  logo: "",
  zoom: 100,
  x: 0,
  y: 0,
  removeWhite: false,
};

const steps: Array<{
  id: TabId;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof BarChart3;
}> = [
  {
    id: "student",
    label: "Student details",
    shortLabel: "Student",
    description: "Add the student and examination details.",
    icon: UserRound,
  },
  {
    id: "marks",
    label: "Marks",
    shortLabel: "Marks",
    description: "Enter each subject and the obtained marks.",
    icon: BarChart3,
  },
  {
    id: "remarks",
    label: "Review",
    shortLabel: "Review",
    description: "Add remarks and signatures, then finish.",
    icon: PenLine,
  },
];

const panelGroups: Record<TabId, string[]> = {
  student: ["Student details"],
  marks: ["Subjects & marks"],
  remarks: ["Signatures", "Remarks"],
};

function loadProfile(): Profile {
  if (typeof window === "undefined") return defaultProfile;

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? { ...defaultProfile, ...JSON.parse(value) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

function getSidebar(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>("section.no-print.space-y-4");
}

function findPanels(sidebar: HTMLElement, names: string[]): HTMLElement[] {
  return Array.from(sidebar.children).filter(
    (node): node is HTMLElement => {
      if (!(node instanceof HTMLElement)) return false;
      if (node.hasAttribute("data-gradly-workflow-header")) return false;
      if (node.hasAttribute("data-gradly-workflow-navigation")) return false;

      const heading = node.querySelector(".mb-4")?.textContent || "";
      const text = `${heading} ${node.textContent || ""}`.toLowerCase();
      return names.some((name) => text.includes(name.toLowerCase()));
    },
  );
}

function findPanel(sidebar: HTMLElement, names: string[]): HTMLElement | null {
  return findPanels(sidebar, names)[0] || null;
}

function completeStudent(sidebar: HTMLElement): boolean {
  const panel = findPanel(sidebar, ["Student details"]);
  if (!panel) return false;

  return (
    Array.from(panel.querySelectorAll<HTMLInputElement>("input")).filter(
      (input) => input.value.trim(),
    ).length >= 4
  );
}

function completeMarks(sidebar: HTMLElement): boolean {
  const panel = findPanel(sidebar, ["Subjects & marks"]);
  if (!panel) return false;

  // The marks editor is a grid of three controlled inputs per subject:
  // subject name, maximum marks, and obtained marks. It is intentionally
  // not an HTML table, so validation must follow the editor's real structure.
  const inputs = Array.from(panel.querySelectorAll<HTMLInputElement>("input"));
  if (inputs.length < 3 || inputs.length % 3 !== 0) return false;

  for (let index = 0; index < inputs.length; index += 3) {
    const subject = inputs[index]?.value.trim() || "";
    const total = Number(inputs[index + 1]?.value);
    const obtained = Number(inputs[index + 2]?.value);

    if (
      !subject ||
      !Number.isFinite(total) ||
      total <= 0 ||
      !Number.isFinite(obtained) ||
      obtained < 0 ||
      obtained > total
    ) {
      return false;
    }
  }

  return true;
}

function completeRemarks(sidebar: HTMLElement): boolean {
  const panels = findPanels(sidebar, ["Signatures", "Remarks"]);
  if (!panels.length) return false;

  const hasText = panels.some((panel) =>
    Array.from(
      panel.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"),
    ).some((input) => input.value.trim()),
  );

  const hasImage = panels.some((panel) =>
    Array.from(panel.querySelectorAll<HTMLImageElement>("img")).some(
      (image) => !!image.src,
    ),
  );

  return hasText || hasImage;
}

function applyProfileToPage(profile: Profile) {
  if (typeof document === "undefined") return;

  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("section.no-print.space-y-4 input"),
  );

  [profile.name, profile.motto, profile.address, profile.contact].forEach(
    (value, index) => {
      const input = inputs[index];
      if (!input) return;

      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;

      setter?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
  );

  const logo = document.querySelector<HTMLImageElement>("img[alt='School logo']");
  if (logo && profile.logo) {
    logo.src = profile.logo;
    logo.style.transform = `translate(${profile.x}%, ${profile.y}%) scale(${profile.zoom / 100})`;
  }

  const paper = document.querySelector<HTMLElement>(".gradly-paper");
  if (paper) {
    if (profile.logo) {
      const opacity = profile.removeWhite ? 0.72 : 0.9;
      paper.style.backgroundImage = `linear-gradient(rgba(255,255,255,${opacity}),rgba(255,255,255,${opacity})),url(\"${profile.logo}\")`;
      paper.style.backgroundPosition = `${50 + profile.x}% ${50 + profile.y}%`;
      paper.style.backgroundSize = `${48 * (profile.zoom / 100)}% auto`;
      paper.style.backgroundRepeat = "no-repeat";
    } else {
      paper.style.backgroundImage = "none";
    }
  }

  window.dispatchEvent(new CustomEvent("gradly-school-profile", { detail: profile }));
}

function removeWhiteFromImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }

      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < pixels.data.length; i += 4) {
        if (
          pixels.data[i] > 238 &&
          pixels.data[i + 1] > 238 &&
          pixels.data[i + 2] > 238
        ) {
          pixels.data[i + 3] = 0;
        }
      }

      context.putImageData(pixels, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    image.src = dataUrl;
  });
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#17365D] focus:ring-4 focus:ring-[#17365D]/10"
      />
    </label>
  );
}

function LivePrintedResultPreview() {
  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-inner">
      <div className="mb-2 flex shrink-0 items-center justify-between px-1">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            Printed result preview
          </span>
          <p className="mt-0.5 text-[10px] text-slate-400">
            The actual result-card layout, scaled for editing.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
          LIVE
        </span>
      </div>
      <div className="min-h-[360px] min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-300 bg-slate-200/70 p-3">
        <div
          data-gradly-preview-target
          className="relative h-full min-h-[330px] w-full min-w-0 overflow-hidden rounded-md bg-white shadow-lg"
        />
      </div>
    </div>
  );
}

export default function SidebarTabs() {
  const [active, setActive] = useState<TabId>("student");
  const [completed, setCompleted] = useState<Record<TabId, boolean>>({
    student: false,
    marks: false,
    remarks: false,
  });
  const [finished, setFinished] = useState(false);
  const [headerMount, setHeaderMount] = useState<HTMLElement | null>(null);
  const [navigationMount, setNavigationMount] = useState<HTMLElement | null>(null);
  const [topMount, setTopMount] = useState<HTMLElement | null>(null);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [draft, setDraft] = useState<Profile>(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const refresh = () => {
    const sidebar = getSidebar();
    if (!sidebar) return;

    setCompleted({
      student: completeStudent(sidebar),
      marks: completeMarks(sidebar),
      remarks: completeRemarks(sidebar),
    });
  };

  const isStepComplete = (id: TabId) => {
    const sidebar = getSidebar();
    if (!sidebar) return false;

    if (id === "student") return completeStudent(sidebar);
    if (id === "marks") return completeMarks(sidebar);
    return completeRemarks(sidebar);
  };

  useEffect(() => {
    const stored = loadProfile();
    setProfile(stored);
    setDraft(stored);
    setSaved(Boolean(window.localStorage.getItem(STORAGE_KEY)));

    const sidebar = getSidebar();
    if (sidebar) {
      const headerSlot = document.createElement("div");
      headerSlot.setAttribute("data-gradly-workflow-header", "true");
      sidebar.insertBefore(headerSlot, sidebar.firstElementChild);
      setHeaderMount(headerSlot);

      const navigationSlot = document.createElement("div");
      navigationSlot.setAttribute("data-gradly-workflow-navigation", "true");
      sidebar.appendChild(navigationSlot);
      setNavigationMount(navigationSlot);
    }

    const header = document.querySelector<HTMLElement>("header.no-print");
    if (header) {
      const slot = document.createElement("div");
      slot.setAttribute("data-gradly-school-topbar-slot", "true");
      slot.className = "order-2 flex items-center";
      const target = header.querySelector<HTMLElement>(":scope > div > div:last-child");
      (target || header).appendChild(slot);
      setTopMount(slot);
    }

    applyProfileToPage(stored);

    return () => {
      document.querySelector("[data-gradly-workflow-header]")?.remove();
      document.querySelector("[data-gradly-workflow-navigation]")?.remove();
      document.querySelector("[data-gradly-school-topbar-slot]")?.remove();
    };
  }, []);

  useEffect(() => {
    refresh();

    const onChange = () => {
      setValidationMessage("");
      refresh();
    };

    document.addEventListener("input", onChange, true);
    document.addEventListener("change", onChange, true);

    const timer = window.setInterval(refresh, 500);
    return () => {
      document.removeEventListener("input", onChange, true);
      document.removeEventListener("change", onChange, true);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!headerMount) return;

    const sidebar = headerMount.parentElement;
    if (!sidebar) return;

    const apply = () => {
      const panels = Array.from(sidebar.children).filter(
        (node): node is HTMLElement =>
          node instanceof HTMLElement &&
          node !== headerMount &&
          node !== navigationMount &&
          !node.hasAttribute("data-gradly-workflow-header") &&
          !node.hasAttribute("data-gradly-workflow-navigation"),
      );

      panels.forEach((panel) => {
        const title =
          panel.querySelector(".mb-4")?.textContent?.trim() ||
          panel.textContent?.slice(0, 120) ||
          "";

        const visible =
          !finished &&
          panelGroups[active].some((name) =>
            title.toLowerCase().includes(name.toLowerCase()),
          );

        panel.style.display = visible ? "" : "none";
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(sidebar, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [active, finished, headerMount, navigationMount]);

  useEffect(() => {
    if (!schoolOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSchoolOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [schoolOpen]);

  useEffect(() => {
    if (schoolOpen) setDraft(profile);
  }, [schoolOpen, profile]);

  useEffect(() => {
    if (schoolOpen) {
      window.dispatchEvent(
        new CustomEvent("gradly-school-profile-draft", { detail: draft }),
      );
    }
  }, [draft, schoolOpen]);

  useEffect(() => {
    if (finished || validationMessage) return;
    const id = window.requestAnimationFrame(() => refresh());
    return () => window.cancelAnimationFrame(id);
  }, [active, finished, validationMessage]);

  const chooseLogo = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const raw = String(reader.result);
      const logo = draft.removeWhite ? await removeWhiteFromImage(raw) : raw;
      setDraft((current) => ({ ...current, logo }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Keep the UI usable even if browser storage is unavailable.
    }

    setProfile(draft);
    setSaved(true);
    applyProfileToPage(draft);
    setSchoolOpen(false);
  };

  const next = () => {
    const valid = isStepComplete(active);
    refresh();

    if (!valid) {
      setValidationMessage(
        active === "student"
          ? "Complete the required student details to continue."
          : active === "marks"
            ? "Enter a valid subject and marks for every row to continue."
            : "Add at least one remark or signature to complete the result.",
      );
      return;
    }

    setValidationMessage("");

    if (active === "student") {
      setCompleted((current) => ({ ...current, student: true }));
      setActive("marks");
    } else if (active === "marks") {
      setCompleted((current) => ({ ...current, marks: true }));
      setActive("remarks");
    } else {
      setCompleted((current) => ({ ...current, remarks: true }));
      setFinished(true);
    }
  };

  const back = () => {
    setValidationMessage("");

    if (finished) {
      setFinished(false);
      setActive("remarks");
    } else if (active === "marks") {
      setActive("student");
    } else if (active === "remarks") {
      setActive("marks");
    }
  };

  const newResult = () => {
    window.location.href = "/";
  };

  const print = () => {
    window.setTimeout(() => window.print(), 80);
  };

  const activeIndex = useMemo(
    () => steps.findIndex((step) => step.id === active),
    [active],
  );
  const currentStep = steps[activeIndex] || steps[0];
  const percent = finished
    ? 100
    : Math.round(
        ((activeIndex + (completed[currentStep.id] ? 1 : 0)) / steps.length) * 100,
      );

  if (!headerMount && !navigationMount && !topMount) return null;

  const schoolButton = topMount
    ? createPortal(
        <button
          type="button"
          onClick={() => setSchoolOpen(true)}
          className="group flex items-center gap-2 rounded-xl border border-[#17365D]/15 bg-[#17365D] px-3.5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          title="Edit school profile"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">
            <School size={15} />
          </span>
          <span className="hidden sm:block">School</span>
          {saved && <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />}
        </button>,
        topMount,
      )
    : null;

  const workflowHeader = headerMount
    ? createPortal(
        <div
          data-gradly-workflow
          className="mb-3 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur"
        >
          {finished ? (
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <CircleCheck size={19} />
              </span>
              <div className="min-w-0">
                <div className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-emerald-600">
                  Result ready
                </div>
                <h2 className="mt-0.5 text-sm font-black text-slate-900">
                  Your result card is complete
                </h2>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  Review the live card, then print or create another result.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      Create result
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-[9px] font-bold text-slate-400">
                      Step {activeIndex + 1} of {steps.length}
                    </span>
                  </div>
                  <h2 className="mt-1 text-sm font-black text-slate-900">{currentStep.label}</h2>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">
                  {percent}%
                </span>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-[#17365D] transition-[width] duration-300"
                  style={{ width: `${Math.max(8, percent)}%` }}
                />
              </div>

              <div className="mt-3 flex items-center gap-1.5" aria-label="Result creation progress">
                {steps.map((step, index) => {
                  const isCurrent = index === activeIndex;
                  const isDone = index < activeIndex || completed[step.id];

                  return (
                    <div key={step.id} className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[9px] font-black transition ${
                          isCurrent
                            ? "bg-[#17365D] text-white shadow-sm"
                            : isDone
                              ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isDone ? <Check size={12} strokeWidth={3} /> : index + 1}
                      </span>
                      <span
                        className={`min-w-0 truncate text-[9px] font-extrabold ${
                          isCurrent
                            ? "text-slate-800"
                            : isDone
                              ? "text-emerald-600"
                              : "text-slate-400"
                        }`}
                      >
                        {step.shortLabel}
                      </span>
                      {index < steps.length - 1 && (
                        <span
                          className={`mx-0.5 h-px flex-1 ${
                            index < activeIndex ? "bg-emerald-200" : "bg-slate-200"
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <currentStep.icon size={14} className="mt-0.5 shrink-0 text-[#17365D]" />
                <p className="text-[10px] leading-4 text-slate-500">{currentStep.description}</p>
              </div>

              {validationMessage && (
                <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold leading-4 text-amber-800">
                  {validationMessage}
                </div>
              )}
            </>
          )}
        </div>,
        headerMount,
      )
    : null;

  const workflowNavigation = navigationMount
    ? createPortal(
        <div
          data-gradly-workflow-navigation
          className="mt-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_10px_26px_rgba(15,23,42,0.07)] backdrop-blur"
        >
          {!finished ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={back}
                disabled={active === "student"}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-[11px] font-extrabold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft size={15} />
                Back
              </button>

              <div className="min-w-0 flex-1 text-right">
                <div className="truncate text-[9px] font-bold text-slate-400">
                  {completed[active] ? "Section complete" : "Complete this section to continue"}
                </div>
              </div>

              <button
                type="button"
                onClick={next}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#17365D] px-4 text-[11px] font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {active === "remarks" ? "Complete result" : "Continue"}
                <ChevronRight size={15} />
              </button>
            </div>
          ) : (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={print}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#17365D] px-4 text-[11px] font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Printer size={15} />
                Download / Print
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={print}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-extrabold text-slate-700 transition hover:bg-slate-50"
                >
                  <Printer size={13} />
                  Print result
                </button>
                <button
                  type="button"
                  onClick={newResult}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-extrabold text-slate-700 transition hover:bg-slate-50"
                >
                  <Plus size={13} />
                  Add another
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFinished(false);
                  setActive("remarks");
                  setValidationMessage("");
                }}
                className="pt-1 text-[10px] font-bold text-slate-400 transition hover:text-[#17365D]"
              >
                Review result details
              </button>
            </div>
          )}
        </div>,
        navigationMount,
      )
    : null;

  const schoolModal = schoolOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="School profile"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSchoolOpen(false);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/40 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                  School profile
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-900">
                  Branding & printed identity
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSchoolOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close school profile"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[minmax(320px,0.75fr)_minmax(420px,1.25fr)]">
              <div className="space-y-4 overflow-auto p-5">
                <Field
                  label="School name"
                  value={draft.name}
                  onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
                  placeholder="School name"
                />
                <Field
                  label="Motto"
                  value={draft.motto}
                  onChange={(value) => setDraft((current) => ({ ...current, motto: value }))}
                  placeholder="School motto"
                />
                <Field
                  label="Address"
                  value={draft.address}
                  onChange={(value) => setDraft((current) => ({ ...current, address: value }))}
                  placeholder="School address"
                />
                <Field
                  label="Contact"
                  value={draft.contact}
                  onChange={(value) => setDraft((current) => ({ ...current, contact: value }))}
                  placeholder="Phone or email"
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                        Logo
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Upload a transparent PNG for the cleanest result.
                      </p>
                    </div>
                    <ImagePlus size={18} className="text-slate-400" />
                  </div>

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-[11px] font-extrabold text-slate-600 transition hover:border-[#17365D]/40 hover:bg-slate-50">
                    <Upload size={14} />
                    Upload school logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => chooseLogo(event.target.files?.[0])}
                    />
                  </label>

                  {draft.logo && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
                      <div className="grid min-h-28 place-items-center overflow-hidden rounded-lg bg-slate-50">
                        <img
                          src={draft.logo}
                          alt="School logo preview"
                          className="max-h-24 max-w-full object-contain"
                          style={{
                            transform: `translate(${draft.x}%, ${draft.y}%) scale(${draft.zoom / 100})`,
                          }}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDraft((current) => ({ ...current, zoom: Math.min(180, current.zoom + 10) }))}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-bold text-slate-600"
                        >
                          <ZoomIn size={13} /> Zoom +
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraft((current) => ({ ...current, zoom: Math.max(60, current.zoom - 10) }))}
                          className="rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-bold text-slate-600"
                        >
                          Zoom −
                        </button>
                      </div>
                      <label className="mt-3 flex items-center gap-2 text-[10px] font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={draft.removeWhite}
                          onChange={async (event) => {
                            const checked = event.target.checked;
                            setDraft((current) => ({ ...current, removeWhite: checked }));
                            if (checked && draft.logo) {
                              const logo = await removeWhiteFromImage(draft.logo);
                              setDraft((current) => ({ ...current, logo }));
                            }
                          }}
                        />
                        Remove white background
                      </label>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={saveProfile}
                  className="w-full rounded-xl bg-[#17365D] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  Save school profile
                </button>
              </div>

              <div className="min-h-[420px] border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
                <LivePrintedResultPreview />
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {schoolButton}
      {workflowHeader}
      {workflowNavigation}
      {schoolModal}
    </>
  );
}
