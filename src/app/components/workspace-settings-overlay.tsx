"use client";

import { LayoutTemplate, School, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

type SettingsPanel = "school" | "design" | null;
type RecurringStep = "Student" | "Marks" | "Finalize";

type SchoolSettings = {
  name: string;
  motto: string;
  address: string;
  contact: string;
  logo?: string;
};

type DesignSettings = {
  template?: string;
  palette?: string;
  paper?: string;
  customWidth?: string;
  customHeight?: string;
};

const SCHOOL_KEY = "gradly-global-school";
const DESIGN_KEY = "gradly-global-design";
const recurringSteps: RecurringStep[] = ["Student", "Marks", "Finalize"];
const templateNames = ["Academic", "Modern", "Certificate", "Executive", "Minimal"];
const paperNames = ["A4", "A5", "Letter", "Legal", "Custom"];

function getHeaderActions() {
  const header = document.querySelector<HTMLElement>("header.no-print");
  const row = header?.children.item(1) as HTMLElement | null;
  return (row?.lastElementChild as HTMLElement | null) ?? null;
}

function getEditor() {
  return Array.from(document.querySelectorAll<HTMLElement>("section.no-print")).find((section) =>
    section.className.includes("gradly-workspace-scroll") && section.querySelector("h1"),
  ) ?? null;
}

function getWorkflowNav() {
  const aside = document.querySelector<HTMLElement>("aside.no-print");
  return aside?.querySelector<HTMLElement>("nav") ?? null;
}

function findWorkflowButton(label: string) {
  const nav = getWorkflowNav();
  return nav
    ? Array.from(nav.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
        (button.textContent || "").includes(label),
      ) ?? null
    : null;
}

function currentEditorTitle(): string {
  return getEditor()?.querySelector("h1")?.textContent?.trim() || "";
}

function clickWorkflow(label: string) {
  findWorkflowButton(label)?.click();
}

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function findVisibleEditorPanel() {
  const editor = getEditor();
  if (!editor) return null;
  return Array.from(editor.querySelectorAll<HTMLElement>(":scope > div:nth-child(2) > div")).find(
    (node) => !node.classList.contains("hidden"),
  ) ?? null;
}

function saveSchoolSettings() {
  const panel = findVisibleEditorPanel();
  if (!panel || !panel.textContent?.includes("School identity")) return;

  const textInputs = Array.from(panel.querySelectorAll<HTMLInputElement>("input")).filter(
    (input) => input.type !== "file",
  );
  const logo = panel.querySelector<HTMLImageElement>('img[alt="Uploaded school logo"]')?.src || "";
  const settings: SchoolSettings = {
    name: textInputs[0]?.value || "",
    motto: textInputs[1]?.value || "",
    address: textInputs[2]?.value || "",
    contact: textInputs[3]?.value || "",
    logo,
  };

  try {
    localStorage.setItem(SCHOOL_KEY, JSON.stringify(settings));
    const compatibilityProfile = {
      ...settings,
      zoom: 100,
      x: 0,
      y: 0,
      removeWhite: false,
    };
    localStorage.setItem("gradly-school-profile", JSON.stringify(compatibilityProfile));
  } catch {
    // The workspace remains usable if storage is unavailable.
  }
}

function saveDesignSettings() {
  const panel = findVisibleEditorPanel();
  if (!panel || !panel.textContent?.includes("Result card design")) return;

  const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>("button"));
  const selectedTemplate = buttons.find((button) =>
    button.textContent?.includes("Selected") && templateNames.some((name) => button.textContent?.includes(name)),
  );
  const template = templateNames.find((name) => selectedTemplate?.textContent?.includes(name));

  const paletteButton = buttons.find(
    (button) =>
      !button.textContent?.includes("Selected") &&
      button.className.includes("bg-[#f4f7fa]") &&
      !paperNames.includes((button.textContent || "").trim()),
  );
  const paperButton = buttons.find(
    (button) =>
      paperNames.includes((button.textContent || "").trim()) && button.className.includes("bg-[#17365D]"),
  );
  const numberInputs = Array.from(panel.querySelectorAll<HTMLInputElement>('input[type="number"]'));

  const settings: DesignSettings = {
    template,
    palette: paletteButton?.textContent?.trim(),
    paper: paperButton?.textContent?.trim(),
    customWidth: numberInputs[0]?.value,
    customHeight: numberInputs[1]?.value,
  };

  try {
    localStorage.setItem(DESIGN_KEY, JSON.stringify(settings));
  } catch {
    // The workspace remains usable if storage is unavailable.
  }
}

function restoreSchoolSettings(settings: SchoolSettings | null) {
  if (!settings) return;
  const panel = findVisibleEditorPanel();
  if (!panel || !panel.textContent?.includes("School identity")) return;

  const inputs = Array.from(panel.querySelectorAll<HTMLInputElement>("input")).filter(
    (input) => input.type !== "file",
  );
  [settings.name, settings.motto, settings.address, settings.contact].forEach((value, index) => {
    if (inputs[index] && typeof value === "string") setNativeValue(inputs[index], value);
  });

  if (settings.logo) {
    window.dispatchEvent(new CustomEvent("gradly-school-profile", { detail: { logo: settings.logo } }));
  }
}

