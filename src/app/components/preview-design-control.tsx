"use client";

import { Check, ChevronDown, LayoutTemplate, Palette, Sparkles, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

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

function workflowButton(label: string) {
  const nav = document.querySelector<HTMLElement>("aside.no-print nav");
  return nav ? Array.from(nav.querySelectorAll<HTMLButtonElement>("button")).find((button) => (button.textContent || "").includes(label)) ?? null : null;
}

function visibleStepLabel() {
  const title = document.querySelector<HTMLElement>("section.no-print h1")?.textContent?.trim();
  return title === "Marks" || title === "Finalize" ? title : "Student";
}

function designPanel() {
  const editor = document.querySelector<HTMLElement>("section.no-print.gradly-workspace-scroll");
  if (!editor) return null;
  return Array.from(editor.querySelectorAll<HTMLElement>(":scope > div:nth-child(2) > div")).find((node) => node.textContent?.includes("Result card design")) ?? null;
}

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function applyDesign(state: DesignState, returnTo?: string) {
  const backTo = returnTo || visibleStepLabel();
  workflowButton("Design")?.click();

  window.setTimeout(() => {
    let panel = designPanel();
    if (!panel) return;
    const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>("button"));
    buttons.find((button) => button.textContent?.includes(state.template))?.click();

    window.setTimeout(() => {
      panel = designPanel();
      if (!panel) return;
      const refreshed = Array.from(panel.querySelectorAll<HTMLButtonElement>("button"));
      refreshed.find((button) => (button.textContent || "").trim() === state.palette)?.click();
      refreshed.find((button) => (button.textContent || "").trim() === state.paper)?.click();
      if (state.paper === "Custom") {
        window.setTimeout(() => {
          const custom = designPanel();
          const inputs = custom ? Array.from(custom.querySelectorAll<HTMLInputElement>('input[type="number"]')) : [];
          if (inputs[0] && state.customWidth) setNativeValue(inputs[0], state.customWidth);
          if (inputs[1] && state.customHeight) setNativeValue(inputs[1], state.customHeight);
        }, 40);
      }
      window.setTimeout(() => workflowButton(backTo)?.click(), state.paper === "Custom" ? 110 : 50);
    }, 50);
  }, 40);
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

  useEffect(() => {
    const saved = loadDesign();
    setDesign(saved);
    const currentStep = visibleStepLabel();
    const timer = window.setTimeout(() => {
      const preview = findPreviewHeader();
      if (preview) {
        let mount = preview.querySelector<HTMLElement>("[data-gradly-preview-design]");
        if (!mount) {
          mount = document.createElement("div");
          mount.dataset.gradlyPreviewDesign = "true";
          mount.className = "ml-auto flex items-center";
          preview.appendChild(mount);
        }
        setHost(mount);
      }

      document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        if ((button.textContent || "").trim() === "Design" && !button.closest("[data-gradly-preview-design]")) {
          button.style.display = "none";
        }
      });
      applyDesign(saved, currentStep);
    }, 220);

    return () => {
      window.clearTimeout(timer);
      document.querySelector("[data-gradly-preview-design]")?.remove();
    };
  }, []);

  const activeTemplate = useMemo(() => designs.find((item) => item.name === design.template) || designs[0], [design.template]);
  const activeTheme = activeTemplate.themes.find((theme) => theme.name === design.palette) || activeTemplate.themes[0];

  const save = () => {
    try { localStorage.setItem(DESIGN_KEY, JSON.stringify(design)); } catch {}
    const backTo = visibleStepLabel();
    setOpen(false);
    applyDesign(design, backTo);
  };

  const button = host ? createPortal(
    <button
      type="button"
      onClick={() => { setDesign(loadDesign()); setOpen(true); }}
      className="group flex items-center gap-2.5 rounded-xl border border-[#d8dde4] bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-[#17365D]/25 hover:shadow-md"
      title="Change result card design"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#17365D] text-white shadow-sm"><LayoutTemplate size={15} /></span>
      <span className="hidden text-left sm:block">
        <span className="block text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Design</span>
        <span className="mt-0.5 block text-[11px] font-black text-slate-700">{design.template} · {design.palette}</span>
      </span>
      <ChevronDown size={13} className="text-slate-400" />
    </button>,
    host,
  ) : null;

  return (
    <>
      {button}
      {open && (
        <div className="no-print fixed inset-0 z-[170] flex items-center justify-center bg-[#0d2036]/60 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/50 bg-[#fffdfa] shadow-[0_40px_120px_rgba(10,29,50,.34)]">
            <div className="flex items-center justify-between border-b border-[#e4dfd6] bg-white px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#17365D] text-white"><Sparkles size={17} /></span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#a07b3f]">Result appearance</p>
                  <h2 className="mt-0.5 font-serif text-xl font-bold text-[#14243a]">Choose your academic style</h2>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-[#e1ddd5] bg-white text-slate-500 transition hover:bg-slate-50" aria-label="Close design panel"><X size={16} /></button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[1.2fr_.8fr]">
              <div className="overflow-auto p-5 sm:p-6">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Layout collection</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">Five distinct report-card structures</p>
                  </div>
                  <span className="rounded-full border border-[#ded8cc] bg-[#f8f4ec] px-2.5 py-1 text-[9px] font-black text-[#8c6a35]">5 layouts · 20 palettes</span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {designs.map((item) => {
                    const selected = design.template === item.name;
                    const theme = item.themes[0];
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setDesign((current) => ({ ...current, template: item.name, palette: item.themes[0].name }))}
                        className={`group overflow-hidden rounded-2xl border text-left transition ${selected ? "border-[#17365D] bg-white shadow-[0_12px_28px_rgba(23,54,93,.12)] ring-1 ring-[#17365D]/10" : "border-[#e2ddd5] bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"}`}
                      >
                        <div className="h-28 p-2.5" style={{ backgroundColor: theme.wash }}>
                          <div className="h-full overflow-hidden rounded-lg border bg-white p-2 shadow-sm" style={{ borderColor: theme.ink }}>
                            <div className="flex items-center gap-2 border-b-2 pb-2" style={{ borderColor: theme.ink }}>
                              <span className="h-5 w-5 rounded-full" style={{ backgroundColor: theme.accent }} />
                              <div className="flex-1"><div className="h-1.5 w-16 rounded" style={{ backgroundColor: theme.ink }} /><div className="mt-1 h-1 w-10 rounded bg-slate-200" /></div>
                            </div>
                            <div className="mt-2 space-y-1.5">{[1,2,3,4].map((row) => <div key={row} className="flex gap-1"><span className="h-1 flex-1 rounded bg-slate-200" /><span className="h-1 w-6 rounded" style={{ backgroundColor: theme.wash }} /></div>)}</div>
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-2 p-3">
                          <div><p className="text-xs font-black text-slate-700">{item.name}</p><p className="mt-1 text-[9px] leading-4 text-slate-400">{item.description}</p></div>
                          {selected && <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#17365D] text-white"><Check size={12} /></span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-2xl border border-[#ded9d0] bg-white p-4">
                  <div className="mb-3 flex items-center gap-2"><Palette size={14} className="text-[#a07b3f]" /><p className="text-xs font-black text-slate-700">Color system</p></div>
                  <div className="flex flex-wrap gap-2">
                    {activeTemplate.themes.map((theme) => (
                      <button key={theme.name} type="button" onClick={() => setDesign((current) => ({ ...current, palette: theme.name }))} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black transition ${design.palette === theme.name ? "border-[#17365D] bg-[#f4f7fa] text-[#17365D]" : "border-[#e1ddd5] bg-white text-slate-500 hover:border-slate-300"}`}>
                        <span className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ backgroundColor: theme.ink }} />{theme.name}{design.palette === theme.name && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[#ded9d0] bg-[#faf7f1] p-4">
                  <p className="mb-3 text-xs font-black text-slate-700">Paper format</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{(["A4","A5","Letter","Legal","Custom"] as PaperName[]).map((paper) => <button key={paper} type="button" onClick={() => setDesign((current) => ({ ...current, paper }))} className={`rounded-xl border px-3 py-2.5 text-xs font-black transition ${design.paper === paper ? "border-[#17365D] bg-[#17365D] text-white" : "border-[#ded9d0] bg-white text-slate-500 hover:border-slate-300"}`}>{paper}</button>)}</div>
                  {design.paper === "Custom" && <div className="mt-3 grid grid-cols-2 gap-3"><input type="number" value={design.customWidth || "210"} onChange={(e) => setDesign((current) => ({ ...current, customWidth: e.target.value }))} className="rounded-xl border border-[#ded9d0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#17365D]" placeholder="Width mm" /><input type="number" value={design.customHeight || "297"} onChange={(e) => setDesign((current) => ({ ...current, customHeight: e.target.value }))} className="rounded-xl border border-[#ded9d0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#17365D]" placeholder="Height mm" /></div>}
                </div>
              </div>

              <div className="border-t border-[#e3ded5] bg-[#f2f4f6] p-5 lg:border-l lg:border-t-0 sm:p-6">
                <div className="sticky top-0">
                  <div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Style preview</p><p className="mt-1 text-sm font-black text-slate-700">{design.template} · {design.palette}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-[#17365D] shadow-sm">{design.paper}</span></div>
                  <div className="rounded-[22px] bg-[#dfe4e9] p-5 shadow-inner">
                    <div className="mx-auto overflow-hidden rounded-md border-[5px] bg-white p-5 shadow-[0_18px_45px_rgba(20,36,58,.18)]" style={{ borderColor: activeTheme.ink }}>
                      <div className="flex items-center gap-3 border-b-2 pb-3" style={{ borderColor: activeTheme.ink }}><span className="h-11 w-11 rounded-full" style={{ backgroundColor: activeTheme.wash, border: `1px solid ${activeTheme.accent}` }} /><div className="flex-1"><div className="h-2 w-28 rounded" style={{ backgroundColor: activeTheme.ink }} /><div className="mt-2 h-1.5 w-20 rounded bg-slate-200" /></div></div>
                      <div className="mt-5 grid grid-cols-2 gap-2"><div className="h-7 rounded" style={{ backgroundColor: activeTheme.wash }} /><div className="h-7 rounded" style={{ backgroundColor: activeTheme.wash }} /></div>
                      <div className="mt-4 space-y-2">{[1,2,3,4,5].map((row) => <div key={row} className="flex gap-2"><span className="h-2 flex-1 rounded bg-slate-200" /><span className="h-2 w-10 rounded" style={{ backgroundColor: activeTheme.wash }} /></div>)}</div>
                      <div className="mt-5 grid grid-cols-3 gap-1 border-y py-3" style={{ borderColor: activeTheme.ink }}><span className="h-7 rounded" style={{ backgroundColor: activeTheme.wash }} /><span className="h-7 rounded" style={{ backgroundColor: activeTheme.wash }} /><span className="h-7 rounded" style={{ backgroundColor: activeTheme.wash }} /></div>
                    </div>
                  </div>
                  <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">Preview shows the visual system. Your actual result card updates when you apply.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#e3ded5] bg-white px-5 py-4 sm:px-6">
              <p className="hidden text-[10px] text-slate-400 sm:block">Design is saved for future result cards.</p>
              <div className="ml-auto flex gap-2"><button onClick={() => setOpen(false)} className="rounded-xl border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-slate-500">Cancel</button><button onClick={save} className="rounded-xl bg-[#17365D] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#102d50]">Apply design</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
