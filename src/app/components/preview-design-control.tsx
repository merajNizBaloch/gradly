"use client";

import { Check, ChevronDown, LayoutTemplate, Palette } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";

type PaperName = "A4" | "A5" | "Letter" | "Legal" | "Custom";
type Theme = { name: string; ink: string; wash: string; accent: string };
type DesignTemplate = { name: string; description: string; themes: Theme[] };
type DesignState = { template: string; palette: string; paper: PaperName; customWidth?: string; customHeight?: string };

const DESIGN_KEY = "gradly-global-design";

const designs: DesignTemplate[] = [
  { name: "Academic", description: "Formal institutional report", themes: [
    { name: "Navy", ink: "#17365D", wash: "#F3F6F9", accent: "#17365D" },
    { name: "Emerald", ink: "#155E4A", wash: "#F1F8F5", accent: "#167A5B" },
    { name: "Burgundy", ink: "#6B2435", wash: "#FBF3F5", accent: "#9B3A50" },
    { name: "Plum", ink: "#4B315F", wash: "#F7F3F9", accent: "#74518B" },
  ]},
  { name: "Modern", description: "Contemporary rounded layout", themes: [
    { name: "Ocean", ink: "#155E75", wash: "#F0F9FA", accent: "#0E7490" },
    { name: "Forest", ink: "#1F5A43", wash: "#F1F8F4", accent: "#2D7A5B" },
    { name: "Coral", ink: "#9A3F3F", wash: "#FFF5F3", accent: "#C15B52" },
    { name: "Indigo", ink: "#4338A8", wash: "#F3F4FF", accent: "#5B5BD6" },
  ]},
  { name: "Certificate", description: "Ornate ceremonial layout", themes: [
    { name: "Antique Gold", ink: "#5B3A20", wash: "#FBF6EE", accent: "#A9793D" },
    { name: "Jade", ink: "#14532D", wash: "#F2F8F3", accent: "#4D8B63" },
    { name: "Crimson", ink: "#641E2B", wash: "#FBF2F4", accent: "#A54A5A" },
    { name: "Royal Blue", ink: "#253B73", wash: "#F2F5FB", accent: "#5D74B4" },
  ]},
  { name: "Executive", description: "Luxury leadership report", themes: [
    { name: "Charcoal", ink: "#252525", wash: "#F5F5F3", accent: "#6B6B66" },
    { name: "Midnight", ink: "#172554", wash: "#F1F4FA", accent: "#3D5A9B" },
    { name: "Wine", ink: "#5C1F35", wash: "#FBF2F6", accent: "#9A4968" },
    { name: "Plum", ink: "#31233D", wash: "#F6F1F8", accent: "#74558A" },
  ]},
  { name: "Minimal", description: "Clean compact academic", themes: [
    { name: "Slate", ink: "#334155", wash: "#F8FAFC", accent: "#64748B" },
    { name: "Teal", ink: "#115E59", wash: "#F0FDFA", accent: "#0F766E" },
    { name: "Olive", ink: "#465A32", wash: "#F5F8F0", accent: "#6C824D" },
    { name: "Rose", ink: "#7A3E4B", wash: "#FFF6F7", accent: "#A95D6C" },
  ]},
];

function loadDesign(): DesignState {
  try {
    return { template: "Academic", palette: "Navy", paper: "A4", ...JSON.parse(localStorage.getItem(DESIGN_KEY) || "{}") };
  } catch {
    return { template: "Academic", palette: "Navy", paper: "A4" };
  }
}

