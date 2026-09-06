"use client";

import { BarChart3, FileText, PenLine, School, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TabId = "marks" | "remarks" | "design";

const tabs: { id: TabId; label: string; icon: typeof School }[] = [
  { id: "marks", label: "Marks", icon: BarChart3 },
  { id: "remarks", label: "Remarks & Signatures", icon: PenLine },
  { id: "design", label: "Design", icon: FileText },
];

const panelGroups: Record<TabId, string[]> = {
  marks: ["Subjects & marks"],
  remarks: ["Signatures"],
  design: ["Templates & Design"],
};

const SCHOOL_STORAGE_KEY = "gradly-school-profile";

export default function SidebarTabs() {
  const [active, setActive] = useState<TabId>("marks");
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [schoolSaved, setSchoolSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SCHOOL_STORAGE_KEY);
      setSchoolSaved(Boolean(stored));
    } catch {}

    const sidebar = document.querySelector<HTMLElement>("section.no-print.space-y-4");
    if (!sidebar) return;

    const slot = document.createElement("div");
    slot.setAttribute("data-gradly-sidebar-tabs-slot", "true");
    sidebar.insertBefore(slot, sidebar.firstElementChild);
    setMount(slot);

    return () => slot.remove();
  }, []);

  useEffect(() => {
    if (!mount) return;
    const sidebar = mount.parentElement;
    if (!sidebar) return;

    const panels = Array.from(sidebar.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node !== mount && !node.hasAttribute("data-gradly-sidebar-tabs-slot")
    );

    panels.forEach((panel) => {
      const title = panel.querySelector(".mb-4")?.textContent?.trim() ?? "";
      const visible = panelGroups[active].some((name) => title.includes(name));
      panel.style.display = visible ? "" : "none";
    });

    return () => panels.forEach((panel) => (panel.style.display = ""));
  }, [active, mount]);

  useEffect(() => {
    if (!schoolOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSchoolOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [schoolOpen]);

  useEffect(() => {
    if (!schoolOpen) return;
    const input = document.querySelector<HTMLInputElement>("input[aria-label='School name']");
    if (input) {
      setSchoolName(input.value);
      input.focus();
    }
  }, [schoolOpen]);

  const openSchool = () => {
    const input = document.querySelector<HTMLInputElement>("input[aria-label='School name']");
    setSchoolName(input?.value ?? "");
    setSchoolOpen(true);
  };

  const saveSchool = () => {
    const input = document.querySelector<HTMLInputElement>("input[aria-label='School name']");
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, schoolName);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.blur();
    }
    try {
      localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify({ name: schoolName }));
    } catch {}
    setSchoolSaved(true);
    setSchoolOpen(false);
  };

  if (!mount) return null;

  return createPortal(
    <>
      <div data-gradly-sidebar-tabs className="relative z-20 overflow-hidden rounded-2xl border border-[#d7d9dd] bg-[#111827] p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-2 px-2 pb-1.5 pt-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/55">Result workspace</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          <button type="button" onClick={openSchool} title="School Details" aria-label="School Details" className="group relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl bg-white px-1.5 py-2 text-[#17365D] shadow-md transition hover:-translate-y-0.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#edf2f8]"><School size={15} strokeWidth={2.2}/></span>
            <span className="text-[9px] font-extrabold leading-none">School</span>
            {schoolSaved && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </button>
          {tabs.map(({ id, label, icon: Icon }) => {
            const selected = active === id;
            return <button key={id} type="button" onClick={() => setActive(id)} title={label} aria-label={label} aria-pressed={selected} className={`group relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 transition-all duration-200 ${selected ? "bg-white text-[#17365D] shadow-md" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
              <span className={`grid h-7 w-7 place-items-center rounded-lg ${selected ? "bg-[#edf2f8]" : "bg-white/5 group-hover:bg-white/10"}`}><Icon size={15} strokeWidth={2.2}/></span>
              <span className="text-[9px] font-extrabold leading-none">{id === "remarks" ? "Remarks" : label}</span>
            </button>;
          })}
        </div>
      </div>

      {schoolOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/35 px-4 pt-24 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setSchoolOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="gradly-school-dialog-title" className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-[#f8fafc] px-5 py-4">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#17365D] text-white"><School size={18}/></span><div><h2 id="gradly-school-dialog-title" className="text-base font-extrabold text-gray-900">School profile</h2><p className="text-xs text-gray-500">Set the school identity used by Gradly.</p></div></div>
              <button type="button" onClick={() => setSchoolOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18}/></button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">School name</span><input aria-label="School name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#17365D] focus:ring-4 focus:ring-[#17365D]/10" placeholder="Enter school name" /></label>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">This profile is saved in this browser and restored after refresh or closing/reopening the browser.</div>
              <button type="button" onClick={saveSchool} className="w-full rounded-xl bg-[#17365D] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Save school profile</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>,
    mount
  );
}