function restoreDesignSettings(settings: DesignSettings | null) {
  if (!settings) return;
  const panel = findVisibleEditorPanel();
  if (!panel || !panel.textContent?.includes("Result card design")) return;

  const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>("button"));
  if (settings.template) {
    buttons.find((button) => button.textContent?.includes(settings.template!) && templateNames.includes(settings.template!))?.click();
  }

  window.setTimeout(() => {
    const refreshed = findVisibleEditorPanel();
    if (!refreshed) return;
    const refreshedButtons = Array.from(refreshed.querySelectorAll<HTMLButtonElement>("button"));
    if (settings.palette) {
      refreshedButtons.find((button) => (button.textContent || "").trim() === settings.palette)?.click();
    }
    if (settings.paper) {
      refreshedButtons.find((button) => (button.textContent || "").trim() === settings.paper)?.click();
    }

    if (settings.paper === "Custom") {
      window.setTimeout(() => {
        const current = findVisibleEditorPanel();
        const inputs = current ? Array.from(current.querySelectorAll<HTMLInputElement>('input[type="number"]')) : [];
        if (inputs[0] && settings.customWidth) setNativeValue(inputs[0], settings.customWidth);
        if (inputs[1] && settings.customHeight) setNativeValue(inputs[1], settings.customHeight);
      }, 30);
    }
  }, 30);
}

