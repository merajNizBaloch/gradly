"use client";

import { ImagePlus, School, Upload, X } from "lucide-react";
import type { SchoolSettings } from "./workspace-model";

export default function SchoolSettingsModal({
  open,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  value: SchoolSettings;
  onChange: (next: SchoolSettings) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const readLogo = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ ...value, logo: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <div className="no-print fixed inset-0 z-[150] grid place-items-center bg-slate-950/55 p-3 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/40 bg-[#fffdfa] shadow-[0_36px_110px_rgba(13,32,54,.32)]">
        <div className="flex items-center justify-between border-b border-[#e5e0d7] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#a07b3f]">School profile</p>
            <h2 className="mt-1 font-serif text-xl font-bold text-[#14243a]">Branding & printed identity</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-[#ded9d0] bg-white text-slate-500" aria-label="Close school settings"><X size={16} /></button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[.9fr_1.1fr]">
          <div className="space-y-4 p-5 sm:p-6">
            {([
              ["School name", "name"],
              ["Motto", "motto"],
              ["Address", "address"],
              ["Contact", "contact"],
            ] as const).map(([label, key]) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[.15em] text-slate-400">{label}</span>
                <input
                  value={value[key]}
                  onChange={(event) => onChange({ ...value, [key]: event.target.value })}
                  className="w-full rounded-xl border border-[#ded9d0] bg-white px-3.5 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#17365D] focus:ring-4 focus:ring-[#17365D]/10"
                />
              </label>
            ))}

            <div className="rounded-2xl border border-[#ded9d0] bg-[#faf7f1] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">School logo</p>
                  <p className="mt-1 text-[10px] text-slate-400">Transparent PNG gives the cleanest print result.</p>
                </div>
                <ImagePlus size={18} className="text-slate-400" />
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#cec7ba] bg-white px-3 py-3 text-[11px] font-black text-slate-600 transition hover:border-[#17365D]/35">
                <Upload size={14} /> Upload school logo
                <input type="file" accept="image/*" className="hidden" onChange={(event) => readLogo(event.target.files?.[0])} />
              </label>
              {value.logo && <div className="mt-3 grid min-h-28 place-items-center rounded-xl border border-[#e1ddd5] bg-white p-4"><img src={value.logo} alt="School logo preview" className="max-h-24 max-w-full object-contain" /></div>}
            </div>
          </div>

          <div className="border-t border-[#e5e0d7] bg-[#f1f3f5] p-5 lg:border-l lg:border-t-0 sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Printed identity preview</p>
            <div className="mt-4 rounded-2xl bg-[#dde2e7] p-5 shadow-inner">
              <div className="mx-auto max-w-lg rounded-lg border-[5px] bg-white p-5 shadow-xl" style={{ borderColor: "#17365D" }}>
                <div className="flex items-center gap-4 border-b-2 pb-4" style={{ borderColor: "#17365D" }}>
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md border" style={{ borderColor: "#17365D" }}>
                    {value.logo ? <img src={value.logo} alt="School logo" className="h-full w-full object-contain p-1" /> : <School size={26} className="text-[#17365D]" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-2xl font-bold text-[#17365D]">{value.name || "School name"}</h3>
                    <p className="mt-1 text-xs italic text-slate-500">{value.motto}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{value.address}</p>
                    <p className="text-[10px] text-slate-400">{value.contact}</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">{["Student profile", "Examination", "Marks", "Result summary"].map((item) => <div key={item} className="rounded-lg bg-slate-50 p-4 text-xs font-bold text-slate-400">{item}</div>)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#e5e0d7] bg-white px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="rounded-xl bg-[#17365D] px-5 py-2.5 text-sm font-black text-white shadow-sm">Done</button>
        </div>
      </div>
    </div>
  );
}
