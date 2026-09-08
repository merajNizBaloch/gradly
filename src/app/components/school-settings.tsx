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
    <div className="no-print fixed inset-0 z-[150] grid place-items-end bg-slate-950/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-3" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none border border-white/40 bg-[#fffdfa] shadow-[0_36px_110px_rgba(13,32,54,.32)] sm:max-h-[92vh] sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-[#e5e0d7] bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0 pr-3">
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#a07b3f]">School profile</p>
            <h2 className="mt-1 truncate font-serif text-lg font-bold text-[#14243a] sm:text-xl">Branding & printed identity</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#ded9d0] bg-white text-slate-500 sm:h-9 sm:w-9" aria-label="Close school settings"><X size={16} /></button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[.9fr_1.1fr]">
          <div className="space-y-4 p-4 sm:p-6">
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
                  className="min-h-11 w-full rounded-xl border border-[#ded9d0] bg-white px-3.5 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#17365D] focus:ring-4 focus:ring-[#17365D]/10"
                />
              </label>
            ))}

            <div className="rounded-2xl border border-[#ded9d0] bg-[#faf7f1] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">School logo</p>
                  <p className="mt-1 text-[10px] text-slate-400">Transparent PNG gives the cleanest print result.</p>
                </div>
                <ImagePlus size={18} className="shrink-0 text-slate-400" />
              </div>
              <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#cec7ba] bg-white px-3 py-3 text-center text-[11px] font-black text-slate-600 transition hover:border-[#17365D]/35">
                <Upload size={14} /> Upload school logo
                <input type="file" accept="image/*" className="hidden" onChange={(event) => readLogo(event.target.files?.[0])} />
              </label>
              {value.logo && <div className="mt-3 grid min-h-28 place-items-center rounded-xl border border-[#e1ddd5] bg-white p-4"><img src={value.logo} alt="School logo preview" className="max-h-24 max-w-full object-contain" /></div>}
            </div>
          </div>

          <div className="border-t border-[#e5e0d7] bg-[#f1f3f5] p-4 sm:p-6 lg:border-l lg:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Printed identity preview</p>
            <div className="mt-3 rounded-2xl bg-[#dde2e7] p-3 shadow-inner sm:mt-4 sm:p-5">
              <div className="mx-auto max-w-lg rounded-lg border-[5px] bg-white p-4 shadow-xl sm:p-5" style={{ borderColor: "#17365D" }}>
                <div className="flex items-center gap-3 border-b-2 pb-4 sm:gap-4" style={{ borderColor: "#17365D" }}>
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md border sm:h-16 sm:w-16" style={{ borderColor: "#17365D" }}>
                    {value.logo ? <img src={value.logo} alt="School logo" className="h-full w-full object-contain p-1" /> : <School size={26} className="text-[#17365D]" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-lg font-bold text-[#17365D] sm:text-2xl">{value.name || "School name"}</h3>
                    <p className="mt-1 text-xs italic text-slate-500">{value.motto}</p>
                    <p className="mt-1 break-words text-[10px] text-slate-400">{value.address}</p>
                    <p className="break-words text-[10px] text-slate-400">{value.contact}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3">{["Student profile", "Examination", "Marks", "Result summary"].map((item) => <div key={item} className="rounded-lg bg-slate-50 p-3 text-xs font-bold text-slate-400 sm:p-4">{item}</div>)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#e5e0d7] bg-white px-4 py-3 sm:px-6 sm:py-4">
          <button type="button" onClick={onClose} className="min-h-11 w-full rounded-xl bg-[#17365D] px-5 py-2.5 text-sm font-black text-white shadow-sm sm:w-auto">Done</button>
        </div>
      </div>
    </div>
  );
}