export default function WorkspaceSettingsOverlay() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [panel, setPanel] = useState<SettingsPanel>(null);
  const priorStep = useRef<RecurringStep>("Student");
  const originalEditorStyle = useRef<string | null>(null);
  const originalFooterDisplay = useRef<string | null>(null);

  useEffect(() => {
    let restoreTimer = 0;

    const setup = () => {
      const actions = getHeaderActions();
      if (actions && !document.querySelector("[data-gradly-global-settings-host]")) {
        const host = document.createElement("div");
        host.dataset.gradlyGlobalSettingsHost = "true";
        host.className = "flex items-center gap-2";
        actions.insertBefore(host, actions.firstChild);
        setMount(host);
      }

      const institution = findWorkflowButton("Institution");
      const design = findWorkflowButton("Design");
      if (institution) institution.style.display = "none";
      if (design) design.style.display = "none";

      const editor = getEditor();
      const title = currentEditorTitle();
      const recurringIndex = recurringSteps.indexOf(title as RecurringStep);

      if (!panel && (title === "Institution" || title === "Design")) {
        clickWorkflow("Student");
        return;
      }

      if (!panel && recurringIndex >= 0 && editor) {
        const stepLabel = Array.from(editor.querySelectorAll<HTMLElement>("p")).find((node) =>
          /^Step\s+\d+\s+of\s+\d+/i.test(node.textContent?.trim() || ""),
        );
        if (stepLabel) stepLabel.textContent = `Step ${recurringIndex + 1} of 3`;

        const footer = editor.lastElementChild as HTMLElement | null;
        if (footer) {
          Array.from(footer.querySelectorAll<HTMLButtonElement>('button[aria-label^="Go to"]')).forEach((button) => {
            const label = button.getAttribute("aria-label") || "";
            if (label.includes("Institution") || label.includes("Design")) button.style.display = "none";
          });

          const footerButtons = Array.from(footer.querySelectorAll<HTMLButtonElement>("button"));
          const previous = footerButtons.find((button) => button.textContent?.trim() === "Previous");
          const next = footerButtons.find((button) => button.textContent?.includes("Next"));
          if (previous) previous.disabled = recurringIndex === 0;
          if (next) next.disabled = recurringIndex === recurringSteps.length - 1;
        }
      }

      const aside = document.querySelector<HTMLElement>("aside.no-print");
      if (aside) {
        const heading = Array.from(aside.querySelectorAll<HTMLElement>("h2")).find((node) => node.textContent?.includes("Academic workflow"));
        if (heading) heading.textContent = "Student result";
        const description = heading?.nextElementSibling as HTMLElement | null;
        if (description) description.textContent = "Enter each student’s details, marks, then finalize the record.";
      }
    };

    const restoreGlobals = () => {
      let schoolSettings: SchoolSettings | null = null;
      let designSettings: DesignSettings | null = null;
      try {
        const schoolRaw = localStorage.getItem(SCHOOL_KEY);
        const designRaw = localStorage.getItem(DESIGN_KEY);
        schoolSettings = schoolRaw ? JSON.parse(schoolRaw) : null;
        designSettings = designRaw ? JSON.parse(designRaw) : null;
      } catch {
        // Ignore malformed persisted data.
      }

      if (!schoolSettings && !designSettings) {
        clickWorkflow("Student");
        return;
      }

      if (schoolSettings) {
        clickWorkflow("Institution");
        window.setTimeout(() => restoreSchoolSettings(schoolSettings), 40);
      }

      if (designSettings) {
        window.setTimeout(() => {
          clickWorkflow("Design");
          window.setTimeout(() => restoreDesignSettings(designSettings), 40);
        }, schoolSettings ? 110 : 0);
      }

      restoreTimer = window.setTimeout(() => clickWorkflow("Student"), schoolSettings && designSettings ? 260 : 150);
    };

    const observer = new MutationObserver(setup);
    observer.observe(document.body, { childList: true, subtree: true });
    setup();
    const initialTimer = window.setTimeout(restoreGlobals, 120);

    const interceptNavigation = (event: MouseEvent) => {
      if (panel) return;
      const target = (event.target as HTMLElement | null)?.closest("button") as HTMLButtonElement | null;
      if (!target) return;
      const editor = getEditor();
      if (!editor || !editor.contains(target)) return;
      const text = target.textContent?.trim() || "";
      if (text !== "Previous" && !text.startsWith("Next")) return;

      const current = currentEditorTitle() as RecurringStep;
      const index = recurringSteps.indexOf(current);
      if (index < 0) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const nextIndex = text === "Previous" ? index - 1 : index + 1;
      if (nextIndex >= 0 && nextIndex < recurringSteps.length) clickWorkflow(recurringSteps[nextIndex]);
    };

    document.addEventListener("click", interceptNavigation, true);
    return () => {
      observer.disconnect();
      window.clearTimeout(initialTimer);
      window.clearTimeout(restoreTimer);
      document.removeEventListener("click", interceptNavigation, true);
      document.querySelector("[data-gradly-global-settings-host]")?.remove();
    };
  }, [panel]);

  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;

    if (!panel) return;

    const current = currentEditorTitle();
    if (recurringSteps.includes(current as RecurringStep)) priorStep.current = current as RecurringStep;

    originalEditorStyle.current = editor.getAttribute("style");
    const footer = editor.lastElementChild as HTMLElement | null;
    originalFooterDisplay.current = footer?.style.display ?? null;

    clickWorkflow(panel === "school" ? "Institution" : "Design");

    const apply = () => {
      editor.dataset.gradlySettingsOverlay = panel;
      editor.style.position = "fixed";
      editor.style.left = "50%";
      editor.style.top = "50%";
      editor.style.transform = "translate(-50%, -50%)";
      editor.style.width = panel === "design" ? "min(760px, calc(100vw - 32px))" : "min(620px, calc(100vw - 32px))";
      editor.style.height = "min(86vh, 880px)";
      editor.style.zIndex = "140";
      editor.style.overflowY = "auto";
      editor.style.boxShadow = "0 35px 120px rgba(15,34,57,.34)";
      editor.style.borderRadius = "28px";

      const activeFooter = editor.lastElementChild as HTMLElement | null;
      if (activeFooter) activeFooter.style.display = "none";
      const stepLabel = Array.from(editor.querySelectorAll<HTMLElement>("p")).find((node) =>
        /^Step\s+\d+\s+of\s+\d+/i.test(node.textContent?.trim() || ""),
      );
      if (stepLabel) stepLabel.textContent = "Global setup";
    };

    const timer = window.setTimeout(apply, 30);
    return () => window.clearTimeout(timer);
  }, [panel]);

  const closePanel = () => {
    const editor = getEditor();
    if (panel === "school") saveSchoolSettings();
    if (panel === "design") saveDesignSettings();

    if (editor) {
      if (originalEditorStyle.current === null) editor.removeAttribute("style");
      else editor.setAttribute("style", originalEditorStyle.current);
      delete editor.dataset.gradlySettingsOverlay;
      const footer = editor.lastElementChild as HTMLElement | null;
      if (footer) footer.style.display = originalFooterDisplay.current ?? "";
    }

    setPanel(null);
    window.setTimeout(() => clickWorkflow(priorStep.current), 0);
  };

  const controls = mount
    ? createPortal(
        <>
          <button
            type="button"
            onClick={() => setPanel("school")}
            className="hidden items-center gap-2 rounded-xl border border-[#d9d5cc] bg-white px-3.5 py-2.5 text-xs font-black text-slate-600 transition hover:border-[#17365D]/30 hover:text-[#17365D] sm:flex"
            title="School settings"
          >
            <School size={15} />
            School
          </button>
          <button
            type="button"
            onClick={() => setPanel("design")}
            className="hidden items-center gap-2 rounded-xl border border-[#d9d5cc] bg-white px-3.5 py-2.5 text-xs font-black text-slate-600 transition hover:border-[#17365D]/30 hover:text-[#17365D] sm:flex"
            title="Result card design"
          >
            <LayoutTemplate size={15} />
            Design
          </button>
        </>,
        mount,
      )
    : null;

  const overlay = panel
    ? createPortal(
        <>
          <button
            type="button"
            aria-label={`Close ${panel} settings`}
            onClick={closePanel}
            className="no-print fixed inset-0 z-[130] cursor-default bg-[#0f2239]/55 backdrop-blur-sm"
          />
          <button
            type="button"
            onClick={closePanel}
            aria-label="Close settings"
            className="no-print fixed right-5 top-5 z-[150] grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white text-[#17365D] shadow-2xl transition hover:scale-105"
          >
            <X size={18} />
          </button>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      {controls}
      {overlay}
    </>
  );
}
