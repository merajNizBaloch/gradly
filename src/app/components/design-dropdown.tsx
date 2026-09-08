"use client";

import { Check, ChevronDown, LayoutTemplate, Palette } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { templates, type DesignSettings, type PaperSize } from "./workspace-model";

export default function DesignDropdown({ value, onChange }: { value: DesignSettings; onChange: (next: DesignSettings) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeTemplate = useMemo(() => templates.find((item) => item.id === value.template) || templates[0], [value.template]);
  const activeTheme = activeTemplate.themes.find((item) => item.id === value.theme) || activeTemplate.themes[0];

  return (
    <div ref={rootRef} className="no-print relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex items-center gap-2 rounded-xl border border-[#d8dde4] bg-white px-3 py-2 shadow-sm transition hover:border-[#17365D]/30 hover:shadow-md">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#17365D] text-white"><LayoutTemplate size={15} /></span>
        <span className="hidden text-left sm:block"><span className="block text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Design</span><span className="mt-0.5 block text-[11px] font-black text-slate-700">{activeTemplate.name} · {activeTheme.name}</span></span>
        <ChevronDown size={13} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[120] w-[min(92vw,430px)] overflow-hidden rounded-2xl border border-[#ded9d0] bg-[#fffdfa] shadow-[0_24px_70px_rgba(15,34,57,.22)]">
          <div className="border-b border-[#e5e0d7] bg-white px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-[.17em] text-[#9b753b]">Live design</p>
            <p className="mt-0.5 text-sm font-black text-[#14243a]">Updates the result card instantly</p>
          </div>
          <div className="max-h-[68vh] overflow-auto p-4">
            <p className="mb-2 text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Layout</p>
            <div className="grid grid-cols-5 gap-2">
              {templates.map((item) => {
                const selected = item.id === value.template;
                const theme = item.themes[0];
                return (
                  <button key={item.id} type="button" title={item.description} onClick={() => onChange({ ...value, template: item.id, theme: item.themes[0].id })} className={`rounded-xl border p-2 text-center transition ${selected ? "border-[#17365D] bg-[#f4f7fa] shadow-sm" : "border-[#e1ddd5] bg-white hover:border-slate-300"}`}>
                    <span className="mx-auto block h-7 w-7 rounded-md border" style={{ borderColor: theme.ink, backgroundColor: theme.wash }} />
                    <span className={`mt-1.5 block truncate text-[9px] font-black ${selected ? "text-[#17365D]" : "text-slate-500"}`}>{item.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-[#e1ddd5] bg-white p-3">
              <div className="mb-2 flex items-center gap-2"><Palette size={13} className="text-[#9b753b]" /><p className="text-[10px] font-black text-slate-700">Palette</p></div>
              <div className="flex flex-wrap gap-2">
                {activeTemplate.themes.map((theme) => (
                  <button key={theme.id} type="button" onClick={() => onChange({ ...value, theme: theme.id })} className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[9px] font-black transition ${value.theme === theme.id ? "border-[#17365D] bg-[#f4f7fa] text-[#17365D]" : "border-[#e1ddd5] bg-white text-slate-500"}`}>
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.ink }} />{theme.name}{value.theme === theme.id && <Check size={10} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#e1ddd5] bg-[#faf7f1] p-3">
              <p className="mb-2 text-[10px] font-black text-slate-700">Paper size</p>
              <div className="grid grid-cols-5 gap-1.5">
                {(["a4", "a5", "letter", "legal", "custom"] as PaperSize[]).map((paper) => (
                  <button key={paper} type="button" onClick={() => onChange({ ...value, paperSize: paper })} className={`rounded-lg border px-2 py-2 text-[9px] font-black transition ${value.paperSize === paper ? "border-[#17365D] bg-[#17365D] text-white" : "border-[#ded9d0] bg-white text-slate-500"}`}>{paper === "a4" ? "A4" : paper === "a5" ? "A5" : paper[0].toUpperCase() + paper.slice(1)}</button>
                ))}
              </div>
              {value.paperSize === "custom" && <div className="mt-2 grid grid-cols-2 gap-2"><input type="number" value={value.customWidth} onChange={(event) => onChange({ ...value, customWidth: event.target.value })} className="rounded-lg border border-[#ded9d0] bg-white px-2.5 py-2 text-xs outline-none focus:border-[#17365D]" placeholder="Width mm" /><input type="number" value={value.customHeight} onChange={(event) => onChange({ ...value, customHeight: event.target.value })} className="rounded-lg border border-[#ded9d0] bg-white px-2.5 py-2 text-xs outline-none focus:border-[#17365D]" placeholder="Height mm" /></div>}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-[#e1ddd5] bg-white px-3 py-2.5">
              <div className="flex items-center gap-2"><span className="h-5 w-5 rounded-md border" style={{ borderColor: activeTheme.ink, backgroundColor: activeTheme.wash }} /><div><p className="text-[9px] font-black text-slate-700">{activeTemplate.name} · {activeTheme.name}</p><p className="text-[8px] text-slate-400">Saved automatically</p></div></div>
              <span className="text-[9px] font-black text-emerald-600">LIVE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
