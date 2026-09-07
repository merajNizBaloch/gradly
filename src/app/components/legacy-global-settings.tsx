"use client";

import {
  Check,
  ImagePlus,
  LayoutTemplate,
  Palette,
  Printer,
  School,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";

type RecurringStep = "Student" | "Marks" | "Finalize";
type PaperName = "A4" | "A5" | "Letter" | "Legal" | "Custom";

type SchoolProfile = {
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

type DesignState = {
  template: string;
  palette: string;
  paper: PaperName;
  customWidth?: string;
  customHeight?: string;
};

type Theme = { name: string; ink: string; wash: string; accent: string };
type DesignTemplate = { name: string; description: string; themes: Theme[] };

const SCHOOL_KEY = "gradly-global-school";
const PROFILE_KEY = "gradly-school-profile";
const DESIGN_KEY = "gradly-global-design";
const recurringSteps: RecurringStep[] = ["Student", "Marks", "Finalize"];

const designs: DesignTemplate[] = [
  {
    name: "Academic",
    description: "Formal institutional report",
    themes: [
      { name: "Navy", ink: "#17365D", wash: "#F3F6F9", accent: "#17365D" },
      { name: "Emerald", ink: "#155E4A", wash: "#F1F8F5", accent: "#167A5B" },
      { name: "Burgundy", ink: "#6B2435", wash: "#FBF3F5", accent: "#9B3A50" },
      { name: "Plum", ink: "#4B315F", wash: "#F7F3F9", accent: "#74518B" },
    ],
  },
  {
    name: "Modern",
    description: "Contemporary rounded layout",
    themes: [
      { name: "Ocean", ink: "#155E75", wash: "#F0F9FA", accent: "#0E7490" },
      { name: "Forest", ink: "#1F5A43", wash: "#F1F8F4", accent: "#2D7A5B" },
      { name: "Coral", ink: "#9A3F3F", wash: "#FFF5F3", accent: "#C15B52" },
      { name: "Indigo", ink: "#4338A8", wash: "#F3F4FF", accent: "#5B5BD6" },
    ],
  },
  {
    name: "Certificate",
    description: "Ornate ceremonial layout",
    themes: [
      { name: "Antique Gold", ink: "#5B3A20", wash: "#FBF6EE", accent: "#A9793D" },
      { name: "Jade", ink: "#14532D", wash: "#F2F8F3", accent: "#4D8B63" },
      { name: "Crimson", ink: "#641E2B", wash: "#FBF2F4", accent: "#A54A5A" },
      { name: "Royal Blue", ink: "#253B73", wash: "#F2F5FB", accent: "#5D74B4" },
    ],
  },
  {
    name: "Executive",
    description: "Luxury leadership report",
    themes: [
      { name: "Charcoal", ink: "#252525", wash: "#F5F5F3", accent: "#6B6B66" },
      { name: "Midnight", ink: "#172554", wash: "#F1F4FA", accent: "#3D5A9B" },
      { name: "Wine", ink: "#5C1F35", wash: "#FBF2F6", accent: "#9A4968" },
      { name: "Plum", ink: "#31233D", wash: "#F6F1F8", accent: "#74558A" },
    ],
  },
  {
    name: "Minimal",
    description: "Clean compact academic",
    themes: [
      { name: "Slate", ink: "#334155", wash: "#F8FAFC", accent: "#64748B" },
      { name: "Teal", ink: "#115E59", wash: "#F0FDFA", accent: "#0F766E" },
      { name: "Olive", ink: "#465A32", wash: "#F5F8F0", accent: "#6C824D" },
      { name: "Rose", ink: "#7A3E4B", wash: "#FFF6F7", accent: "#A95D6C" },
    ],
  },
];

const defaultSchool: SchoolProfile = {
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

function getHeaderActions() {
  const header = document.querySelector<HTMLElement>("header.no-print");
  const row = header?.children.item(1) as HTMLElement | null;
  return (row?.lastElementChild as HTMLElement | null) ?? null;
}

function getEditor() {
  return (
    Array.from(document.querySelectorAll<HTMLElement>("section.no-print")).find(
      (section) => section.className.includes("gradly-workspace-scroll") && section.querySelector("h1"),
    ) ?? null
  );
}

function getWorkflowNav() {
  return document.querySelector<HTMLElement>("aside.no-print nav");
}

function findWorkflowButton(label: string) {
  const nav = getWorkflowNav();
  return (
    nav
      ? Array.from(nav.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
          (button.textContent || "").includes(label),
        )
      : null
  ) ?? null;
}

function clickWorkflow(label: string) {
  findWorkflowButton(label)?.click();
}

function currentEditorTitle() {
  return getEditor()?.querySelector("h1")?.textContent?.trim() || "";
}

function findPanel(text: string) {
  const editor = getEditor();
  if (!editor) return null;
  return (
    Array.from(editor.querySelectorAll<HTMLElement>(":scope > div:nth-child(2) > div")).find((node) =>
      node.textContent?.includes(text),
    ) ?? null
  );
}

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function readSchoolFromPage(): SchoolProfile {
  const panel = findPanel("School identity");
  const inputs = panel
    ? Array.from(panel.querySelectorAll<HTMLInputElement>("input")).filter((input) => input.type !== "file")
    : [];
  let stored: Partial<SchoolProfile> = {};
  try {
    stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  } catch {
    stored = {};
  }
  return {
    ...defaultSchool,
    ...stored,
    name: inputs[0]?.value || stored.name || defaultSchool.name,
    motto: inputs[1]?.value || stored.motto || defaultSchool.motto,
    address: inputs[2]?.value || stored.address || defaultSchool.address,
    contact: inputs[3]?.value || stored.contact || defaultSchool.contact,
    logo: stored.logo || document.querySelector<HTMLImageElement>('img[alt="School logo"]')?.src || "",
  };
}

function applyLogoTransform(profile: SchoolProfile) {
  const card = document.querySelector<HTMLElement>(".gradly-paper");
  const image = card?.querySelector<HTMLImageElement>('img[alt="School logo"]');
  if (image) {
    image.style.transform = `translate(${profile.x}%, ${profile.y}%) scale(${profile.zoom / 100})`;
    image.style.transformOrigin = "center";
  }
  if (card && profile.logo) {
    const opacity = profile.removeWhite ? 0.72 : 0.9;
    card.style.backgroundImage = `linear-gradient(rgba(255,255,255,${opacity}),rgba(255,255,255,${opacity})),url("${profile.logo}")`;
    card.style.backgroundPosition = `${50 + profile.x}% ${50 + profile.y}%`;
    card.style.backgroundSize = `${48 * (profile.zoom / 100)}% auto`;
    card.style.backgroundRepeat = "no-repeat";
  }
}

function applySchoolToPage(profile: SchoolProfile) {
  const panel = findPanel("School identity");
  const inputs = panel
    ? Array.from(panel.querySelectorAll<HTMLInputElement>("input")).filter((input) => input.type !== "file")
    : [];
  [profile.name, profile.motto, profile.address, profile.contact].forEach((value, index) => {
    if (inputs[index]) setNativeValue(inputs[index], value);
  });
  if (profile.logo) {
    window.dispatchEvent(new CustomEvent("gradly-school-profile", { detail: profile }));
    window.setTimeout(() => applyLogoTransform(profile), 90);
  }
}

function readDesignFromPage(): DesignState {
  const panel = findPanel("Result card design");
  const buttons = panel ? Array.from(panel.querySelectorAll<HTMLButtonElement>("button")) : [];
  const templateButton = buttons.find((button) => button.textContent?.includes("Selected"));
  const template = designs.find((item) => templateButton?.textContent?.includes(item.name))?.name || "Academic";
  const activeDesign = designs.find((item) => item.name === template) || designs[0];
  const paletteButton = buttons.find(
    (button) => button.className.includes("bg-[#f4f7fa]") && activeDesign.themes.some((theme) => button.textContent?.includes(theme.name)),
  );
  const palette = activeDesign.themes.find((theme) => paletteButton?.textContent?.includes(theme.name))?.name || activeDesign.themes[0].name;
  const paperNames: PaperName[] = ["A4", "A5", "Letter", "Legal", "Custom"];
  const paperButton = buttons.find(
    (button) => paperNames.includes((button.textContent || "").trim() as PaperName) && button.className.includes("bg-[#17365D]"),
  );
  const numbers = panel ? Array.from(panel.querySelectorAll<HTMLInputElement>('input[type="number"]')) : [];
  return {
    template,
    palette,
    paper: ((paperButton?.textContent || "A4").trim() as PaperName),
    customWidth: numbers[0]?.value,
    customHeight: numbers[1]?.value,
  };
}

function clickPanelButton(panel: HTMLElement | null, predicate: (button: HTMLButtonElement) => boolean) {
  const button = panel ? Array.from(panel.querySelectorAll<HTMLButtonElement>("button")).find(predicate) : null;
  button?.click();
}

function applyDesignToPage(state: DesignState) {
  let panel = findPanel("Result card design");
  clickPanelButton(panel, (button) => button.textContent?.includes(state.template) === true);
  window.setTimeout(() => {
    panel = findPanel("Result card design");
    clickPanelButton(panel, (button) => (button.textContent || "").trim() === state.palette);
    clickPanelButton(panel, (button) => (button.textContent || "").trim() === state.paper);
    if (state.paper === "Custom") {
      window.setTimeout(() => {
        const current = findPanel("Result card design");
        const inputs = current ? Array.from(current.querySelectorAll<HTMLInputElement>('input[type="number"]')) : [];
        if (inputs[0] && state.customWidth) setNativeValue(inputs[0], state.customWidth);
        if (inputs[1] && state.customHeight) setNativeValue(inputs[1], state.customHeight);
      }, 30);
    }
  }, 45);
}

function removeWhiteFromImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) return resolve(dataUrl);
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < pixels.data.length; index += 4) {
        if (pixels.data[index] > 238 && pixels.data[index + 1] > 238 && pixels.data[index + 2] > 238) {
          pixels.data[index + 3] = 0;
        }
      }
      context.putImageData(pixels, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.src = dataUrl;
  });
}

