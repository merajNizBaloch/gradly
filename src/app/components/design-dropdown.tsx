"use client";

import { Check, ChevronDown, LayoutTemplate, Palette, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { templates, type DesignSettings, type PaperSize, type TemplateId, type Theme } from "./workspace-model";

function DesignThumb({ id, theme }: { id: TemplateId; theme: Theme }) {
  const common = { borderColor: theme.ink, backgroundColor: theme.wash };

  if (id === "certificate") {
    return (
      <span className="relative block h-20 overflow-hidden border bg-white p-1.5" style={{ borderColor: theme.ink }}>
        <span className="absolute inset-1 border" style={{ borderColor: theme.accent }} />
        <span className="relative mx-auto mt-1 block h-3 w-3 border bg-white" style={{ borderColor: theme.ink }} />
        <span className="relative mx-auto mt-1 block h-1.5 w-16" style={{ backgroundColor: theme.ink }} />
        <span className="relative mx-auto mt-1 block h-1 w-10" style={{ backgroundColor: theme.accent }} />
        <span className="relative mx-auto mt-3 block h-1.5 w-20" style={{ backgroundColor: theme.ink }} />
        <span className="relative mt-3 grid grid-cols-3 gap-1 px-2"><i className="h-4 border" style={common} /><i className="h-4 border" style={common} /><i className="h-4 border" style={common} /></span>
      </span>
    );
  }

  if (id === "modern") {
    return (
      <span className="grid h-20 grid-cols-[38%_1fr] overflow-hidden border bg-white" style={{ borderColor: theme.ink }}>
        <span className="p-2" style={{ backgroundColor: theme.ink }}><i className="block h-5 w-5 bg-white/90" /><i className="mt-2 block h-1.5 w-full bg-white/70" /><i className="mt-1 block h-1.5 w-2/3 bg-white/35" /><i className="mt-5 block h-4 w-full bg-white/20" /></span>
        <span className="p-2"><i className="block h-2 w-3/4" style={{ backgroundColor: theme.ink }} /><i className="mt-2 block h-5 w-full" style={{ backgroundColor: theme.wash }} /><i className="mt-2 block h-6 w-full border" style={{ borderColor: theme.ink }} /></span>
      </span>
    );
  }

  if (id === "executive") {
    return (
      <span className="grid h-20 grid-cols-[8px_1fr] overflow-hidden border bg-white" style={{ borderColor: theme.ink }}>
        <span style={{ backgroundColor: theme.ink }} />
        <span className="p-2"><span className="flex justify-between"><i className="block h-2 w-14" style={{ backgroundColor: theme.ink }} /><i className="block h-5 w-5 border" style={{ borderColor: theme.ink }} /></span><i className="mt-2 block h-5 w-full" style={{ backgroundColor: theme.wash }} /><span className="mt-2 grid grid-cols-3 gap-1"><i className="h-4 border" style={common} /><i className="h-4 border" style={common} /><i className="h-4 border" style={common} /></span></span>
      </span>
    );
  }

  if (id === "heritage") {
    return (
      <span className="block h-20 overflow-hidden border bg-white p-2" style={{ borderColor: theme.ink }}>
        <span className="mx-auto block h-4 w-4 rotate-45 border" style={{ borderColor: theme.accent }} />
        <i className="mx-auto mt-1 block h-1.5 w-20" style={{ backgroundColor: theme.ink }} />
        <i className="mx-auto mt-1 block h-px w-full" style={{ backgroundColor: theme.accent }} />
        <i className="mx-auto mt-2 block h-3 w-2/3" style={{ backgroundColor: theme.wash }} />
        <span className="mt-2 grid grid-cols-2 gap-1"><i className="h-5 border" style={common} /><i className="h-5 border" style={common} /></span>
      </span>
    );
  }

  if (id === "ledger") {
    return (
      <span className="block h-20 overflow-hidden border bg-white p-1.5" style={{ borderColor: theme.ink }}>
        <span className="grid grid-cols-3"><i className="h-4 border" style={common} /><i className="h-4 border" style={common} /><i className="h-4 border" style={common} /></span>
        <span className="mt-1 block border" style={{ borderColor: theme.ink }}><i className="grid h-5 grid-cols-4"><b className="border-r" style={{ borderColor: theme.ink }} /><b className="border-r" style={{ borderColor: theme.ink }} /><b className="border-r" style={{ borderColor: theme.ink }} /><b /></i><i className="grid h-5 grid-cols-4 border-t" style={{ borderColor: theme.ink }}><b className="border-r" style={{ borderColor: theme.ink }} /><b className="border-r" style={{ borderColor: theme.ink }} /><b className="border-r" style={{ borderColor: theme.ink }} /><b /></i></span>
      </span>
    );
  }

  if (id === "scholar") {
    return (
      <span className="relative block h-20 overflow-hidden border bg-white p-2" style={{ borderColor: theme.ink }}>
        <span className="absolute -right-4 -top-5 h-12 w-12 rotate-45" style={{ backgroundColor: theme.ink }} />
        <span className="flex items-start justify-between"><i className="block h-5 w-5 border" style={{ borderColor: theme.ink }} /><i className="grid h-8 w-8 place-items-center border-2 text-[8px] font-black" style={{ borderColor: theme.accent, color: theme.ink }}>A</i></span>
        <i className="mt-2 block h-2 w-16" style={{ backgroundColor: theme.ink }} />
        <i className="mt-2 block h-5 w-full" style={{ backgroundColor: theme.wash }} />
      </span>
    );
  }

  if (id === "minimal") {
    return (
      <span className="block h-20 overflow-hidden border bg-white p-2" style={{ borderColor: theme.ink }}>
        <i className="block h-2 w-14" style={{ backgroundColor: theme.ink }} /><i className="mt-2 block h-px w-full" style={{ backgroundColor: theme.ink }} /><span className="mt-2 grid grid-cols-2 gap-3"><i className="h-5 border-b" style={{ borderColor: theme.ink }} /><i className="h-5 border-b" style={{ borderColor: theme.ink }} /></span><i className="mt-3 block h-px w-full" style={{ backgroundColor: theme.ink }} />
      </span>
    );
  }

  return (
    <span className="block h-20 overflow-hidden border bg-white p-2" style={{ borderColor: theme.ink }}>
      <span className="flex items-center gap-2"><i className="block h-6 w-6 border" style={{ borderColor: theme.ink }} /><span className="flex-1"><i className="block h-2 w-3/4" style={{ backgroundColor: theme.ink }} /><i className="mt-1 block h-1 w-1/2" style={{ backgroundColor: theme.accent }} /></span></span><i className="mt-2 block h-px w-full" style={{ backgroundColor: theme.ink }} /><span className="mt-2 grid grid-cols-2 gap-1"><i className="h-4 border" style={common} /><i className="h-4 border" style={common} /></span><i className="mt-2 block h-4 w-full" style={{ backgroundColor: theme.wash }} />
    </span>
  );
}

export default function DesignDropdown({ value, onChange }: { value: DesignSettings; onChange: (next: DesignSettings) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeTemplate = useMemo(() => templates.find((item) => item.id === value.template) || templates[0], [value.template]);
  const activeTheme = activeTemplate.themes.find((item) => item.id === value.theme) || activeTemplate.themes[0];

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="no-print relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex items-center gap-2 border border-[#d8dde4] bg-white px-3 py-2 shadow-sm transition hover:border-[#0F4AA8]/30 hover:shadow-md">
        <span className="grid h-8 w-8 place-items-center bg-[#0F4AA8] text-white"><LayoutTemplate size={15} /></span>
        <span className="hidden text-left sm:block"><span className="block text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Design</span><span className="mt-0.5 block text-[11px] font-black text-slate-700">{activeTemplate.name} · {activeTheme.name}</span></span>
        <ChevronDown size={13} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[120] w-[min(94vw,560px)] overflow-hidden border border-[#D8E3F0] bg-white shadow-[0_24px_70px_rgba(15,52,95,.22)]">
          <div className="flex items-start justify-between border-b border-[#E4ECF5] bg-white px-4 py-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.17em] text-[#11B8B2]">Result card design</p>
              <p className="mt-0.5 text-sm font-black text-[#0B3477]">Choose a complete composition</p>
              <p className="mt-1 text-[10px] text-slate-400">Composition, decorative elements, hierarchy and layout update live.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center border border-[#D8E3F0] bg-white text-slate-500 transition hover:border-[#0F4AA8] hover:text-[#0F4AA8]" aria-label="Close design settings"><X size={14} /></button>
          </div>

          <div className="max-h-[68vh] overflow-auto p-4">
            <p className="mb-2 text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Design composition</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {templates.map((item) => {
                const selected = item.id === value.template;
                const theme = item.themes[0];
                return (
                  <button key={item.id} type="button" title={item.description} onClick={() => onChange({ ...value, template: item.id, theme: item.themes[0].id })} className={`border p-2 text-left transition ${selected ? "border-[#0F4AA8] bg-[#F2FAFF] shadow-sm" : "border-[#D8E3F0] bg-white hover:border-[#8ABDE8]"}`}>
                    <DesignThumb id={item.id} theme={theme} />
                    <span className={`mt-2 block text-[10px] font-black ${selected ? "text-[#0F4AA8]" : "text-slate-700"}`}>{item.name}</span>
                    <span className="mt-0.5 block line-clamp-2 text-[8px] leading-3 text-slate-400">{item.description}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 border border-[#D8E3F0] bg-white p-3">
              <div className="mb-2 flex items-center gap-2"><Palette size={13} className="text-[#11B8B2]" /><p className="text-[10px] font-black text-slate-700">Palette</p></div>
              <div className="flex flex-wrap gap-2">
                {activeTemplate.themes.map((theme) => (
                  <button key={theme.id} type="button" onClick={() => onChange({ ...value, theme: theme.id })} className={`flex items-center gap-2 border px-2.5 py-1.5 text-[9px] font-black transition ${value.theme === theme.id ? "border-[#0F4AA8] bg-[#F2FAFF] text-[#0F4AA8]" : "border-[#D8E3F0] bg-white text-slate-500"}`}>
                    <span className="h-3 w-3" style={{ backgroundColor: theme.ink }} />{theme.name}{value.theme === theme.id && <Check size={10} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 border border-[#D8E3F0] bg-[#F7FAFD] p-3">
              <p className="mb-2 text-[10px] font-black text-slate-700">Paper size</p>
              <div className="grid grid-cols-5 gap-1.5">
                {(["a4", "a5", "letter", "legal", "custom"] as PaperSize[]).map((paper) => (
                  <button key={paper} type="button" onClick={() => onChange({ ...value, paperSize: paper })} className={`border px-2 py-2 text-[9px] font-black transition ${value.paperSize === paper ? "border-[#0F4AA8] bg-[#0F4AA8] text-white" : "border-[#D8E3F0] bg-white text-slate-500"}`}>{paper === "a4" ? "A4" : paper === "a5" ? "A5" : paper[0].toUpperCase() + paper.slice(1)}</button>
                ))}
              </div>
              {value.paperSize === "custom" && <div className="mt-2 grid grid-cols-2 gap-2"><input type="number" value={value.customWidth} onChange={(event) => onChange({ ...value, customWidth: event.target.value })} className="border border-[#D8E3F0] bg-white px-2.5 py-2 text-xs outline-none focus:border-[#0F4AA8]" placeholder="Width mm" /><input type="number" value={value.customHeight} onChange={(event) => onChange({ ...value, customHeight: event.target.value })} className="border border-[#D8E3F0] bg-white px-2.5 py-2 text-xs outline-none focus:border-[#0F4AA8]" placeholder="Height mm" /></div>}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E4ECF5] bg-[#F8FBFE] px-4 py-3">
            <div className="flex items-center gap-2"><span className="h-5 w-5 border" style={{ borderColor: activeTheme.ink, backgroundColor: activeTheme.wash }} /><div><p className="text-[9px] font-black text-slate-700">{activeTemplate.name} · {activeTheme.name}</p><p className="text-[8px] text-slate-400">Saved automatically</p></div></div>
            <button type="button" onClick={() => setOpen(false)} className="bg-[#0F4AA8] px-4 py-2 text-[10px] font-black text-white transition hover:bg-[#0B3477]">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