function designPanel() {
  const editor = document.querySelector<HTMLElement>("section.no-print.gradly-workspace-scroll");
  if (!editor) return null;
  return Array.from(editor.querySelectorAll<HTMLElement>(":scope > div:nth-child(2) > div")).find((node) =>
    node.textContent?.includes("Result card design"),
  ) ?? null;
}

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function animateCard() {
  const card = document.querySelector<HTMLElement>(".gradly-paper");
  if (!card || typeof card.animate !== "function") return;
  card.getAnimations().forEach((animation) => animation.cancel());
  card.animate(
    [
      { opacity: 0.82, transform: "scale(.992) translateY(2px)" },
      { opacity: 1, transform: "scale(1) translateY(0)" },
    ],
    { duration: 240, easing: "cubic-bezier(.22,1,.36,1)" },
  );
}

function applyDesign(state: DesignState) {
  let panel = designPanel();
  if (!panel) return;

  const templateButton = Array.from(panel.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    button.textContent?.includes(state.template),
  );
  templateButton?.click();

  window.setTimeout(() => {
    panel = designPanel();
    if (!panel) return;
    const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>("button"));
    buttons.find((button) => (button.textContent || "").trim() === state.palette)?.click();
    buttons.find((button) => (button.textContent || "").trim() === state.paper)?.click();

    if (state.paper === "Custom") {
      window.setTimeout(() => {
        const current = designPanel();
        const inputs = current ? Array.from(current.querySelectorAll<HTMLInputElement>('input[type="number"]')) : [];
        if (inputs[0] && state.customWidth) setNativeValue(inputs[0], state.customWidth);
        if (inputs[1] && state.customHeight) setNativeValue(inputs[1], state.customHeight);
        animateCard();
      }, 35);
    } else {
      animateCard();
    }
  }, 35);
}

function saveAndApply(state: DesignState) {
  try { localStorage.setItem(DESIGN_KEY, JSON.stringify(state)); } catch {}
  applyDesign(state);
}

function findPreviewHeader(): HTMLElement | null {
  const labels = Array.from(document.querySelectorAll<HTMLElement>("p"));
  const label = labels.find((node) => node.textContent?.trim() === "Live preview");
  return label?.closest<HTMLElement>("div.no-print") ?? null;
}