function saveSchool(profile: SchoolProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(
      SCHOOL_KEY,
      JSON.stringify({ name: profile.name, motto: profile.motto, address: profile.address, contact: profile.contact, logo: profile.logo }),
    );
  } catch {
    // Browser storage is optional.
  }
}

function saveDesign(state: DesignState) {
  try {
    localStorage.setItem(DESIGN_KEY, JSON.stringify(state));
  } catch {
    // Browser storage is optional.
  }
}

function CardPreview({ version = 0 }: { version?: number }) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let timer = 0;
    const render = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = targetRef.current;
        const source = document.querySelector<HTMLElement>(".gradly-paper");
        if (!target || !source) return;
        const width = source.offsetWidth || source.getBoundingClientRect().width;
        const height = source.offsetHeight || source.getBoundingClientRect().height;
        if (!width || !height) return;
        const clone = source.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("script,button,input,textarea,select,.no-print").forEach((node) => node.remove());
        clone.style.width = `${width}px`;
        clone.style.height = `${height}px`;
        clone.style.minWidth = `${width}px`;
        clone.style.minHeight = `${height}px`;
        clone.style.maxWidth = "none";
        clone.style.maxHeight = "none";
        clone.style.margin = "0";
        clone.style.zoom = "1";
        clone.style.transform = "none";
        target.innerHTML = "";
        const host = document.createElement("div");
        host.style.position = "absolute";
        host.style.left = "0";
        host.style.top = "0";
        host.style.width = `${width}px`;
        host.style.height = `${height}px`;
        host.style.transformOrigin = "top left";
        host.appendChild(clone);
        target.appendChild(host);
        const fit = () => {
          const availableWidth = target.clientWidth;
          const availableHeight = target.clientHeight;
          const scale = Math.min(1, availableWidth / width, availableHeight / height);
          host.style.transform = `scale(${scale})`;
          host.style.left = `${Math.max(0, (availableWidth - width * scale) / 2)}px`;
          host.style.top = `${Math.max(0, (availableHeight - height * scale) / 2)}px`;
        };
        fit();
      });
    };
    render();
    timer = window.setTimeout(render, 120);
    const source = document.querySelector<HTMLElement>(".gradly-paper");
    const observer = new MutationObserver(render);
    if (source) observer.observe(source, { subtree: true, childList: true, characterData: true, attributes: true });
    const resize = new ResizeObserver(render);
    if (targetRef.current) resize.observe(targetRef.current);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      observer.disconnect();
      resize.disconnect();
    };
  }, [version]);

  return <div ref={targetRef} className="relative h-full min-h-[360px] w-full overflow-hidden rounded-xl bg-white shadow-lg" />;
}

