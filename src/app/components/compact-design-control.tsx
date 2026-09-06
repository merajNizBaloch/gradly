"use client";

import { ChevronDown, ChevronUp, LayoutTemplate, Check } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

type Theme = { name: string; ink: string };
type DesignTemplate = { name: string; themes: Theme[] };

const designs: DesignTemplate[] = [
  { name: "Academic", themes: [{ name: "Navy", ink: "#17365D" }, { name: "Emerald", ink: "#155E4A" }, { name: "Burgundy", ink: "#6B2435" }, { name: "Plum", ink: "#4B315F" }] },
  { name: "Modern", themes: [{ name: "Ocean", ink: "#155E75" }, { name: "Forest", ink: "#1F5A43" }, { name: "Coral", ink: "#9A3F3F" }, { name: "Indigo", ink: "#4338A8" }] },
  { name: "Certificate", themes: [{ name: "Antique Gold", ink: "#5B3A20" }, { name: "Jade", ink: "#14532D" }, { name: "Crimson", ink: "#641E2B" }, { name: "Royal Blue", ink: "#253B73" }] },
  { name: "Executive", themes: [{ name: "Charcoal", ink: "#252525" }, { name: "Midnight", ink: "#172554" }, { name: "Wine", ink: "#5C1F35" }, { name: "Plum", ink: "#31233D" }] },
  { name: "Minimal", themes: [{ name: "Slate", ink: "#334155" }, { name: "Teal", ink: "#115E59" }, { name: "Olive", ink: "#465A32" }, { name: "Rose", ink: "#7A3E4B" }] },
];

function findLibrary() {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(".no-print"));
  return candidates.find((node) => node.textContent?.includes("Design library") && node.textContent?.includes("Choose a result card style")) ?? null;
}

function clickHiddenDesign(index: number) {
  const library = findLibrary();
  const buttons = library ? Array.from(library.querySelectorAll<HTMLButtonElement>("button")) : [];
  buttons[index]?.click();
}

function chooseTheme(templateIndex: number, themeIndex: number) {
  clickHiddenDesign(templateIndex);
  window.setTimeout(() => {
    const library = findLibrary();
    const buttons = library ? Array.from(library.querySelectorAll<HTMLButtonElement>("button")) : [];
    buttons[5 + themeIndex]?.click();
  }, 40);
}

export default function CompactDesignControl() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(0);

  useEffect(() => {
    const sync = () => {
      const library = findLibrary();
      if (!library) return;
      library.style.display = "none";
      library.setAttribute("data-gradly-hidden-design-library", "true");
      const shell = document.querySelector<HTMLElement>(".print-shell");
      if (!shell?.parentElement) return;
      let mount = document.querySelector<HTMLElement>("[data-gradly-compact-design]");
      if (!mount) {
        mount = document.createElement("div");
        mount.dataset.gradlyCompactDesign = "true";
        shell.parentElement.insertBefore(mount, shell);
      }
      setHost(mount);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const current = useMemo(() => designs[selectedTemplate], [selectedTemplate]);
  if (!host) return null;

  return createPortal(
    <div className="no-print mb-3">
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
        <button onClick={() => setOpen((value) => !value)} className="flex min-w-0 items-center gap-2 text-left">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gray-50" style={{ color: current.themes[selectedTheme].ink }}><LayoutTemplate size={15} /></span>
          <span className="truncate text-xs font-bold text-gray-800">Design</span>
          <span className="hidden truncate text-[11px] font-medium text-gray-400 sm:inline">{current.name} · {current.themes[selectedTheme].name}</span>
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: current.themes[selectedTheme].ink }} />
          <button onClick={() => setOpen((value) => !value)} className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 hover:bg-gray-100">{open ? "Close" : "Customize"}</button>
        </div>
      </div>
      {open && <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {designs.map((design, index) => <button key={design.name} onClick={() => { setSelectedTemplate(index); setSelectedTheme(0); chooseTheme(index, 0); }} className={`rounded-lg border p-2 text-left transition hover:-translate-y-0.5 ${selectedTemplate === index ? "border-gray-900 bg-gray-50 shadow-sm" : "border-gray-200 bg-white"}`}>
            <div className="mb-2 h-12 rounded-md border bg-gray-50 p-1.5" style={{ borderColor: design.themes[0].ink }}><div className="h-1.5 w-12 rounded" style={{ backgroundColor: design.themes[0].ink }} /><div className="mt-1.5 grid grid-cols-3 gap-1">{design.themes.slice(0, 3).map((theme) => <span key={theme.name} className="h-1.5 rounded" style={{ backgroundColor: theme.ink }} />)}</div></div>
            <div className="flex items-center justify-between"><span className="text-[10px] font-bold">{design.name}</span>{selectedTemplate === index && <Check size={12} />}</div>
          </button>)}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          <span className="mr-1 text-[9px] font-bold uppercase tracking-[.16em] text-gray-400">Palette</span>
          {current.themes.map((theme, index) => <button key={theme.name} onClick={() => { setSelectedTheme(index); chooseTheme(selectedTemplate, index); }} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold ${selectedTheme === index ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white text-gray-600"}`}><span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.ink }} />{theme.name}</button>)}
        </div>
      </div>}
    </div>,
    host,
  );
}