export default function PreviewDesignControl() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [design, setDesign] = useState<DesignState>({ template: "Academic", palette: "Navy", paper: "A4" });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadDesign();
    setDesign(saved);
    const timer = window.setTimeout(() => {
      const preview = findPreviewHeader();
      if (preview) {
        let mount = preview.querySelector<HTMLElement>("[data-gradly-preview-design]");
        if (!mount) {
          mount = document.createElement("div");
          mount.dataset.gradlyPreviewDesign = "true";
          mount.className = "relative ml-auto flex items-center";
          preview.appendChild(mount);
        }
        setHost(mount);
      }

      document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        if ((button.textContent || "").trim() === "Design" && !button.closest("[data-gradly-preview-design]")) {
          button.style.display = "none";
        }
      });

      applyDesign(saved);
    }, 220);

    return () => {
      window.clearTimeout(timer);
      document.querySelector("[data-gradly-preview-design]")?.remove();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const activeTemplate = useMemo(
    () => designs.find((item) => item.name === design.template) || designs[0],
    [design.template],
  );
  const activeTheme = activeTemplate.themes.find((theme) => theme.name === design.palette) || activeTemplate.themes[0];

  const updateLive = (next: DesignState) => {
    setDesign(next);
    saveAndApply(next);
  };

  const control = host ? createPortal(
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex items-center gap-2.5 rounded-xl border border-[#d8dde4] bg-white px-3 py-2 shadow-sm transition hover:border-[#17365D]/30 hover:shadow-md"
        title="Change result card design"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#17365D] text-white"><LayoutTemplate size={15} /></span>
        <span className="hidden text-left sm:block">
          <span className="block text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Design</span>
          <span className="mt-0.5 block text-[11px] font-black text-slate-700">{design.template} · {design.palette}</span>
        </span>
        <ChevronDown size={13} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[150] w-[min(92vw,430px)] overflow-hidden rounded-2xl border border-[#ded9d0] bg-[#fffdfa] shadow-[0_24px_70px_rgba(15,34,57,.22)]">
          <div className="border-b border-[#e5e0d7] bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.17em] text-[#9b753b]">Live design</p>
                <p className="mt-0.5 text-sm font-black text-[#14243a]">See every change on the card</p>
              </div>
              <span className="rounded-full bg-[#f4f7fa] px-2.5 py-1 text-[9px] font-black text-[#17365D]">{design.paper}</span>
            </div>
          </div>

          <div className="max-h-[68vh] overflow-auto p-4">
            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Layout</p>
              <div className="grid grid-cols-5 gap-2">
                {designs.map((item) => {
                  const selected = design.template === item.name;
                  const theme = item.themes[0];
                  return (
                    <button
                      key={item.name}
                      type="button"
                      title={item.description}
                      onClick={() => updateLive({ ...design, template: item.name, palette: item.themes[0].name })}
                      className={`rounded-xl border p-2 text-center transition ${selected ? "border-[#17365D] bg-[#f4f7fa] shadow-sm" : "border-[#e1ddd5] bg-white hover:border-slate-300"}`}
                    >
                      <span className="mx-auto block h-7 w-7 rounded-md border" style={{ borderColor: theme.ink, backgroundColor: theme.wash }} />
                      <span className={`mt-1.5 block truncate text-[9px] font-black ${selected ? "text-[#17365D]" : "text-slate-500"}`}>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#e1ddd5] bg-white p-3">
              <div className="mb-2 flex items-center gap-2"><Palette size={13} className="text-[#9b753b]" /><p className="text-[10px] font-black text-slate-700">Palette</p></div>
              <div className="flex flex-wrap gap-2">
                {activeTemplate.themes.map((theme) => (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => updateLive({ ...design, palette: theme.name })}
                    className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[9px] font-black transition ${design.palette === theme.name ? "border-[#17365D] bg-[#f4f7fa] text-[#17365D]" : "border-[#e1ddd5] bg-white text-slate-500"}`}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.ink }} />
                    {theme.name}
                    {design.palette === theme.name && <Check size={10} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#e1ddd5] bg-[#faf7f1] p-3">
              <p className="mb-2 text-[10px] font-black text-slate-700">Paper size</p>
              <div className="grid grid-cols-5 gap-1.5">
                {(["A4", "A5", "Letter", "Legal", "Custom"] as PaperName[]).map((paper) => (
                  <button
                    key={paper}
                    type="button"
                    onClick={() => updateLive({ ...design, paper })}
                    className={`rounded-lg border px-2 py-2 text-[9px] font-black transition ${design.paper === paper ? "border-[#17365D] bg-[#17365D] text-white" : "border-[#ded9d0] bg-white text-slate-500"}`}
                  >
                    {paper}
                  </button>
                ))}
              </div>

              {design.paper === "Custom" && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={design.customWidth || "210"}
                    onChange={(event) => updateLive({ ...design, customWidth: event.target.value })}
                    className="rounded-lg border border-[#ded9d0] bg-white px-2.5 py-2 text-xs outline-none focus:border-[#17365D]"
                    placeholder="Width mm"
                  />
                  <input
                    type="number"
                    value={design.customHeight || "297"}
                    onChange={(event) => updateLive({ ...design, customHeight: event.target.value })}
                    className="rounded-lg border border-[#ded9d0] bg-white px-2.5 py-2 text-xs outline-none focus:border-[#17365D]"
                    placeholder="Height mm"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-[#e1ddd5] bg-white px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-md border" style={{ borderColor: activeTheme.ink, backgroundColor: activeTheme.wash }} />
                <div>
                  <p className="text-[9px] font-black text-slate-700">{design.template} · {design.palette}</p>
                  <p className="text-[8px] text-slate-400">Saved automatically</p>
                </div>
              </div>
              <span className="text-[9px] font-black text-emerald-600">LIVE</span>
            </div>
          </div>
        </div>
      )}
    </div>,
    host,
  ) : null;

  return control;
}