function TemplateCard({ design, selected, onClick }: { design: DesignTemplate; selected: boolean; onClick: () => void }) {
  const theme = design.themes[0];
  return (
    <button type="button" onClick={onClick} title={design.description} className="group text-left">
      <div className={`relative overflow-hidden rounded-xl border bg-white transition ${selected ? "border-[#17365D] shadow-md ring-1 ring-[#17365D]/10" : "border-gray-200 shadow-sm hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"}`}>
        <div className="h-28 p-2.5" style={{ backgroundColor: theme.wash }}>
          <div className="h-full overflow-hidden rounded-md border bg-white shadow-sm" style={{ borderColor: theme.ink }}>
            <div className="flex items-center gap-1.5 border-b-2 p-2" style={{ borderColor: theme.ink }}>
              <span className="h-5 w-5 shrink-0 rounded-full" style={{ backgroundColor: theme.accent }} />
              <div className="min-w-0 flex-1">
                <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: theme.ink }} />
                <div className="mt-1 h-1 w-10 rounded-full bg-gray-200" />
              </div>
            </div>
            <div className="p-2">
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="mt-1.5 flex gap-1">
                  <span className="h-1 flex-1 rounded bg-gray-200" />
                  <span className="h-1 w-5 rounded bg-gray-200" />
                  <span className="h-1 w-4 rounded bg-gray-200" />
                </div>
              ))}
              <div className="mt-2 h-5 rounded" style={{ backgroundColor: theme.wash }} />
            </div>
          </div>
        </div>
        <div className="p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold">{design.name}</p>
              <p className="mt-0.5 text-[9px] leading-4 text-gray-400">{design.description}</p>
            </div>
            {selected && <span className="grid h-6 w-6 place-items-center rounded-full bg-[#17365D] text-white"><Check size={13} /></span>}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function LegacyGlobalSettings() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [schoolDraft, setSchoolDraft] = useState<SchoolProfile>(defaultSchool);
  const [schoolSnapshot, setSchoolSnapshot] = useState<SchoolProfile>(defaultSchool);
  const [designDraft, setDesignDraft] = useState<DesignState>({ template: "Academic", palette: "Navy", paper: "A4" });
  const [designSnapshot, setDesignSnapshot] = useState<DesignState>({ template: "Academic", palette: "Navy", paper: "A4" });
  const [previewVersion, setPreviewVersion] = useState(0);

  const currentDesign = useMemo(
    () => designs.find((item) => item.name === designDraft.template) || designs[0],
    [designDraft.template],
  );

  useEffect(() => {
    const setup = () => {
      const actions = getHeaderActions();
      if (actions && !document.querySelector("[data-gradly-legacy-settings-host]")) {
        const host = document.createElement("div");
        host.dataset.gradlyLegacySettingsHost = "true";
        host.className = "flex items-center gap-2";
        actions.insertBefore(host, actions.firstChild);
        setMount(host);
      }

      const institution = findWorkflowButton("Institution");
      const design = findWorkflowButton("Design");
      if (institution) institution.style.display = "none";
      if (design) design.style.display = "none";

      recurringSteps.forEach((label, index) => {
        const button = findWorkflowButton(label);
        if (!button) return;
        button.style.display = "";
        const number = button.querySelector<HTMLElement>("span.min-w-0 > span:first-child");
        if (number) number.textContent = String(index + 1).padStart(2, "0");
      });

      const title = currentEditorTitle();
      if (title === "Institution" || title === "Design") {
        clickWorkflow("Student");
        return;
      }

      const index = recurringSteps.indexOf(title as RecurringStep);
      const editor = getEditor();
      if (index >= 0 && editor) {
        const stepLabel = Array.from(editor.querySelectorAll<HTMLElement>("p")).find((node) => /^Step\s+\d+\s+of\s+\d+/i.test(node.textContent?.trim() || ""));
        if (stepLabel) stepLabel.textContent = `Step ${index + 1} of 3`;
        const footer = editor.lastElementChild as HTMLElement | null;
        if (footer) {
          Array.from(footer.querySelectorAll<HTMLButtonElement>('button[aria-label^="Go to"]')).forEach((button) => {
            const label = button.getAttribute("aria-label") || "";
            button.style.display = label.includes("Institution") || label.includes("Design") ? "none" : "";
          });
          const buttons = Array.from(footer.querySelectorAll<HTMLButtonElement>("button"));
          const previous = buttons.find((button) => button.textContent?.trim() === "Previous");
          const next = buttons.find((button) => button.textContent?.includes("Next"));
          if (previous) previous.disabled = index === 0;
          if (next) next.disabled = index === 2;
        }
      }

      const aside = document.querySelector<HTMLElement>("aside.no-print");
      const heading = aside ? Array.from(aside.querySelectorAll<HTMLElement>("h2")).find((node) => node.textContent?.includes("Academic workflow") || node.textContent?.includes("Student result")) : null;
      if (heading) heading.textContent = "Student result";
      const description = heading?.nextElementSibling as HTMLElement | null;
      if (description) description.textContent = "Enter student details, marks, then finalize the record.";
    };

    const observer = new MutationObserver(setup);
    observer.observe(document.body, { subtree: true, childList: true });
    setup();
    const start = window.setTimeout(() => {
      if (currentEditorTitle() === "Institution" || currentEditorTitle() === "Design") clickWorkflow("Student");
    }, 90);

    const intercept = (event: MouseEvent) => {
      if (schoolOpen || designOpen) return;
      const target = (event.target as HTMLElement | null)?.closest("button") as HTMLButtonElement | null;
      if (!target) return;
      const editor = getEditor();
      if (!editor || !editor.contains(target)) return;
      const text = target.textContent?.trim() || "";
      if (text !== "Previous" && !text.startsWith("Next")) return;
      const index = recurringSteps.indexOf(currentEditorTitle() as RecurringStep);
      if (index < 0) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const nextIndex = text === "Previous" ? index - 1 : index + 1;
      if (nextIndex >= 0 && nextIndex < recurringSteps.length) clickWorkflow(recurringSteps[nextIndex]);
    };
    document.addEventListener("click", intercept, true);

    return () => {
      observer.disconnect();
      window.clearTimeout(start);
      document.removeEventListener("click", intercept, true);
      document.querySelector("[data-gradly-legacy-settings-host]")?.remove();
    };
  }, [schoolOpen, designOpen]);

  const openSchool = () => {
    const current = readSchoolFromPage();
    setSchoolSnapshot(current);
    setSchoolDraft(current);
    setSchoolOpen(true);
    setPreviewVersion((value) => value + 1);
  };

  const updateSchool = (patch: Partial<SchoolProfile>) => {
    setSchoolDraft((current) => {
      const next = { ...current, ...patch };
      applySchoolToPage(next);
      window.setTimeout(() => setPreviewVersion((value) => value + 1), 40);
      return next;
    });
  };

  const chooseLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = String(reader.result);
      const logo = schoolDraft.removeWhite ? await removeWhiteFromImage(raw) : raw;
      updateSchool({ logo });
    };
    reader.readAsDataURL(file);
  };

  const cancelSchool = () => {
    applySchoolToPage(schoolSnapshot);
    setSchoolOpen(false);
  };

  const commitSchool = () => {
    saveSchool(schoolDraft);
    applySchoolToPage(schoolDraft);
    setSchoolOpen(false);
  };

  const openDesign = () => {
    const current = readDesignFromPage();
    setDesignSnapshot(current);
    setDesignDraft(current);
    setDesignOpen(true);
    setPreviewVersion((value) => value + 1);
  };

  const chooseTemplate = (name: string) => {
    const nextDesign = designs.find((item) => item.name === name) || designs[0];
    const next = { ...designDraft, template: name, palette: nextDesign.themes[0].name };
    setDesignDraft(next);
    applyDesignToPage(next);
    window.setTimeout(() => setPreviewVersion((value) => value + 1), 100);
  };

  const choosePalette = (palette: string) => {
    const next = { ...designDraft, palette };
    setDesignDraft(next);
    applyDesignToPage(next);
    window.setTimeout(() => setPreviewVersion((value) => value + 1), 80);
  };

  const choosePaper = (paper: PaperName) => {
    const next = { ...designDraft, paper };
    setDesignDraft(next);
    applyDesignToPage(next);
    window.setTimeout(() => setPreviewVersion((value) => value + 1), 80);
  };

  const cancelDesign = () => {
    applyDesignToPage(designSnapshot);
    setDesignOpen(false);
  };

  const commitDesign = () => {
    saveDesign(designDraft);
    applyDesignToPage(designDraft);
    setDesignOpen(false);
  };

  const controls = mount
    ? createPortal(
        <>
          <button
            type="button"
            onClick={openSchool}
            className="group hidden items-center gap-2 rounded-xl border border-[#17365D]/15 bg-[#17365D] px-3.5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex"
            title="Edit school profile"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10"><School size={15} /></span>
            <span>School</span>
          </button>
          <button
            type="button"
            onClick={openDesign}
            className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:flex"
            title="Result card design"
          >
            <LayoutTemplate size={15} className="text-[#17365D]" />
            Design
          </button>
        </>,
        mount,
      )
    : null;

  const schoolModal = schoolOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="School profile"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelSchool();
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/40 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">School profile</p>
                <h2 className="mt-1 text-lg font-black text-slate-900">Branding & printed identity</h2>
              </div>
              <button type="button" onClick={cancelSchool} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="Close school profile"><X size={17} /></button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[minmax(320px,0.75fr)_minmax(420px,1.25fr)]">
              <div className="space-y-4 overflow-auto p-5">
                {[
                  ["School name", "name", "School name"],
                  ["Motto", "motto", "School motto"],
                  ["Address", "address", "School address"],
                  ["Contact", "contact", "Phone or email"],
                ].map(([label, key, placeholder]) => (
                  <label key={key} className="block">
                    <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{label}</span>
                    <input
                      value={schoolDraft[key as keyof Pick<SchoolProfile, "name" | "motto" | "address" | "contact">]}
                      onChange={(event) => updateSchool({ [key]: event.target.value } as Partial<SchoolProfile>)}
                      placeholder={placeholder}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#17365D] focus:ring-4 focus:ring-[#17365D]/10"
                    />
                  </label>
                ))}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Logo</p>
                      <p className="mt-1 text-[10px] text-slate-400">Upload a transparent PNG for the cleanest result.</p>
                    </div>
                    <ImagePlus size={18} className="text-slate-400" />
                  </div>

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-[11px] font-extrabold text-slate-600 transition hover:border-[#17365D]/40 hover:bg-slate-50">
                    <Upload size={14} />
                    Upload school logo
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => chooseLogo(event.target.files?.[0])} />
                  </label>

                  {schoolDraft.logo && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
                      <div className="grid min-h-28 place-items-center overflow-hidden rounded-lg bg-slate-50">
                        <img
                          src={schoolDraft.logo}
                          alt="School logo preview"
                          className="max-h-24 max-w-full object-contain"
                          style={{ transform: `translate(${schoolDraft.x}%, ${schoolDraft.y}%) scale(${schoolDraft.zoom / 100})` }}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => updateSchool({ zoom: Math.min(180, schoolDraft.zoom + 10) })} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-bold text-slate-600"><ZoomIn size={13} /> Zoom +</button>
                        <button type="button" onClick={() => updateSchool({ zoom: Math.max(60, schoolDraft.zoom - 10) })} className="rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-bold text-slate-600">Zoom −</button>
                      </div>
                      <label className="mt-3 flex items-center gap-2 text-[10px] font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={schoolDraft.removeWhite}
                          onChange={async (event) => {
                            const checked = event.target.checked;
                            if (checked && schoolDraft.logo) {
                              const logo = await removeWhiteFromImage(schoolDraft.logo);
                              updateSchool({ removeWhite: true, logo });
                            } else {
                              updateSchool({ removeWhite: checked });
                            }
                          }}
                        />
                        Remove white background
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={cancelSchool} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-600">Cancel</button>
                  <button type="button" onClick={commitSchool} className="rounded-xl bg-[#17365D] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Save school profile</button>
                </div>
              </div>

              <div className="min-h-[420px] border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
                <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-inner">
                  <div className="mb-2 flex shrink-0 items-center justify-between px-1">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Printed result preview</span>
                      <p className="mt-0.5 text-[10px] text-slate-400">The actual result-card layout, scaled for editing.</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">LIVE</span>
                  </div>
                  <div className="min-h-[380px] min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-300 bg-slate-200/70 p-3">
                    <CardPreview version={previewVersion} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  const designModal = designOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Result card design"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelDesign();
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/40 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Result card design</p>
                <h2 className="mt-1 text-lg font-black text-slate-900">Templates & appearance</h2>
              </div>
              <button type="button" onClick={cancelDesign} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="Close design settings"><X size={17} /></button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[minmax(430px,1fr)_minmax(420px,1fr)]">
              <div className="overflow-auto p-5">
                <div className="no-print rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[.16em] text-gray-400">Design library</p>
                      <p className="mt-1 text-sm font-bold">Choose a result card style</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[9px] font-bold text-gray-500">5 layouts · 20 palettes</span>
                  </div>

                  <div className="mb-4 rounded-xl bg-[#f7f8f6] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-gray-400">Current design</p>
                        <p className="mt-1 text-sm font-bold">{designDraft.template} · {designDraft.palette}</p>
                      </div>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm" style={{ color: currentDesign.themes.find((theme) => theme.name === designDraft.palette)?.ink || currentDesign.themes[0].ink }}><Palette size={15} /></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {designs.map((design) => (
                      <TemplateCard key={design.name} design={design} selected={designDraft.template === design.name} onClick={() => chooseTemplate(design.name)} />
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-[.16em] text-gray-400">Color system</span>
                      <span className="text-[10px] font-semibold text-gray-400">{currentDesign.themes.length} palettes</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentDesign.themes.map((theme) => (
                        <button
                          key={theme.name}
                          type="button"
                          title={theme.name}
                          onClick={() => choosePalette(theme.name)}
                          className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[10px] font-bold transition ${designDraft.palette === theme.name ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white text-gray-600"}`}
                        >
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.ink }} />
                          {theme.name}
                          {designDraft.palette === theme.name && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] font-medium text-gray-500">{currentDesign.description}</p>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-[#fafaf8] p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Printer size={14} className="text-[#17365D]" />
                      <p className="text-xs font-bold text-slate-700">Paper format</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(["A4", "A5", "Letter", "Legal", "Custom"] as PaperName[]).map((paper) => (
                        <button
                          key={paper}
                          type="button"
                          onClick={() => choosePaper(paper)}
                          className={`rounded-lg border px-3 py-2 text-[10px] font-bold ${designDraft.paper === paper ? "border-[#17365D] bg-[#17365D] text-white" : "border-gray-200 bg-white text-gray-600"}`}
                        >
                          {paper}
                        </button>
                      ))}
                    </div>
                    {designDraft.paper === "Custom" && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-gray-400">Width (mm)</span>
                          <input value={designDraft.customWidth || "210"} onChange={(event) => { const next = { ...designDraft, customWidth: event.target.value }; setDesignDraft(next); applyDesignToPage(next); }} type="number" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#17365D]" />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-gray-400">Height (mm)</span>
                          <input value={designDraft.customHeight || "297"} onChange={(event) => { const next = { ...designDraft, customHeight: event.target.value }; setDesignDraft(next); applyDesignToPage(next); }} type="number" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#17365D]" />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="min-h-[420px] border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
                <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-inner">
                  <div className="mb-2 flex shrink-0 items-center justify-between px-1">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Live result preview</span>
                      <p className="mt-0.5 text-[10px] text-slate-400">Design changes appear here immediately.</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">LIVE</span>
                  </div>
                  <div className="min-h-[380px] min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-300 bg-slate-200/70 p-3">
                    <CardPreview version={previewVersion} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button type="button" onClick={cancelDesign} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-500">Cancel</button>
              <button type="button" onClick={commitDesign} className="rounded-xl bg-[#17365D] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm">Save design</button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {controls}
      {schoolModal}
      {designModal}
    </>
  );
}
